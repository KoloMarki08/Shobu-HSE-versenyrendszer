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

        public sealed class LoginDto
        {
            public string? Username { get; set; }
            public string? Password { get; set; }
            public string? CaptchaToken { get; set; }
            public string? Honeypot { get; set; }
        }

        public UsersController(AppDbContext context, AuthService auth)
        {
            _context = context;
            _auth = auth;
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
                    role = AuthService.NormalizeRole(u.Role)
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
                string.Equals(u.Username?.Trim(), uname, StringComparison.OrdinalIgnoreCase));

            if (user == null || !AuthService.VerifyPassword(dto.Password, user.Password, out bool needsRehash))
            {
                _auth.RecordFailure(ip);
                return Unauthorized(new { error = "Hibás felhasználónév vagy jelszó!" });
            }

            _auth.ResetFailures(ip);
            var normalizedRole = AuthService.NormalizeRole(user.Role);
            if (needsRehash || !string.Equals(user.Role, normalizedRole, StringComparison.Ordinal))
            {
                user.Password = AuthService.HashPassword(dto.Password);
                user.Role = normalizedRole;
                await _context.SaveChangesAsync();
            }

            var token = _auth.CreateToken(user.Id, user.Username, normalizedRole);
            return Ok(new
            {
                id = user.Id,
                username = user.Username,
                displayName = user.Username,
                role = normalizedRole,
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
                return BadRequest(new { error = "A felhasználónév megadása kötelező!" });
            }

            if (string.IsNullOrEmpty(user.Password) || user.Password.Length < 4)
            {
                return BadRequest(new { error = "A jelszónak legalább 4 karakter hosszúnak kell lennie!" });
            }

            var cleanUsername = user.Username.Trim();
            var exists = await _context.Users
                .AsNoTracking()
                .ToListAsync();
            if (exists.Any(u => string.Equals(u.Username?.Trim(), cleanUsername, StringComparison.OrdinalIgnoreCase)))
            {
                return Conflict(new { error = "Ezzel a felhasználónévvel vagy e-mail címmel már létezik fiók!" });
            }

            var callerToken = AuthService.ExtractTokenFromRequest(Request);
            var caller = _auth.ValidateToken(callerToken);
            var assignedRole = (caller.Valid && caller.Role == "ADMIN")
                ? AuthService.NormalizeRole(user.Role)
                : "COACH";

            var entity = new User
            {
                Username = cleanUsername,
                Password = AuthService.HashPassword(user.Password),
                Role = assignedRole
            };

            _context.Users.Add(entity);
            await _context.SaveChangesAsync();

            var token = _auth.CreateToken(entity.Id, entity.Username, entity.Role);
            return Ok(new
            {
                id = entity.Id,
                username = entity.Username,
                displayName = entity.Username,
                role = entity.Role,
                token
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
