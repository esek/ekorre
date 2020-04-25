using Microsoft.EntityFrameworkCore;

namespace ekorre.Contexts
{
    public interface IApplicationDbContext
    {
        DbSet<Entities.User> Users { get; set; }
    }
    public class ApplicationDbContext : DbContext, IApplicationDbContext
    {

        public DbSet<Entities.User> Users { get; set; }
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options)
        {

        }
    }
}