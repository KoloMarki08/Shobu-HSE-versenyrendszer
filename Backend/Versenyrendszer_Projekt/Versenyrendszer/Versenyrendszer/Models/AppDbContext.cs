using Microsoft.EntityFrameworkCore;

namespace Versenyrendszer.Models
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
        {
        }

        // A RÉGI TÁBLÁK (Ezek kellettek a Controllereknek)
        public DbSet<Competitor> Competitors { get; set; }
        public DbSet<Category> Categories { get; set; }
        public DbSet<Registration> Registrations { get; set; }

        // AZ ÚJ TÁBLÁK
        public DbSet<User> Users { get; set; }
        public DbSet<Tournament> Tournaments { get; set; }
        public DbSet<Tatami> Tatamis { get; set; }
        public DbSet<Match> Matches { get; set; }
    }
}