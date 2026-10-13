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
    }
}