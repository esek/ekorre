using Ekorre.Core.Models;
using Ekorre.Services;
using Microsoft.AspNetCore.Mvc;

namespace Ekorre.Controllers
{
    // TODO
    [ApiController]
    [Route("register")]
    [Produces("application/json")]
    public class Register : ControllerBase
    {

        private readonly IUserService _userService;

        public Register(IUserService userService)
        {
            _userService = userService;
        }

        [HttpPost]
        public IActionResult RegisterUser([FromBody]RegistrationRequest model)
        {
            return Ok(_userService.RegisterUser(model));
        }
    }
}