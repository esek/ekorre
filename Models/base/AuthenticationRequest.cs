using System.ComponentModel.DataAnnotations;

namespace ekorre.Models
{
    public class AuthenticationRequest {
        [Required]
        public string StilID { get; set; }
        [Required]
        public string Password { get; set; }
    }
}