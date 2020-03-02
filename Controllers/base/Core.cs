using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;

namespace ekorre.Controllers {
    [Authorize]
    [ApiController]
    [Route("core")]
    public class Core : ControllerBase {
        [HttpGet]
        public string Get() {
            return "Hello from Core";
        }
    }
}