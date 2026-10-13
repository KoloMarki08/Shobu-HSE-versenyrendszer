namespace Versenyrendszer.Models
{
    public class Tournament
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty; // Pl.: "V. Halas Kupa"
        public DateTime Date { get; set; }
        public string Status { get; set; } = string.Empty; // Pl.: "ÉLŐ / NYITVA"
        public string Organizer { get; set; } = string.Empty; // Pl.: "Vácrátóti HSE - Tornai Bálint"
    }
}