using ekorre.Models;
using Microsoft.AspNetCore.Mvc;

namespace ekorre.Controllers
{
    [ApiController]
    [Route("register")]
    [Produces("application/json")]
    public class Register : ControllerBase
    {
        [HttpPost]
        public IActionResult Authenticate([FromBody]RegistrationRequest model)
        {
            return Ok(new { token = "a token" });
        }
    }
}