namespace Versenyrendszer.Models
{
    public class Match
    {
        public int Id { get; set; }

        // Melyik kategória meccse ez? (pl. Junior Fiú Kumite)
        public int CategoryId { get; set; }
        public Category? Category { get; set; }

        // Melyik tatamin zajlik? (pl. A tatami)
        public int TatamiId { get; set; }
        public Tatami? Tatami { get; set; }

        // Ki a Piros (Aka) és ki a Fehér (Shiro)?
        public int? Competitor1Id { get; set; }
        public Competitor? Competitor1 { get; set; }

        public int? Competitor2Id { get; set; }
        public Competitor? Competitor2 { get; set; }

        // A meccs állapota és sorszáma
        public int MatchOrder { get; set; } // Hanyadik meccs a tatamin
        public bool IsFinished { get; set; }
        public int? WinnerId { get; set; } // Ha vége, ki nyert
    }
}