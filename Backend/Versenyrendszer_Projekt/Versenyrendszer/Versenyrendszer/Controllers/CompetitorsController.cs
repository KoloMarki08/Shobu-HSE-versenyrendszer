using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Versenyrendszer.Models;

namespace Versenyrendszer.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class CompetitorsController : ControllerBase
    {
        private readonly AppDbContext _context;

        // Ezen keresztül kapcsolódunk a XAMPP adatbázisodhoz
        public CompetitorsController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/Competitors
        // Ez a metódus kilistázza az összes versenyzőt
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Competitor>>> GetCompetitors()
        {
            return await _context.Competitors.ToListAsync();
        }

        // POST: api/Competitors
        // Ez a metódus elment egy új versenyzőt az adatbázisba
        [HttpPost]
        public async Task<ActionResult<Competitor>> PostCompetitor(Competitor competitor)
        {
            _context.Competitors.Add(competitor);
            await _context.SaveChangesAsync();

            return Ok(competitor);
        }

        // PUT: api/Competitors/5
        // Egy létező versenyző adatainak módosítása
        [HttpPut("{id}")]
        public async Task<IActionResult> PutCompetitor(int id, Competitor competitor)
        {
            // Ellenőrizzük, hogy a linkben lévő ID megegyezik-e a beküldött adat ID-jával
            if (id != competitor.Id)
            {
                return BadRequest("A megadott ID nem egyezik a versenyző ID-jával.");
            }

            _context.Entry(competitor).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!_context.Competitors.Any(e => e.Id == id))
                {
                    return NotFound("A versenyző nem található.");
                }
                else
                {
                    throw; // Ha más hiba van, dobjuk tovább
                }
            }

            return NoContent(); // 204 No Content: Sikeres frissítés, nem küldünk vissza extra adatot
        }

        // DELETE: api/Competitors/5
        // Versenyző törlése az adatbázisból
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteCompetitor(int id)
        {
            var competitor = await _context.Competitors.FindAsync(id);
            if (competitor == null)
            {
                return NotFound("A versenyző nem található.");
            }

            _context.Competitors.Remove(competitor);
            await _context.SaveChangesAsync();

            return NoContent(); // 204 No Content: Sikeres törlés
        }
    }
}