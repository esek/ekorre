using ekorre.Entities;
using ekorre.Models;
using ekorre.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ekorre.Controllers
{
    [ApiController]
    [Route("user")]
    [Produces("application/json")]
    public class UserRoute : ControllerBase
    {
        private readonly IUserService _userService;

        public UserRoute(IUserService userService)
        {
            _userService = userService;
        }

        [HttpGet("{stilId}")]
        public ActionResult<User> GetUser(string stilId)
        {
            return Ok(_userService.GetUser(stilId));
        }

        [HttpPut("{stilId}/addrole")]
        public ActionResult AddRole(string stilId, [FromBody]RoleRequest request)
        {
            string r = request.Role;

            if (!Roles.IsValidRole(r)) return BadRequest($"Role {r} is invalid");

            bool roleAdded = _userService.AddRole(stilId, r);

            if (roleAdded) return Ok();
            else return BadRequest($"User {stilId} was not found");
        }

        [HttpPut("{stilId}/removerole")]
        public ActionResult RemoveRole(string stilId, [FromBody]RoleRequest request)
        {
            string r = request.Role;

            if (!Roles.IsValidRole(r)) return BadRequest($"Role {r} is invalid");

            bool roleRemoved = _userService.RemoveRole(stilId, r);

            if (roleRemoved) return Ok();
            else return BadRequest($"User {stilId} was not found");
        }

        [HttpPut("{stilId}/changepassword")]
        public ActionResult ChangePassword(string stilId, [FromBody]ChangePasswordRequest request)
        {
            bool changedPassword = _userService.ChangePassword(stilId, request.OldPassword, request.NewPassword);

            if (changedPassword) return Ok();
            else return BadRequest($"Password could not be changed");
        }
    }
}