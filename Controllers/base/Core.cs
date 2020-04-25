using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using ekorre.Entities;
using System.Reflection;
using Microsoft.Extensions.Logging;

namespace ekorre.Controllers {
    [ApiController]
    [Route("[controller]")]
    [Authorize]
    public class Core : ControllerBase {

        private readonly ILogger _logger;
        public Core(ILogger<Core> logger) {
            this._logger = logger;
        }
        [HttpGet]
        public ActionResult<string> Get() {
            return Ok("Hello from Core");
        }

        [HttpGet]
        [Route("roles")]
        [AllowAnonymous]
        public ActionResult<string[]> GetRoles() {
            return Ok(Roles.GetRoles());
        }
    }
}