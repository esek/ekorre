using System;
using System.Linq;
using System.Security.Claims;
using ekorre.Entities;
using ekorre.Models;
using Microsoft.Extensions.Logging;


namespace ekorre.Services
{

    public interface IUserService
    {
        AuthenticatedUser AuthenticateUser(string stilId, string password);
        AuthenticatedUser RegisterUser(string stilId, string password);
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

        public AuthenticatedUser AuthenticateUser(string stilId, string password)
        {
            User user = _dbctx.Users.SingleOrDefault(x =>
                x.StilID == stilId && _security.CheckPassword(password, new SecurePassword(x.PasswordHash, x.Salt))
            );

            // return null if user not found
            if (user == null)
            {
                _logger.LogInformation("User was not authenticated");
                return null;
            }

            // authentication successful so generate jwt token
            string token = IssueToken(user);
            return new AuthenticatedUser(user, token);
        }

        public User GetUser(string stilId)
        {
            return _dbctx.Users.SingleOrDefault(x => x.StilID == stilId);
        }

        public AuthenticatedUser RegisterUser(string stilId, string password)
        {
            throw new NotImplementedException();
        }

        private string IssueToken(User user)
        {
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