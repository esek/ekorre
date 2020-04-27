using Microsoft.EntityFrameworkCore;
using Ekorre;

namespace Ekorre.Contexts
{
    public interface IApplicationDbContext
    {
        DbSet<Core.Entities.User> Users { get; set; }
    }
    public class ApplicationDbContext : DbContext, IApplicationDbContext
    {

        public DbSet<Core.Entities.User> Users { get; set; }
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options)
        {

        }
    }
}