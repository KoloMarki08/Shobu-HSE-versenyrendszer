namespace Versenyrendszer.Models
{
    public class Category
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty; // megnevezes
        public string MatchType { get; set; } = string.Empty; // tipus (KATA/KUMITE)
        public string Gender { get; set; } = string.Empty; // nem
        public int MinAge { get; set; } // min_kor
        public int MaxAge { get; set; } // max_kor
    }
}