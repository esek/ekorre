using ekorre.Models;
using Microsoft.AspNetCore.Mvc;

namespace ekorre.Controllers
{
    // TODO
    [ApiController]
    [Route("register")]
    [Produces("application/json")]
    public class Register : ControllerBase
    {
        [HttpPost]
        public IActionResult RegisterUser([FromBody]RegistrationRequest model)
        {
            return Ok(new { token = "a token" });
        }
    }
}