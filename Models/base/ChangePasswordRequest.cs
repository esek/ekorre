using System.ComponentModel.DataAnnotations;

namespace ekorre.Models
{
    public class ChangePasswordRequest {
        [Required]
        public string OldPassword { get; set; }
        [Required]
        public string NewPassword { get; set; }
    }
}