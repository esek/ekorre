using System.ComponentModel.DataAnnotations;

namespace Ekorre.Core.Models
{
    public class ChangePasswordRequest {
        public string StilId { get; set; }
        [Required]
        public string OldPassword { get; set; }
        [Required]
        public string NewPassword { get; set; }
    }
}