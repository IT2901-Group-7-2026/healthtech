using Backend.Middleware;
using Backend.Models;
using Backend.Services;
using Microsoft.EntityFrameworkCore;
using Testcontainers.PostgreSql;

namespace Backend.IntegrationTests.Fixtures;

public sealed class PostgresTestDbFixture : IAsyncLifetime
{
	private readonly PostgreSqlContainer _container;

	public PostgresTestDbFixture()
	{
		_container = new PostgreSqlBuilder("timescale/timescaledb:2.17.2-pg16")
			.WithDatabase("backend_test")
			.WithUsername("postgres")
			.WithPassword("postgres")
			.Build();
	}

	public async Task InitializeAsync()
	{
		await _container.StartAsync();
		await ResetDatabaseAsync();
	}

	public async Task DisposeAsync()
	{
		await _container.DisposeAsync();
	}

	public AppDbContext CreateDbContext()
	{
		string connectionString = _container.GetConnectionString();

		var options = new DbContextOptionsBuilder<AppDbContext>()
			.UseNpgsql(connectionString)
			.Options;

		return new AppDbContext(options);
	}

	public async Task ResetDatabaseAsync()
	{
		await using var context = CreateDbContext();

		await context.Database.EnsureDeletedAsync();
		await context.Database.MigrateAsync();

		DatabaseSeeder seeder = new();
		await seeder.SeedDataAsync(context, CancellationToken.None);
	}

	public SignedInUserContext CreateOperatorContext()
	{
		return new SignedInUserContext
		{
			User = new User
			{
				Id = SeedIds.KariId,
				Name = "Kari Nordmann",
				Email = "kari.nordmann@aker.com",
				PasswordHash = "testpassword",
				CreatedAt = DateTime.UtcNow,
				Role = UserRole.Operator,
				LocationId = SeedIds.VerdalLocationId,
			},
		};
	}
}
