using Microsoft.EntityFrameworkCore;

namespace Versenyrendszer.Models
{
    public class AppDbContext : DbContext
    {
        // Ez a konstruktor veszi át a beállításokat a Program.cs-ből
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
        {
        }

        // Ezekből a DbSet-ekből lesznek a fizikai táblák a MySQL-ben
        public DbSet<Competitor> Competitors { get; set; }
        public DbSet<Category> Categories { get; set; }
        public DbSet<Registration> Registrations { get; set; }
    }
}