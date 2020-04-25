using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using ekorre.Entities;
using System.Reflection;

namespace ekorre.Controllers {
    [ApiController]
    [Route("[controller]")]
    [Authorize]
    public class Core : ControllerBase {
        [HttpGet]
        public ActionResult<string> Get() {
            return Ok("Hello from Core");
        }

        [HttpGet]
        [Route("roles")]
        [AllowAnonymous]
        public ActionResult<string[]> GetRoles() {
            var t = typeof(Roles).GetFields();
            var s = new string[t.Length];

            for (int i = 0; i < t.Length; i++)
            {
                s[i] = t[i].GetValue(null) as string;
            }

            return Ok(s);
        }
    }
}