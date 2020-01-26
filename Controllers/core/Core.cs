using Microsoft.AspNetCore.Mvc;

namespace ekorre.Controllers {
    [ApiController]
    [Route("core")]
    public class Core : ControllerBase {
        [HttpGet]
        public string Get() {
            return "Hello from Core";
        }
    }
}