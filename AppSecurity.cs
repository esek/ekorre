using System;
using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using ekorre.Entities;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Cryptography.KeyDerivation;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.IdentityModel.Tokens;

namespace ekorre
{
    public interface IAppSecurity
    {
        string IssueJwtToken(ClaimsIdentity identity);

        bool CheckPassword(string password, SecurePassword savedPassword);
        SecurePassword SecurePassword(string password);
    }
    public class AppSecurity : IAppSecurity
    {
        public static void ConfigureAuthentication(IServiceCollection services, IConfiguration configuration)
        {
            string keyStr = "my big secret is a big penis haha just kidding";
            byte[] keyBytes = Encoding.ASCII.GetBytes(keyStr);
            key = new SymmetricSecurityKey(keyBytes);

            services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
                .AddJwtBearer(options =>
                {
                    options.RequireHttpsMetadata = false;
                    options.SaveToken = true;

                    options.TokenValidationParameters = new TokenValidationParameters
                    {
                        ValidateIssuerSigningKey = false,
                        ValidateIssuer = false,
                        ValidateAudience = false,
                        IssuerSigningKey = key
                    };
                });
        }

        public static void ConfigureAuthorization(IServiceCollection services)
        {
            services.AddAuthorization(options =>
            {
                options.AddPolicy("Offical", policy => policy.RequireClaim(ClaimTypes.Role));
            });
        }
        private readonly ILogger _logger;

        // Token lifetime in hours
        private const int TOKEN_LIFETIME = 6;
        private static SymmetricSecurityKey key;

        public AppSecurity(ILogger<AppSecurity> logger)
        {
            _logger = logger;
        }

        /// <summary>
        /// Generate a jwt token and store it in internal db.
        /// </summary>
        /// <returns>The jwt token</returns>
        public string IssueJwtToken(ClaimsIdentity identity)
        {
            _logger.LogInformation("Creating token for identity: ", identity);
            // Create new token handler
            var tokenHandler = new JwtSecurityTokenHandler();

            // Define token properties
            SecurityTokenDescriptor descriptor = new SecurityTokenDescriptor
            {
                Subject = identity,
                SigningCredentials = new SigningCredentials(
                    key,
                    SecurityAlgorithms.HmacSha256Signature
                ),
                Expires = DateTime.UtcNow.AddHours(TOKEN_LIFETIME)
            };

            // Generate the actual token, will be stored in some place
            SecurityToken token = tokenHandler.CreateToken(descriptor);
            return tokenHandler.WriteToken(token);
        }

        private byte[] GenerateSalt()
        {
            // Create salt using .NET random generator
            byte[] salt = new byte[128 / 8];
            using (var rng = RandomNumberGenerator.Create())
            {
                rng.GetBytes(salt);
            }

            return salt;
        }

        /// <summary>
        /// Hash a given password 100 times using the given salt
        /// </summary>
        /// <returns>A 256-bit of the password</returns>
        private byte[] HashPassword(string password, byte[] salt)
        {

            byte[] hash = KeyDerivation.Pbkdf2(
                password: password,
                salt: salt,
                prf: KeyDerivationPrf.HMACSHA256,
                iterationCount: 100,
                numBytesRequested: 256 / 8
            );

            return hash;
        }
        public bool CheckPassword(string password, SecurePassword savedPassword)
        {
            byte[] hash = HashPassword(password, savedPassword.Salt);
            return hash.SequenceEqual(savedPassword.HashedPassword);
        }

        public SecurePassword SecurePassword(string password)
        {
            byte[] salt = GenerateSalt();
            byte[] hashedPassword = HashPassword(password, salt);

            SecurePassword sp = new SecurePassword(hashedPassword, salt);

            return sp;
        }
    }
}