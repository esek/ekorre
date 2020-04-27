using Ekorre.Core.Entities;
using Ekorre.Core.Models;
using Ekorre.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Ekorre.Controllers
{
    [ApiController]
    [Route("users")]
    [Produces("application/json")]
    public class UserRoute : ControllerBase
    {
        private readonly IUserService _userService;

        public UserRoute(IUserService userService)
        {
            _userService = userService;
        }

        [HttpGet]
        public ActionResult<User[]> GetAllUsers() {
            return Ok(_userService.GetAllUsers());
        }

        [HttpGet("{stilId}")]
        public ActionResult<User> GetUser(string stilId)
        {
            return Ok(_userService.GetUser(stilId));
        }

        [HttpPatch("{stilId}/addrole")]
        public ActionResult AddRole(string stilId, [FromBody]RoleRequest request)
        {
            var r = request.Role;
            request.StilId = stilId;

            if (!Roles.IsValidRole(r)) return BadRequest($"Role {r} is invalid");

            var roleAdded = _userService.AddRole(request);

            if (roleAdded) return Ok();
            else return BadRequest($"User {stilId} was not found");
        }

        [HttpPatch("{stilId}/removerole")]
        public ActionResult RemoveRole(string stilId, [FromBody]RoleRequest request)
        {
            request.StilId = stilId;
            var r = request.Role;

            if (!Roles.IsValidRole(r)) return BadRequest($"Role {r} is invalid");

            var roleRemoved = _userService.RemoveRole(request);

            if (roleRemoved) return Ok();
            else return BadRequest($"User {stilId} was not found");
        }

        [HttpPatch("{stilId}/changepassword")]
        public ActionResult ChangePassword(string stilId, [FromBody]ChangePasswordRequest request)
        {
            request.StilId = stilId;
            var changedPassword = _userService.ChangePassword(request);

            if (changedPassword) return Ok();
            else return BadRequest($"Password could not be changed");
        }
    }
}