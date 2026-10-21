using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Versenyrendszer.Models;

namespace Versenyrendszer.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class TournamentsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public TournamentsController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<Tournament>>> GetTournaments()
        {
            try
            {
                return await _context.Tournaments.ToListAsync();
            }
            catch (Exception ex)
            {
                // Ha bármilyen adatbázis-olvasási hiba van, logoljuk és visszaadunk egy üres listát
                System.Console.WriteLine("Hiba a versenyek lekérésekor: " + ex.Message);
                return Ok(new List<Tournament>());
            }
        }

        [HttpPost]
        public async Task<ActionResult<Tournament>> PostTournament(Tournament tournament)
        {
            _context.Tournaments.Add(tournament);
            await _context.SaveChangesAsync();
            return Ok(tournament);
        }

        // POST: api/Tournaments/reset-seed
        // Töröl minden adatot, visszaállítja az ID-kat 1-re, és a C# Backenden keresztül
        // feltölti a JO_shobu_system_adatbazis.sql összes adatát!
        // POST: api/Tournaments/reset-seed
        [HttpPost("reset-seed")]
        public async Task<IActionResult> ResetAndSeedDatabase()
        {
            try
            {
                // 1. Minden rekord biztonságos törlése megfelelő sorrendben (Idegen kulcsok miatt!)
                _context.Matches.RemoveRange(_context.Matches);
                _context.Registrations.RemoveRange(_context.Registrations);
                await _context.SaveChangesAsync();

                _context.Competitors.RemoveRange(_context.Competitors);
                _context.Categories.RemoveRange(_context.Categories);
                _context.Tatamis.RemoveRange(_context.Tatamis);
                _context.Tournaments.RemoveRange(_context.Tournaments);
                await _context.SaveChangesAsync();

                // 2. AUTO_INCREMENT ID-k visszaállítása 1-re (ez nem ütközik idegen kulcsba!)
                await _context.Database.ExecuteSqlRawAsync("ALTER TABLE `matches` AUTO_INCREMENT = 1;");
                await _context.Database.ExecuteSqlRawAsync("ALTER TABLE `registrations` AUTO_INCREMENT = 1;");
                await _context.Database.ExecuteSqlRawAsync("ALTER TABLE `competitors` AUTO_INCREMENT = 1;");
                await _context.Database.ExecuteSqlRawAsync("ALTER TABLE `categories` AUTO_INCREMENT = 1;");
                await _context.Database.ExecuteSqlRawAsync("ALTER TABLE `tatamis` AUTO_INCREMENT = 1;");
                await _context.Database.ExecuteSqlRawAsync("ALTER TABLE `tournaments` AUTO_INCREMENT = 1;");

                // 3. Alap felhasználók biztosítása (ha még nincsenek benne)
                if (!await _context.Users.AnyAsync(u => u.Username == "KoloMarki"))
                {
                    _context.Users.Add(new User { Username = "KoloMarki", Password = "1234", Role = "ADMIN" });
                }
                if (!await _context.Users.AnyAsync(u => u.Username == "A tatami"))
                {
                    _context.Users.Add(new User { Username = "A tatami", Password = "A-tatami", Role = "JUDGE" });
                }
                if (!await _context.Users.AnyAsync(u => u.Username == "Balint.Tornai"))
                {
                    _context.Users.Add(new User { Username = "Balint.Tornai", Password = "1234", Role = "COACH" });
                }

                // 4. Verseny a JO_shobu_system_adatbazis.sql-ből (ID = 1)
                _context.Tournaments.Add(new Tournament
                {
                    Name = "Shobu HSE Országos Bajnokság 2026",
                    Date = new DateTime(2026, 5, 20),
                    Status = "ÉLŐ / NYITVA",
                    Organizer = "Vácrátóti HSE - Tornai Bálint"
                });

                // 5. Tatamik (ID = 1..3)
                _context.Tatamis.AddRange(
                    new Tatami { Name = "Tatami A" },
                    new Tatami { Name = "Tatami B" },
                    new Tatami { Name = "Tatami C" }
                );
                await _context.SaveChangesAsync();

                // 6. A 31 Kategória a JO_shobu_system_adatbazis.sql-ből (ID = 1..31)
                var kategoriak = new List<Category>
                {
                    new Category { Name = "Kata Girls 8-9 y.o.",        MatchType = "KATA",   Gender = "Girls", MinAge = 8,  MaxAge = 9 },
                    new Category { Name = "Kata Boys 8-9 y.o.",         MatchType = "KATA",   Gender = "Boys",  MinAge = 8,  MaxAge = 9 },
                    new Category { Name = "Kata Girls 10-11 y.o.",      MatchType = "KATA",   Gender = "Girls", MinAge = 10, MaxAge = 11 },
                    new Category { Name = "Kata Boys 10-11 y.o.",       MatchType = "KATA",   Gender = "Boys",  MinAge = 10, MaxAge = 11 },
                    new Category { Name = "Kata Girls 12-13 y.o.",      MatchType = "KATA",   Gender = "Girls", MinAge = 12, MaxAge = 13 },
                    new Category { Name = "Kata Boys 12-13 y.o.",       MatchType = "KATA",   Gender = "Boys",  MinAge = 12, MaxAge = 13 },
                    new Category { Name = "Kata Girls 14-15 y.o.",      MatchType = "KATA",   Gender = "Girls", MinAge = 14, MaxAge = 15 },
                    new Category { Name = "Kata Boys 14-15 y.o.",       MatchType = "KATA",   Gender = "Boys",  MinAge = 14, MaxAge = 15 },
                    new Category { Name = "Kata Girls 16-17 y.o.",      MatchType = "KATA",   Gender = "Girls", MinAge = 16, MaxAge = 17 },
                    new Category { Name = "Kata Boys 16-17 y.o.",       MatchType = "KATA",   Gender = "Boys",  MinAge = 16, MaxAge = 17 },
                    new Category { Name = "Kata Women 18-34 y.o.",      MatchType = "KATA",   Gender = "Women", MinAge = 18, MaxAge = 34 },
                    new Category { Name = "Kata Men 18-34 y.o.",        MatchType = "KATA",   Gender = "Men",   MinAge = 18, MaxAge = 34 },
                    new Category { Name = "Kata Women 35-49 y.o.",      MatchType = "KATA",   Gender = "Women", MinAge = 35, MaxAge = 49 },
                    new Category { Name = "Kata Men 35-49 y.o.",        MatchType = "KATA",   Gender = "Men",   MinAge = 35, MaxAge = 49 },
                    new Category { Name = "Kata Women 50+ y.o.",        MatchType = "KATA",   Gender = "Women", MinAge = 50, MaxAge = 99 },
                    new Category { Name = "Kata Men 50+ y.o.",          MatchType = "KATA",   Gender = "Men",   MinAge = 50, MaxAge = 99 },
                    new Category { Name = "Kumite Girls 8-9 y.o.",      MatchType = "KUMITE", Gender = "Girls", MinAge = 8,  MaxAge = 9 },
                    new Category { Name = "Kumite Boys 8-9 y.o.",       MatchType = "KUMITE", Gender = "Boys",  MinAge = 8,  MaxAge = 9 },
                    new Category { Name = "Kumite Girls 10-11 y.o.",    MatchType = "KUMITE", Gender = "Girls", MinAge = 10, MaxAge = 11 },
                    new Category { Name = "Kumite Boys 10-11 y.o.",     MatchType = "KUMITE", Gender = "Boys",  MinAge = 10, MaxAge = 11 },
                    new Category { Name = "Kumite Girls 12-13 y.o.",    MatchType = "KUMITE", Gender = "Girls", MinAge = 12, MaxAge = 13 },
                    new Category { Name = "Kumite Boys 12-13 y.o.",     MatchType = "KUMITE", Gender = "Boys",  MinAge = 12, MaxAge = 13 },
                    new Category { Name = "Kumite Girls 14-15 y.o.",    MatchType = "KUMITE", Gender = "Girls", MinAge = 14, MaxAge = 15 },
                    new Category { Name = "Kumite Boys 14-15 y.o.",     MatchType = "KUMITE", Gender = "Boys",  MinAge = 14, MaxAge = 15 },
                    new Category { Name = "Kumite Girls 16-17 y.o.",    MatchType = "KUMITE", Gender = "Girls", MinAge = 16, MaxAge = 17 },
                    new Category { Name = "Kumite Boys 16-17 y.o.",     MatchType = "KUMITE", Gender = "Boys",  MinAge = 16, MaxAge = 17 },
                    new Category { Name = "Kumite Women 18+ y.o. Open", MatchType = "KUMITE", Gender = "Women", MinAge = 18, MaxAge = 99 },
                    new Category { Name = "Kumite Men 18+ y.o. Open",   MatchType = "KUMITE", Gender = "Men",   MinAge = 18, MaxAge = 99 },
                    new Category { Name = "Kumite Women 35+ y.o.",      MatchType = "KUMITE", Gender = "Women", MinAge = 35, MaxAge = 99 },
                    new Category { Name = "Kumite Men 35-44 y.o.",      MatchType = "KUMITE", Gender = "Men",   MinAge = 35, MaxAge = 44 },
                    new Category { Name = "Kumite Men 45+ y.o.",        MatchType = "KUMITE", Gender = "Men",   MinAge = 45, MaxAge = 99 }
                };
                _context.Categories.AddRange(kategoriak);
                await _context.SaveChangesAsync();

                // 7. Versenyzők a JO_shobu_system_adatbazis.sql-ből ([K1]..[K84])
                string[] alapNevek = { "Kovács Péter", "Nagy Zsófia", "Szabó Dávid", "Tóth Réka", "Varga Máté", "Kiss Dóra" };
                string[] alapKlubok = { "Vácrátóti HSE", "Tatami SE", "Budo SE", "Honbu Dojo", "Karate Akadémia", "Sakura SE" };
                string[] alapOvek = { "4. kyu", "6. kyu", "2. kyu", "5. kyu", "1. kyu", "3. kyu", "1. dan", "8. kyu" };
                int[] alapSulyok = { 72, 32, 48, 45, 78, 74, 88, 36, 57, 63, 84, 49, 73, 61, 44, 39, 95, 33, 65, 81 };

                var versenyzok = new List<Competitor>();
                int idx = 0;
                for (int k = 1; k <= 84; k++)
                {
                    for (int n = 0; n < 6; n++)
                    {
                        if (k == 1 && n == 5) continue;
                        if (k == 84 && n == 5) continue;

                        int katIndex = (idx % 31);
                        int kor = (kategoriak[katIndex].MinAge + kategoriak[katIndex].MaxAge) / 2;
                        if (kor > 45) kor = 42;

                        versenyzok.Add(new Competitor
                        {
                            Name = $"{alapNevek[n]} [K{k}]",
                            Club = alapKlubok[n],
                            Weight = alapSulyok[(idx * 3 + n) % alapSulyok.Length],
                            Belt = alapOvek[(k + n) % alapOvek.Length],
                            BirthYear = 2026 - kor
                        });
                        idx++;
                    }
                }
                _context.Competitors.AddRange(versenyzok);
                await _context.SaveChangesAsync();

                // 8. Nevezések összekötése a valódi mentett Category ID-kkal!
                var nevezesek = new List<Registration>();
                for (int i = 0; i < versenyzok.Count; i++)
                {
                    var v = versenyzok[i];
                    var celKat = kategoriak[i % kategoriak.Count];
                    nevezesek.Add(new Registration
                    {
                        CompetitorId = v.Id,
                        CategoryId = celKat.Id
                    });
                }
                _context.Registrations.AddRange(nevezesek);
                await _context.SaveChangesAsync();

                return Ok(new
                {
                    message = $"Sikeres Reset! {versenyzok.Count} versenyző, {kategoriak.Count} kategória és {nevezesek.Count} nevezés betöltve!"
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine("RESET-SEED HIBA: " + ex.ToString());
                return StatusCode(500, new { error = ex.InnerException?.Message ?? ex.Message });
            }
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> PutTournament(int id, Tournament tournament)
        {
            if (id != tournament.Id) return BadRequest();
            _context.Entry(tournament).State = EntityState.Modified;
            await _context.SaveChangesAsync();
            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteTournament(int id)
        {
            var tournament = await _context.Tournaments.FindAsync(id);
            if (tournament == null) return NotFound();
            _context.Tournaments.Remove(tournament);
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}