using System.ComponentModel.DataAnnotations;

namespace Ekorre.Core.Models
{
    public class AuthenticationRequest {
        [Required]
        public string StilID { get; set; }
        [Required]
        public string Password { get; set; }
    }
}