namespace Versenyrendszer.Models
{
    public class Competitor
    {
        public int Id { get; set; }
        public string? Name { get; set; } = string.Empty;
        public int BirthYear { get; set; }
        public int Weight { get; set; }
        public string? Belt { get; set; } = string.Empty;
        public string? Club { get; set; } = string.Empty;
    }
}