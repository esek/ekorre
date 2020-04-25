using System;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using Microsoft.AspNetCore.Http;

using ekorre.Models;

namespace ekorre.Controllers
{
    [ApiController]
    [Route("login")]
    [Produces("application/json")]
    public class Login : ControllerBase
    {

        [HttpPost]
        public IActionResult Authenticate([FromBody]AuthenticationRequest model)
        {
            var tokenHandler = new JwtSecurityTokenHandler();
            //var key = Encoding.ASCII.GetBytes(_appSettings.Secret);
            byte[] key = Encoding.ASCII.GetBytes("my big secret is a big penis haha just kidding");
            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(new Claim[]
                {
                    new Claim(ClaimTypes.Name, model.StilID),
                }),
                Expires = DateTime.UtcNow.AddDays(7),
                SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
            };
            var token = tokenHandler.CreateToken(tokenDescriptor);
            string Token = tokenHandler.WriteToken(token);

            //return Ok(Models.User.WithoutPassword(user));
            var cookieOptions = new CookieOptions();
            cookieOptions.Expires = DateTimeOffset.Now.AddHours(6);

            Response.Cookies.Append("JWTToken", Token, cookieOptions);
            return Ok(new { token = Token });
        }

        [HttpGet]
        public IActionResult Get()
        {
            return BadRequest(new { message = "You need to HttpPOST your credentials" });
        }
    }
}