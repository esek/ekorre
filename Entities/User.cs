using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace ekorre.Entities
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
        public List<string> Roles { get; set; }
        public byte[] PasswordHash { get; set; }
        public byte[] Salt { get; set; }

        public User WithoutPassword()
        {
            this.PasswordHash = null;
            return this;
        }
    }
}