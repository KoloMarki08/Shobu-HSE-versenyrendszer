namespace Versenyrendszer.Models
{
    public class Competitor
    {
        public int Id { get; set; } // Elsődleges kulcs
        public string Name { get; set; } = string.Empty; // Név
        public string Club { get; set; } = string.Empty; // Klub (pl. Shobu HSE)
        public string Belt { get; set; } = string.Empty; // Övfokozat
        public int Weight { get; set; } // Súly (kg)
        public int BirthYear { get; set; } // Születési év
    }
}