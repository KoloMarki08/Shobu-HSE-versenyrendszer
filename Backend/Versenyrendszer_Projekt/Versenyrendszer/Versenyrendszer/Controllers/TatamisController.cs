using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Versenyrendszer.Models;

namespace Versenyrendszer.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class TatamisController : ControllerBase
    {
        private readonly AppDbContext _context;

        public TatamisController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<Tatami>>> GetTatamis()
        {
            return await _context.Tatamis.ToListAsync();
        }

        [HttpPost]
        public async Task<ActionResult<Tatami>> PostTatami(Tatami tatami)
        {
            _context.Tatamis.Add(tatami);
            await _context.SaveChangesAsync();
            return Ok(tatami);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> PutTatami(int id, Tatami tatami)
        {
            if (id != tatami.Id) return BadRequest();
            _context.Entry(tatami).State = EntityState.Modified;
            await _context.SaveChangesAsync();
            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteTatami(int id)
        {
            var tatami = await _context.Tatamis.FindAsync(id);
            if (tatami == null) return NotFound();
            _context.Tatamis.Remove(tatami);
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}