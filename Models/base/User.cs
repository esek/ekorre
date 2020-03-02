using System;
using System.ComponentModel.DataAnnotations;

namespace ekorre.Models {
    public class User {
        [Key]
        public long UID { get; set; }
        public string StilID { get; set; }
        public string Name { get; set; }
        public string PasswordHash { get; set; }
        public DateTime DateJoined { get; set; }
        public string[] Roles { get; set; }

        public static User WithoutPassword(User u) {
            u.PasswordHash = null;
            return u;
        }
    }
}