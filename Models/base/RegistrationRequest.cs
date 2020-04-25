using System.ComponentModel.DataAnnotations;

namespace ekorre.Models
{
    public class RegistrationRequest {
        [Required]
        public string Name { get; set; }
        [Required]
        public string Programme { get; set; }
        [Required]
        public string Email { get; set; }
        [Required]
        public string PhoneNumber { get; set; }
        public string StilID { get; set; }
        [Required]
        public string Password { get; set; }
    }
}