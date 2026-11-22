using System.Collections.Concurrent;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Versenyrendszer.Models;

namespace Versenyrendszer.Services
{
    public class AuthService
    {
        private const int Pbkdf2Iterations = 100_000;
        private const int SaltSize = 16;
        private const int HashSize = 32;
        private const int TokenLifetimeHours = 36;
        private const int MaxFailedAttempts = 8;
        private static readonly TimeSpan FailureWindow = TimeSpan.FromMinutes(5);
        private static readonly TimeSpan LockoutDuration = TimeSpan.FromSeconds(120);

        private readonly byte[] _secretKey;
        private readonly ConcurrentDictionary<string, LoginAttemptState> _loginAttempts = new(StringComparer.OrdinalIgnoreCase);

        private sealed class LoginAttemptState
        {
            public int Count;
            public DateTime WindowStartUtc;
            public DateTime LockedUntilUtc;
        }

        public AuthService(IWebHostEnvironment env)
        {
            var appDataDir = Path.Combine(env.ContentRootPath, "App_Data");
            Directory.CreateDirectory(appDataDir);
            var keyPath = Path.Combine(appDataDir, "auth_hmac.key");
            _secretKey = LoadOrCreateSecretKey(keyPath);
        }

        private static byte[] LoadOrCreateSecretKey(string keyPath)
        {
            try
            {
                if (File.Exists(keyPath))
                {
                    var existing = File.ReadAllBytes(keyPath);
                    if (existing.Length >= 32)
                    {
                        return existing;
                    }
                }

                var fresh = RandomNumberGenerator.GetBytes(64);
                var tmpPath = keyPath + ".tmp";
                File.WriteAllBytes(tmpPath, fresh);
                File.Move(tmpPath, keyPath, overwrite: true);
                return fresh;
            }
            catch
            {
                return RandomNumberGenerator.GetBytes(64);
            }
        }

        public static bool IsPasswordHashed(string? password)
        {
            return !string.IsNullOrEmpty(password) && password.StartsWith("PBKDF2$", StringComparison.Ordinal);
        }

        public static string HashPassword(string plainPassword)
        {
            if (string.IsNullOrEmpty(plainPassword))
            {
                throw new ArgumentException("A jelszó nem lehet üres.", nameof(plainPassword));
            }

            var salt = RandomNumberGenerator.GetBytes(SaltSize);
            var hash = Rfc2898DeriveBytes.Pbkdf2(
                plainPassword,
                salt,
                Pbkdf2Iterations,
                HashAlgorithmName.SHA256,
                HashSize);

            return $"PBKDF2${Pbkdf2Iterations}${Convert.ToBase64String(salt)}${Convert.ToBase64String(hash)}";
        }

        public static bool VerifyPassword(string? plainPassword, string? storedPassword, out bool needsRehash)
        {
            needsRehash = false;
            if (string.IsNullOrEmpty(plainPassword) || string.IsNullOrEmpty(storedPassword))
            {
                return false;
            }

            if (IsPasswordHashed(storedPassword))
            {
                var parts = storedPassword.Split('$');
                if (parts.Length != 4 || !int.TryParse(parts[1], out int iterations) || iterations < 10_000)
                {
                    return false;
                }

                byte[] salt;
                byte[] expectedHash;
                try
                {
                    salt = Convert.FromBase64String(parts[2]);
                    expectedHash = Convert.FromBase64String(parts[3]);
                }
                catch
                {
                    return false;
                }

                var actualHash = Rfc2898DeriveBytes.Pbkdf2(
                    plainPassword,
                    salt,
                    iterations,
                    HashAlgorithmName.SHA256,
                    expectedHash.Length);

                return CryptographicOperations.FixedTimeEquals(actualHash, expectedHash);
            }

            // Régi sima szöveges jelszó ellenőrzése fix-idős összehasonlítással, majd jelzés az automatikus frissítéshez
            var plainBytes = Encoding.UTF8.GetBytes(plainPassword);
            var storedBytes = Encoding.UTF8.GetBytes(storedPassword);
            var match = CryptographicOperations.FixedTimeEquals(plainBytes, storedBytes);
            if (match)
            {
                needsRehash = true;
            }
            return match;
        }

        public static string NormalizeRole(string? role)
        {
            var upper = (role ?? string.Empty).Trim().ToUpperInvariant();
            if (upper == "ADMIN") return "ADMIN";
            if (upper == "JUDGE" || upper == "BIRO" || upper == "REFEREE") return "JUDGE";
            return "COACH";
        }

        public static string ExtractTokenFromRequest(HttpRequest request)
        {
            var auth = request.Headers["Authorization"].FirstOrDefault();
            if (!string.IsNullOrWhiteSpace(auth)) return auth;
            var custom = request.Headers["X-Tatami-Token"].FirstOrDefault();
            return custom ?? string.Empty;
        }

        public static string GetClientIp(HttpContext context)
        {
            var forwarded = context.Request.Headers["X-Forwarded-For"].FirstOrDefault();
            if (!string.IsNullOrWhiteSpace(forwarded))
            {
                var first = forwarded.Split(',')[0].Trim();
                if (!string.IsNullOrWhiteSpace(first)) return first;
            }
            return context.Connection.RemoteIpAddress?.ToString() ?? "unknown";
        }

        public static string NormalizeApprovalStatus(string? status)
        {
            var upper = (status ?? string.Empty).Trim().ToUpperInvariant();
            if (upper == "PENDING") return "PENDING";
            if (upper == "REJECTED") return "REJECTED";
            return "APPROVED";
        }

        public static async Task EnsureUserSchemaColumnsAsync(AppDbContext db)
        {
            var alterStatements = new[]
            {
                "ALTER TABLE `Users` ADD COLUMN `ApprovalStatus` VARCHAR(32) NOT NULL DEFAULT 'APPROVED'",
                "ALTER TABLE `Users` ADD COLUMN `Email` VARCHAR(255) NOT NULL DEFAULT ''",
                "ALTER TABLE `Users` ADD COLUMN `FullName` VARCHAR(255) NOT NULL DEFAULT ''",
                "ALTER TABLE `Users` ADD COLUMN `Club` VARCHAR(255) NOT NULL DEFAULT ''",
                "ALTER TABLE `Users` ADD COLUMN `Branchief` VARCHAR(255) NOT NULL DEFAULT ''",
                "ALTER TABLE `Users` ADD COLUMN `Phone` VARCHAR(64) NOT NULL DEFAULT ''",
                "ALTER TABLE `Users` ADD COLUMN `Country` VARCHAR(128) NOT NULL DEFAULT ''",
                "ALTER TABLE `Users` ADD COLUMN `Degree` VARCHAR(64) NOT NULL DEFAULT ''",
                "ALTER TABLE `Users` ADD COLUMN `IkoMembership` VARCHAR(128) NOT NULL DEFAULT ''",
                "ALTER TABLE `Users` ADD COLUMN `RejectionReason` VARCHAR(512) NOT NULL DEFAULT ''",
                "ALTER TABLE `Users` ADD COLUMN `RegisteredAt` VARCHAR(64) NOT NULL DEFAULT ''"
            };

            foreach (var sql in alterStatements)
            {
                try
                {
                    await db.Database.ExecuteSqlRawAsync(sql);
                }
                catch
                {
                    // Az oszlop már létezik az adatbázisban
                }
            }
        }

        public static async Task EnsureDefaultUsersAndHashesAsync(AppDbContext db)
        {
            await EnsureUserSchemaColumnsAsync(db);

            var existingUsers = await db.Users.ToListAsync();
            foreach (var u in existingUsers)
            {
                if (!string.IsNullOrEmpty(u.Password) && !IsPasswordHashed(u.Password))
                {
                    u.Password = HashPassword(u.Password);
                }
                u.Role = NormalizeRole(u.Role);
                u.ApprovalStatus = NormalizeApprovalStatus(u.ApprovalStatus);
            }

            var defaults = new (string Username, string PlainPassword, string Role)[]
            {
                ("KoloMarki", "1234", "ADMIN"),
                ("A tatami", "A-tatami", "JUDGE"),
                ("Balint.Tornai", "1234", "COACH"),
                ("admin", "admin123", "ADMIN"),
                ("biro", "biro123", "JUDGE"),
                ("edzo", "edzo123", "COACH")
            };

            foreach (var def in defaults)
            {
                if (!existingUsers.Any(u => string.Equals(u.Username, def.Username, StringComparison.OrdinalIgnoreCase)))
                {
                    db.Users.Add(new User
                    {
                        Username = def.Username,
                        Password = HashPassword(def.PlainPassword),
                        Role = def.Role,
                        ApprovalStatus = "APPROVED"
                    });
                }
            }

            await db.SaveChangesAsync();
        }

        public string CreateToken(int userId, string username, string role)
        {
            var payload = new
            {
                uid = userId,
                sub = username,
                role = NormalizeRole(role),
                exp = DateTimeOffset.UtcNow.AddHours(TokenLifetimeHours).ToUnixTimeSeconds()
            };

            var payloadJson = JsonSerializer.Serialize(payload);
            var payloadB64 = Base64UrlEncode(Encoding.UTF8.GetBytes(payloadJson));
            var sigBytes = HMACSHA256.HashData(_secretKey, Encoding.UTF8.GetBytes(payloadB64));
            var sigB64 = Base64UrlEncode(sigBytes);
            return $"{payloadB64}.{sigB64}";
        }

        public (bool Valid, int UserId, string Username, string Role) ValidateToken(string? rawHeaderOrToken)
        {
            if (string.IsNullOrWhiteSpace(rawHeaderOrToken))
            {
                return (false, 0, string.Empty, string.Empty);
            }

            var token = rawHeaderOrToken.Trim();
            if (token.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
            {
                token = token.Substring(7).Trim();
            }

            var dotIdx = token.IndexOf('.');
            if (dotIdx <= 0 || dotIdx >= token.Length - 1)
            {
                return (false, 0, string.Empty, string.Empty);
            }

            var payloadB64 = token.Substring(0, dotIdx);
            var sigB64 = token.Substring(dotIdx + 1);
            if (sigB64.Contains('.'))
            {
                return (false, 0, string.Empty, string.Empty);
            }

            byte[] providedSig;
            try
            {
                providedSig = Base64UrlDecode(sigB64);
            }
            catch
            {
                return (false, 0, string.Empty, string.Empty);
            }

            var expectedSig = HMACSHA256.HashData(_secretKey, Encoding.UTF8.GetBytes(payloadB64));
            if (!CryptographicOperations.FixedTimeEquals(providedSig, expectedSig))
            {
                return (false, 0, string.Empty, string.Empty);
            }

            try
            {
                var payloadBytes = Base64UrlDecode(payloadB64);
                using var doc = JsonDocument.Parse(payloadBytes);
                var root = doc.RootElement;

                if (!root.TryGetProperty("exp", out var expProp) || !expProp.TryGetInt64(out long exp))
                {
                    return (false, 0, string.Empty, string.Empty);
                }
                if (exp <= DateTimeOffset.UtcNow.ToUnixTimeSeconds())
                {
                    return (false, 0, string.Empty, string.Empty);
                }

                int uid = root.TryGetProperty("uid", out var uidProp) && uidProp.TryGetInt32(out int parsedUid) ? parsedUid : 0;
                string sub = root.TryGetProperty("sub", out var subProp) ? (subProp.GetString() ?? string.Empty) : string.Empty;
                string role = root.TryGetProperty("role", out var roleProp) ? NormalizeRole(roleProp.GetString()) : "COACH";
                if (string.IsNullOrWhiteSpace(sub))
                {
                    return (false, 0, string.Empty, string.Empty);
                }

                return (true, uid, sub, role);
            }
            catch
            {
                return (false, 0, string.Empty, string.Empty);
            }
        }

        public bool IsLockedOut(string ip, out int retrySeconds)
        {
            retrySeconds = 0;
            if (string.IsNullOrWhiteSpace(ip)) return false;

            if (_loginAttempts.TryGetValue(ip, out var state))
            {
                lock (state)
                {
                    var now = DateTime.UtcNow;
                    if (state.LockedUntilUtc > now)
                    {
                        retrySeconds = Math.Max(1, (int)Math.Ceiling((state.LockedUntilUtc - now).TotalSeconds));
                        return true;
                    }
                }
            }
            return false;
        }

        public void RecordFailure(string ip)
        {
            if (string.IsNullOrWhiteSpace(ip)) return;
            var now = DateTime.UtcNow;
            var state = _loginAttempts.GetOrAdd(ip, _ => new LoginAttemptState { WindowStartUtc = now });
            lock (state)
            {
                if (now - state.WindowStartUtc > FailureWindow)
                {
                    state.Count = 0;
                    state.WindowStartUtc = now;
                    state.LockedUntilUtc = DateTime.MinValue;
                }

                state.Count++;
                if (state.Count >= MaxFailedAttempts)
                {
                    state.LockedUntilUtc = now.Add(LockoutDuration);
                }
            }
        }

        public void ResetFailures(string ip)
        {
            if (string.IsNullOrWhiteSpace(ip)) return;
            _loginAttempts.TryRemove(ip, out _);
        }

        private static string Base64UrlEncode(byte[] data)
        {
            return Convert.ToBase64String(data)
                .TrimEnd('=')
                .Replace('+', '-')
                .Replace('/', '_');
        }

        private static byte[] Base64UrlDecode(string input)
        {
            var s = input.Replace('-', '+').Replace('_', '/');
            switch (s.Length % 4)
            {
                case 2: s += "=="; break;
                case 3: s += "="; break;
            }
            return Convert.FromBase64String(s);
        }
    }
}
