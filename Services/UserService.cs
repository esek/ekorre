using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using ekorre.Entities;
using ekorre.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace ekorre.Services
{

    public interface IUserService
    {
        AuthenticatedUser AuthenticateUser(string stilId, string password);
        AuthenticatedUser RegisterUser(RegistrationRequest userInfo);
        User GetUser(string stilId);
        User GetUser(string stilId, string password);
        bool AddRole(string stilId, string role);
        bool RemoveRole(string stilId, string role);
        bool ChangePassword(string stilId, string oldPassword, string newPassword);
    }

    public class UserService : IUserService
    {
        private readonly Contexts.ApplicationDbContext _dbctx;
        private readonly IAppSecurity _security;
        private readonly ILogger _logger;
        private readonly ICasService _casService;

        /// <summary>
        /// A service responsible for all user actions i.e. adding
        /// </summary>
        /// <param name="context"></param>
        /// <param name="security"></param>
        /// <param name="casService"></param>
        /// <param name="logger"></param>
        public UserService(Contexts.ApplicationDbContext context, IAppSecurity security, ICasService casService, ILogger<UserService> logger)
        {
            _dbctx = context;
            _security = security;
            _casService = casService;
            _logger = logger;
        }

        public AuthenticatedUser AuthenticateUser(string stilId, string password)
        {
            var user = GetUser(stilId, password);

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
        public AuthenticatedUser RegisterUser(RegistrationRequest userInfo)
        {
            if (GetUser(userInfo.StilID) != null) return null;

            var u = new User();
            u.StilID = userInfo.StilID;
            u.Name = userInfo.Name;
            u.Email = userInfo.Email;
            u.Programme = userInfo.Programme;
            u.PhoneNumber = userInfo.PhoneNumber;

            var sp = _security.SecurePassword(userInfo.Password);
            u.PasswordHash = sp.HashedPassword;
            u.Salt = sp.Salt;

            _dbctx.Add(u);
            _dbctx.SaveChanges();

            return new AuthenticatedUser(u.WithoutPassword(), IssueToken(u));
        }

        public User GetUser(string stilId)
        {
            return _dbctx.Users.AsNoTracking().SingleOrDefault(x => x.StilID == stilId)?.WithoutPassword();
        }

        public User GetUser(string stilId, string password)
        {
            var user = _dbctx.Users.AsNoTracking().SingleOrDefault(x =>
                x.StilID == stilId && _security.CheckPassword(password, new SecurePassword(x.PasswordHash, x.Salt))
            );

            return user?.WithoutPassword();
        }


        public bool AddRole(string stilId, string role)
        {
            if (!Roles.IsValidRole(role)) return false;

            var user = GetTrackedUser(stilId);
            if (user == null) return false;

            if (!user.Roles.Contains(role))
            {
                user.Roles.Append(role);
                _dbctx.SaveChanges();
                _logger.LogInformation($"Added role {role} to {stilId}");
            }

            return true;
        }

        public bool RemoveRole(string stilId, string role)
        {
            var user = GetTrackedUser(stilId);
            if (user == null) return false;

            bool removed = user.Roles.Remove(role);

            if (!removed) return true;

            _dbctx.SaveChanges();
            _logger.LogInformation($"Removed role {role} from {stilId}");
            return true;
        }
        public bool ChangePassword(string stilId, string oldPassword, string newPassword)
        {
            var u = GetTrackedUser(stilId, oldPassword);

            if (u == null) return false;

            var sp = _security.SecurePassword(newPassword);
            u.PasswordHash = sp.HashedPassword;
            u.Salt = sp.Salt;
            _dbctx.SaveChanges();
            _logger.LogInformation($"Changed password for user {stilId}");

            return true;
        }

        private User GetTrackedUser(string stilId)
        {
            return _dbctx.Users.SingleOrDefault(x => x.StilID == stilId);
        }

        private User GetTrackedUser(string stilId, string password)
        {
            var user = _dbctx.Users.SingleOrDefault(x =>
                x.StilID == stilId && _security.CheckPassword(password, new SecurePassword(x.PasswordHash, x.Salt))
            );

            return user;
        }
        private string IssueToken(User user)
        {
            var identity = GenerateClaimsIdentity(user);
            var token = _security.IssueJwtToken(identity);
            return token;
        }

        private ClaimsIdentity GenerateClaimsIdentity(User user)
        {
            var claims = new Claim[]{
                new Claim(ClaimTypes.Name, user.Name),
                new Claim(ClaimTypes.NameIdentifier, user.StilID),
            };
            claims.Concat(GenerateRoleClaims(user.Roles));

            return new ClaimsIdentity(claims);
        }

        private Claim[] GenerateRoleClaims(List<string> roles)
        {
            var claims = new Claim[roles.Count];
            for (int i = 0; i < claims.Length; i++)
            {
                claims[i] = new Claim(ClaimTypes.Role, roles.ElementAt(i));
            }

            return claims;
        }

    }
}