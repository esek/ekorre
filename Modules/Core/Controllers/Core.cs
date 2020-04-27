using Ekorre.Core.Entities;
using Ekorre.Core.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;

namespace Ekorre.Controllers
{
    [ApiController]
    [Route("[controller]")]
    [Authorize]
    public class Core : ControllerBase
    {

        private readonly ILogger _logger;
        public Core(ILogger<Core> logger)
        {
            this._logger = logger;
        }

        [HttpGet]
        public ActionResult<string> Get()
        {
            return Ok("Hello from Core");
        }

        [HttpGet("roles")]
        [AllowAnonymous]
        public ActionResult<string[]> GetRoles()
        {
            return Ok(Roles.GetRoles());
        }

        [HttpGet("error")]
        [AllowAnonymous]
        public ActionResult<string[]> GetError()
        {
            var p = new ProblemDetails {
                Title = "A error"
            };

            return Unauthorized(p);
        }
    }
}