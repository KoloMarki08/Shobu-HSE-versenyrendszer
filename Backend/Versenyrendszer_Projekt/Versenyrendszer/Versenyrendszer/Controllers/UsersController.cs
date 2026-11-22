using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Versenyrendszer.Models;
using Versenyrendszer.Services;

namespace Versenyrendszer.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class UsersController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly AuthService _auth;
        private readonly EmailService _emailService;

        public sealed class LoginDto
        {
            public string? Username { get; set; }
            public string? Password { get; set; }
            public string? CaptchaToken { get; set; }
            public string? Honeypot { get; set; }
        }

        public sealed class RejectRegistrationDto
        {
            public string? Reason { get; set; }
        }

        public sealed class TestEmailDto
        {
            public string? ToEmail { get; set; }
        }

        public UsersController(AppDbContext context, AuthService auth, EmailService emailService)
        {
            _context = context;
            _auth = auth;
            _emailService = emailService;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<object>>> GetUsers()
        {
            var users = await _context.Users
                .AsNoTracking()
                .Select(u => new
                {
                    id = u.Id,
                    username = u.Username,
                    role = AuthService.NormalizeRole(u.Role),
                    approvalStatus = AuthService.NormalizeApprovalStatus(u.ApprovalStatus),
                    email = string.IsNullOrWhiteSpace(u.Email) ? u.Username : u.Email,
                    fullName = u.FullName ?? string.Empty,
                    club = u.Club ?? string.Empty,
                    branchief = u.Branchief ?? string.Empty,
                    phone = u.Phone ?? string.Empty,
                    country = u.Country ?? string.Empty,
                    degree = u.Degree ?? string.Empty,
                    ikoMembership = u.IkoMembership ?? string.Empty,
                    rejectionReason = u.RejectionReason ?? string.Empty,
                    registeredAt = u.RegisteredAt ?? string.Empty
                })
                .ToListAsync();

            return Ok(users);
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginDto? dto)
        {
            if (dto == null || string.IsNullOrWhiteSpace(dto.Username) || string.IsNullOrEmpty(dto.Password))
            {
                return BadRequest(new { error = "Add meg a felhasználónevet és a jelszót!" });
            }

            if (!string.IsNullOrWhiteSpace(dto.Honeypot))
            {
                return BadRequest(new { error = "Automatizált kérés észlelve." });
            }

            var ip = AuthService.GetClientIp(HttpContext);
            if (_auth.IsLockedOut(ip, out int waitSec))
            {
                return StatusCode(StatusCodes.Status429TooManyRequests, new
                {
                    error = $"Túl sok sikertelen belépési kísérlet! Kérlek várj {waitSec} másodpercet."
                });
            }

            var uname = dto.Username.Trim();
            var candidates = await _context.Users.ToListAsync();
            var user = candidates.FirstOrDefault(u =>
                string.Equals(u.Username?.Trim(), uname, StringComparison.OrdinalIgnoreCase) ||
                (!string.IsNullOrWhiteSpace(u.Email) && string.Equals(u.Email.Trim(), uname, StringComparison.OrdinalIgnoreCase)));

            if (user == null || !AuthService.VerifyPassword(dto.Password, user.Password, out bool needsRehash))
            {
                _auth.RecordFailure(ip);
                return Unauthorized(new { error = "Hibás felhasználónév vagy jelszó!" });
            }

            _auth.ResetFailures(ip);
            var normalizedRole = AuthService.NormalizeRole(user.Role);
            var approvalStatus = AuthService.NormalizeApprovalStatus(user.ApprovalStatus);

            if (needsRehash ||
                !string.Equals(user.Role, normalizedRole, StringComparison.Ordinal) ||
                !string.Equals(user.ApprovalStatus, approvalStatus, StringComparison.Ordinal))
            {
                if (needsRehash)
                {
                    user.Password = AuthService.HashPassword(dto.Password);
                }
                user.Role = normalizedRole;
                user.ApprovalStatus = approvalStatus;
                await _context.SaveChangesAsync();
            }

            if (normalizedRole == "COACH" && approvalStatus == "PENDING")
            {
                return StatusCode(StatusCodes.Status403Forbidden, new
                {
                    error = "A regisztrációd jelenleg még szervezői elbírálás alatt áll! Amint jóváhagyásra kerül, e-mailben értesítünk, és utána tudsz bejelentkezni.",
                    approvalStatus = "PENDING"
                });
            }

            if (normalizedRole == "COACH" && approvalStatus == "REJECTED")
            {
                var defaultReason = _emailService.GetSettings(maskPassword: true).DefaultRejectionReason;
                var reason = string.IsNullOrWhiteSpace(user.RejectionReason) ? defaultReason : user.RejectionReason;
                return StatusCode(StatusCodes.Status403Forbidden, new
                {
                    error = $"A regisztrációdat a szervezőség elutasította. Indoklás: {reason}",
                    approvalStatus = "REJECTED",
                    rejectionReason = reason
                });
            }

            var token = _auth.CreateToken(user.Id, user.Username, normalizedRole);
            var displayName = string.IsNullOrWhiteSpace(user.FullName) ? user.Username : user.FullName;
            return Ok(new
            {
                id = user.Id,
                username = user.Username,
                displayName,
                fullName = user.FullName ?? string.Empty,
                email = string.IsNullOrWhiteSpace(user.Email) ? user.Username : user.Email,
                club = user.Club ?? string.Empty,
                degree = user.Degree ?? string.Empty,
                role = normalizedRole,
                approvalStatus,
                token
            });
        }

        [HttpPost]
        public async Task<IActionResult> PostUser([FromBody] User user)
        {
            return await RegisterOrCreateUserInternal(user);
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] User user)
        {
            return await RegisterOrCreateUserInternal(user);
        }

        private async Task<IActionResult> RegisterOrCreateUserInternal(User? user)
        {
            if (user == null || string.IsNullOrWhiteSpace(user.Username))
            {
                return BadRequest(new { error = "A felhasználónév / e-mail cím megadása kötelező!" });
            }

            var callerToken = AuthService.ExtractTokenFromRequest(Request);
            var caller = _auth.ValidateToken(callerToken);
            bool isAdminCaller = caller.Valid && caller.Role == "ADMIN";

            if (!isAdminCaller)
            {
                if (string.IsNullOrEmpty(user.Password) || user.Password.Length < 8 ||
                    !user.Password.Any(char.IsDigit) ||
                    !user.Password.Any(char.IsLetter) ||
                    !user.Password.Any(c => !char.IsLetterOrDigit(c) && !char.IsWhiteSpace(c)))
                {
                    return BadRequest(new
                    {
                        error = "A jelszónak legalább 8 karakter hosszúnak kell lennie, és tartalmaznia kell betűt, számot, valamint legalább 1 speciális karaktert!"
                    });
                }
            }
            else if (string.IsNullOrEmpty(user.Password) || user.Password.Length < 4)
            {
                return BadRequest(new { error = "A jelszónak legalább 4 karakter hosszúnak kell lennie!" });
            }

            var cleanUsername = user.Username.Trim();
            var cleanEmail = string.IsNullOrWhiteSpace(user.Email) ? cleanUsername : user.Email.Trim();

            var exists = await _context.Users
                .AsNoTracking()
                .ToListAsync();

            var existingAccount = exists.FirstOrDefault(u =>
                string.Equals(u.Username?.Trim(), cleanUsername, StringComparison.OrdinalIgnoreCase) ||
                string.Equals(u.Username?.Trim(), cleanEmail, StringComparison.OrdinalIgnoreCase) ||
                (!string.IsNullOrWhiteSpace(u.Email) &&
                 (string.Equals(u.Email.Trim(), cleanEmail, StringComparison.OrdinalIgnoreCase) ||
                  string.Equals(u.Email.Trim(), cleanUsername, StringComparison.OrdinalIgnoreCase))));

            if (existingAccount != null)
            {
                var existStatus = AuthService.NormalizeApprovalStatus(existingAccount.ApprovalStatus);
                if (existStatus == "PENDING")
                {
                    return Conflict(new { error = "Ezzel a felhasználónévvel vagy e-mail címmel már beérkezett egy regisztráció, amely jelenleg elbírálás alatt áll!" });
                }
                return Conflict(new { error = "Ezzel a felhasználónévvel vagy e-mail címmel már létezik fiók!" });
            }

            var assignedRole = isAdminCaller
                ? AuthService.NormalizeRole(user.Role)
                : "COACH";

            var assignedStatus = isAdminCaller
                ? (string.IsNullOrWhiteSpace(user.ApprovalStatus) ? "APPROVED" : AuthService.NormalizeApprovalStatus(user.ApprovalStatus))
                : "PENDING";

            var entity = new User
            {
                Username = cleanUsername,
                Password = AuthService.HashPassword(user.Password),
                Role = assignedRole,
                ApprovalStatus = assignedStatus,
                Email = cleanEmail,
                FullName = (user.FullName ?? string.Empty).Trim(),
                Club = (user.Club ?? string.Empty).Trim(),
                Branchief = (user.Branchief ?? string.Empty).Trim(),
                Phone = (user.Phone ?? string.Empty).Trim(),
                Country = (user.Country ?? string.Empty).Trim(),
                Degree = (user.Degree ?? string.Empty).Trim(),
                IkoMembership = (user.IkoMembership ?? string.Empty).Trim(),
                RejectionReason = string.Empty,
                RegisteredAt = DateTime.UtcNow.ToString("yyyy-MM-dd HH:mm")
            };

            _context.Users.Add(entity);
            await _context.SaveChangesAsync();

            var displayName = string.IsNullOrWhiteSpace(entity.FullName) ? entity.Username : entity.FullName;

            if (assignedStatus == "PENDING")
            {
                var emailRes = await _emailService.SendRegistrationPendingEmailAsync(entity);
                return Ok(new
                {
                    id = entity.Id,
                    username = entity.Username,
                    displayName,
                    email = entity.Email,
                    club = entity.Club,
                    role = entity.Role,
                    approvalStatus = "PENDING",
                    emailSent = emailRes.Sent,
                    emailMessage = emailRes.Message,
                    message = "Köszönjük a regisztrációdat! A regisztrációd jelenleg szervezői elbírálás alatt áll. Automatikus visszaigazoló e-mailt küldtünk, és az elbírálás eredményéről is e-mailben értesítünk."
                });
            }

            var token = _auth.CreateToken(entity.Id, entity.Username, entity.Role);
            return Ok(new
            {
                id = entity.Id,
                username = entity.Username,
                displayName,
                email = entity.Email,
                club = entity.Club,
                role = entity.Role,
                approvalStatus = entity.ApprovalStatus,
                token
            });
        }

        [HttpPost("{id}/resend-pending")]
        public async Task<IActionResult> ResendPendingEmail(int id)
        {
            var existing = await _context.Users.FindAsync(id);
            if (existing == null) return NotFound(new { error = "A felhasználó nem található!" });

            var emailRes = await _emailService.SendRegistrationPendingEmailAsync(existing);
            return Ok(new
            {
                id = existing.Id,
                username = existing.Username,
                approvalStatus = existing.ApprovalStatus,
                emailSent = emailRes.Sent,
                emailMessage = emailRes.Message
            });
        }

        [HttpPost("{id}/approve")]
        public async Task<IActionResult> ApproveUser(int id)
        {
            var existing = await _context.Users.FindAsync(id);
            if (existing == null) return NotFound(new { error = "A felhasználó nem található!" });

            existing.ApprovalStatus = "APPROVED";
            existing.RejectionReason = string.Empty;
            await _context.SaveChangesAsync();

            var emailRes = await _emailService.SendRegistrationApprovedEmailAsync(existing);
            return Ok(new
            {
                id = existing.Id,
                username = existing.Username,
                fullName = existing.FullName,
                club = existing.Club,
                approvalStatus = existing.ApprovalStatus,
                emailSent = emailRes.Sent,
                emailMessage = emailRes.Message
            });
        }

        [HttpPost("{id}/reject")]
        public async Task<IActionResult> RejectUser(int id, [FromBody] RejectRegistrationDto? dto)
        {
            var existing = await _context.Users.FindAsync(id);
            if (existing == null) return NotFound(new { error = "A felhasználó nem található!" });

            var defaultReason = _emailService.GetSettings(maskPassword: true).DefaultRejectionReason;
            var reason = string.IsNullOrWhiteSpace(dto?.Reason) ? defaultReason : dto!.Reason!.Trim();

            existing.ApprovalStatus = "REJECTED";
            existing.RejectionReason = reason;
            await _context.SaveChangesAsync();

            var emailRes = await _emailService.SendRegistrationRejectedEmailAsync(existing, reason);
            return Ok(new
            {
                id = existing.Id,
                username = existing.Username,
                fullName = existing.FullName,
                club = existing.Club,
                approvalStatus = existing.ApprovalStatus,
                rejectionReason = existing.RejectionReason,
                emailSent = emailRes.Sent,
                emailMessage = emailRes.Message
            });
        }

        [HttpGet("email-settings")]
        public IActionResult GetEmailSettings()
        {
            return Ok(_emailService.GetSettings(maskPassword: true));
        }

        [HttpPut("email-settings")]
        public IActionResult PutEmailSettings([FromBody] EmailService.EmailSettingsDto? dto)
        {
            if (dto == null) return BadRequest(new { error = "Hiányzó e-mail beállítások." });
            var saved = _emailService.SaveSettings(dto);
            return Ok(saved);
        }

        [HttpPost("test-email")]
        public async Task<IActionResult> SendTestEmail([FromBody] TestEmailDto? dto)
        {
            if (dto == null || string.IsNullOrWhiteSpace(dto.ToEmail))
            {
                return BadRequest(new { error = "Add meg a teszt e-mail címzettjét!" });
            }

            var res = await _emailService.SendTestEmailAsync(dto.ToEmail);
            return Ok(new
            {
                sent = res.Sent,
                message = res.Message
            });
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> PutUser(int id, [FromBody] User user)
        {
            if (id != user.Id) return BadRequest();
            var existing = await _context.Users.FindAsync(id);
            if (existing == null) return NotFound();

            if (!string.IsNullOrWhiteSpace(user.Username))
            {
                existing.Username = user.Username.Trim();
            }
            if (!string.IsNullOrWhiteSpace(user.Password))
            {
                existing.Password = AuthService.IsPasswordHashed(user.Password)
                    ? user.Password
                    : AuthService.HashPassword(user.Password);
            }
            existing.Role = AuthService.NormalizeRole(user.Role);
            if (!string.IsNullOrWhiteSpace(user.ApprovalStatus))
            {
                existing.ApprovalStatus = AuthService.NormalizeApprovalStatus(user.ApprovalStatus);
            }
            if (!string.IsNullOrWhiteSpace(user.Email)) existing.Email = user.Email.Trim();
            if (!string.IsNullOrWhiteSpace(user.FullName)) existing.FullName = user.FullName.Trim();
            if (!string.IsNullOrWhiteSpace(user.Club)) existing.Club = user.Club.Trim();
            if (!string.IsNullOrWhiteSpace(user.Branchief)) existing.Branchief = user.Branchief.Trim();
            if (!string.IsNullOrWhiteSpace(user.Phone)) existing.Phone = user.Phone.Trim();
            if (!string.IsNullOrWhiteSpace(user.Country)) existing.Country = user.Country.Trim();
            if (!string.IsNullOrWhiteSpace(user.Degree)) existing.Degree = user.Degree.Trim();
            if (!string.IsNullOrWhiteSpace(user.IkoMembership)) existing.IkoMembership = user.IkoMembership.Trim();
            if (user.RejectionReason != null) existing.RejectionReason = user.RejectionReason.Trim();

            await _context.SaveChangesAsync();
            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteUser(int id)
        {
            var user = await _context.Users.FindAsync(id);
            if (user == null) return NotFound();
            _context.Users.Remove(user);
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}
