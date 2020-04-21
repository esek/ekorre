using System;
using System.Collections;
using System.Security.Claims;
using ekorre.Models;
using Microsoft.IdentityModel.Tokens;
using System.Linq;
using Microsoft.Extensions.Logging;

namespace ekorre.Services
{

    public interface IUserService
    {
        Tuple<User, string> Authenticate(string stilId, string password);
        User GetUser(string stilId);
    }

    public class UserService : IUserService
    {
        private readonly Contexts.ApplicationDbContext _dbctx;
        private readonly IAppSecurity _security;
        private readonly ILogger _logger;

        public UserService(Contexts.ApplicationDbContext context, IAppSecurity security, ILogger<UserService> logger)
        {
            _dbctx = context;
            _security = security;
            _logger = logger;
        }

        public Tuple<User, string> Authenticate(string stilId, string password)
        {
            string passwordHash = password;
            User user = _dbctx.Users.SingleOrDefault(x => 
                x.StilID == stilId && x.PasswordHash == passwordHash
            );

            // return null if user not found
            if (user == null) {
                _logger.LogInformation("User was not authenticated");
                return null;
            }

            // authentication successful so generate jwt token
            string token = IssueToken(user);

            return new Tuple<User, string>(user, token);
        }

        public User GetUser(string stilId)
        {
            return _dbctx.Users.SingleOrDefault(x => x.StilID == stilId);
        }

        private string IssueToken(User user) {
            // Generate the actual token, will be stored in some place
            ClaimsIdentity identity = GenerateClaimsIdentity(user);
            string token = _security.IssueJwtToken(identity);
            return token;
        }

        private ClaimsIdentity GenerateClaimsIdentity(User user)
        {
            Claim[] claims = new Claim[]{
                new Claim(ClaimTypes.Name, user.Name),
                new Claim(ClaimTypes.NameIdentifier, user.StilID),
            };
            claims.Concat(GenerateRoleClaims(user.Roles));

            return new ClaimsIdentity(claims);
        }

        private Claim[] GenerateRoleClaims(string[] roles)
        {
            Claim[] claims = new Claim[roles.Length];
            for (int i = 0; i < claims.Length; i++)
            {
                claims[i] = new Claim(ClaimTypes.Role, roles[i]);
            }

            return claims;
        }
    }
}