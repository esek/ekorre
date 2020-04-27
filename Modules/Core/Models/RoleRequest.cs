using System.ComponentModel.DataAnnotations;

namespace Ekorre.Core.Models
{
    public class RoleRequest {
        public string StilId { get; set; }
        [Required]
        public string Role { get; set; }
    }
}