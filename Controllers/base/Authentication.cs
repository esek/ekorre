using System;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;

namespace ekorre.Controllers {
    [ApiController]
    [Route("auth")]
    [Produces("application/json")]
    public class Authentication : ControllerBase {

        [HttpPost]
        public IActionResult Authenticate([FromBody]Models.AuthenticationRequest model) {
            var tokenHandler = new JwtSecurityTokenHandler();
            //var key = Encoding.ASCII.GetBytes(_appSettings.Secret);
            byte[] key = Encoding.ASCII.GetBytes("my big secret is a big penis haha just kidding");
            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(new Claim[] 
                {
                    new Claim(ClaimTypes.Name, model.Username),
                }),
                Expires = DateTime.UtcNow.AddDays(7),
                SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
            };
            var token = tokenHandler.CreateToken(tokenDescriptor);
            string Token = tokenHandler.WriteToken(token);

            //return Ok(Models.User.WithoutPassword(user));
            return Ok(Token);
        }

        [HttpGet]
        public IActionResult Get() {
            return BadRequest(new { message = "You need to HttpPOST your credentials" });
        }
    }
}