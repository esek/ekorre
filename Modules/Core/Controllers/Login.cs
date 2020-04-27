using System;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using Microsoft.AspNetCore.Http;

using Ekorre.Core.Entities;
using Ekorre.Core.Models;
using Ekorre.Services;

namespace Ekorre.Controllers
{
    [ApiController]
    [Route("login")]
    [Produces("application/json")]
    public class Login : ControllerBase
    {
        private readonly IUserService _userService;

        public Login (IUserService userService) {
            this._userService = userService;
        }

        [HttpPost]
        public ActionResult<AuthenticatedUser> Authenticate([FromBody]AuthenticationRequest request)
        {
            var user = _userService.AuthenticateUser(request);

            if (user == null) {
                var p = new ProblemDetails {
                    Title = "Username or password was incorrect"
                };

                return Unauthorized(p);
            }

            return Ok(user);
        }

        [HttpGet]
        public IActionResult DefaultError()
        {
            var p = new ProblemDetails {
                Title = "You need to POST credentials"
            };

            return BadRequest(p);
        }
    }
}