using System.ComponentModel.DataAnnotations;

namespace ekorre.Models
{
    public class RoleRequest {
        [Required]
        public string Role { get; set; }
    }
}