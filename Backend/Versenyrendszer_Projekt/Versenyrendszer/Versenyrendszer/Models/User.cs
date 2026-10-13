namespace Versenyrendszer.Models
{
    public class User
    {
        public int Id { get; set; }
        public string Username { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty; // Élesben majd titkosítjuk (Hash), egyelőre jó így
        public string Role { get; set; } = string.Empty; // "Admin", "Referee", "Coach"
    }
}