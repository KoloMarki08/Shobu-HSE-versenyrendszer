namespace Versenyrendszer.Models
{
    public class User
    {
        public int Id { get; set; }
        public string Username { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty; // "ADMIN", "JUDGE", "COACH"
        public string ApprovalStatus { get; set; } = "APPROVED"; // "PENDING", "APPROVED", "REJECTED"
        public string Email { get; set; } = string.Empty;
        public string FullName { get; set; } = string.Empty;
        public string Club { get; set; } = string.Empty;
        public string Branchief { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;
        public string Country { get; set; } = string.Empty;
        public string Degree { get; set; } = string.Empty;
        public string IkoMembership { get; set; } = string.Empty;
        public string RejectionReason { get; set; } = string.Empty;
        public string RegisteredAt { get; set; } = string.Empty;
    }
}