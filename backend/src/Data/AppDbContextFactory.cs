using Backend.Utils;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

/// <summary>
/// This runs when migrating the database via the EF Core CLI.
/// It loads environment variables from the .env file so that the CLI does not need to explicitly pass the DATABASE_URL.
/// </summary>
public class AppDbContextFactory : IDesignTimeDbContextFactory<AppDbContext>
{
    public AppDbContext CreateDbContext(string[] args)
    {
        EnvUtils.LoadEnvFile();

        var builder = new DbContextOptionsBuilder<AppDbContext>();

        var configuration = new ConfigurationBuilder().AddEnvironmentVariables().Build();

        builder.UseNpgsql(configuration.GetValue<string>("DATABASE_URL"));

        return new AppDbContext(builder.Options);
    }
}
