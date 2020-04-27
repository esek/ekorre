using Ekorre.Core.Models;

namespace Ekorre.Core.Entities
{
    public class AuthenticatedUser {
        public User User { get; set; }
        public string JWTToken { get; set; }

        public AuthenticatedUser(User user, string JWTToken) {
            this.User = user;
            this.JWTToken = JWTToken;
        }
    }
}