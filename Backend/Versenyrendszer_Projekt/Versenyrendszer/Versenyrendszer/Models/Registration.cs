namespace Versenyrendszer.Models
{
    public class Registration
    {
        public int Id { get; set; }

        public int CompetitorId { get; set; }
        public Competitor? Competitor { get; set; }

        public int CategoryId { get; set; }
        public Category? Category { get; set; }

        // Az SQL-ben lévő extra mezők:
        public int? Placement { get; set; } // helyezes
        public int? Score { get; set; } // pontszam
        public bool IsSeeded { get; set; } // kiemelt
    }
}