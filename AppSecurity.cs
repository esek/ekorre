using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.IdentityModel.Tokens;
using System;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace ekorre
{
    public interface IAppSecurity {
        string IssueJwtToken(ClaimsIdentity identity);
    }
    public class AppSecurity : IAppSecurity
    {
        private readonly ILogger _logger;

        // Token lifetime in hours
        private const int TOKEN_LIFETIME = 6;
        private static SymmetricSecurityKey key;

        public AppSecurity(ILogger<AppSecurity> logger, IApplicationBuilder app) {
            _logger = logger;
        }

        public static void ConfigureAuthentication(IServiceCollection services, IConfiguration configuration)
        {
            string keyStr = "";
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
                })
                .AddCookie(CookieAuthenticationDefaults.AuthenticationScheme,
                    options =>
                    {
                        configuration.Bind("CookieSettings", options);
                    }
                );
            
        }

        public static void ConfigureAuthorization(IServiceCollection services)
        {
            services.AddAuthorization(options =>
            {
                options.AddPolicy("Member", policy => policy.RequireClaim(ClaimTypes.Role));
            });
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
            SecurityTokenDescriptor descriptor = new SecurityTokenDescriptor {
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
    }
}