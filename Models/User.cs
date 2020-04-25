using System;
using System.ComponentModel.DataAnnotations;

namespace ekorre.Models
{
    public class User
    {
        [Key]
        public string StilID { get; set; }
        public string Name { get; set; }
        public string Programme { get; set; }
        public string Email { get; set; }
        public string PhoneNumber { get; set; }
        public DateTime DateJoined { get; set; }
        public string[] Roles { get; set; }
        public byte[] PasswordHash { get; set; }
        public byte[] Salt { get; set; }

        public static User WithoutPassword(User u)
        {
            u.PasswordHash = null;
            return u;
        }
    }
}