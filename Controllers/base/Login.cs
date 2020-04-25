using System;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using Microsoft.AspNetCore.Http;

using ekorre.Entities;
using ekorre.Models;
using ekorre.Services;

namespace ekorre.Controllers
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
        public ActionResult<AuthenticatedUser> Authenticate([FromBody]AuthenticationRequest model)
        {
            var user = _userService.AuthenticateUser(model.StilID, model.Password);

            return Ok(user);
        }

        [HttpGet]
        public IActionResult Get()
        {
            return BadRequest(new { message = "You need to HttpPOST your credentials" });
        }
    }
}