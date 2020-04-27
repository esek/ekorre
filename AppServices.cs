using Ekorre.Services;

namespace Microsoft.Extensions.DependencyInjection
{
    public static class AppServices {
        public static IServiceCollection AddUsers(this IServiceCollection services) {
            services.AddScoped<IUserService, UserService>();
            return services;
        }
    }
}