using Backend.Middleware;
using Backend.Models;
using DotNet.Testcontainers.Containers;
using Microsoft.EntityFrameworkCore;
using Testcontainers.PostgreSql;

namespace Backend.IntegrationTests.Fixtures;

public sealed class PostgresTestDbFixture : IAsyncLifetime
{
	public static readonly Guid KariId = new("87654321-8765-4321-8765-432187654321");
	public static readonly Guid VerdalLocationId = new("11111111-1111-1111-1111-111111111111");

	private readonly PostgreSqlContainer _container;
	private readonly string _seedDirectory;

	public PostgresTestDbFixture()
	{
		_seedDirectory = Path.GetFullPath(
			Path.Combine(AppContext.BaseDirectory, "../../../../../seed")
		);

		_container = new PostgreSqlBuilder("timescale/timescaledb:2.17.2-pg16")
			.WithDatabase("backend_test")
			.WithUsername("postgres")
			.WithPassword("postgres")
			.WithBindMount(_seedDirectory, "/seed")
			.Build();
	}

	public async Task InitializeAsync()
	{
		if (!Directory.Exists(_seedDirectory))
		{
			throw new DirectoryNotFoundException($"Seed directory not found: {_seedDirectory}");
		}

		await _container.StartAsync();

		await using var context = CreateDbContext();
		await context.Database.MigrateAsync();

		ExecResult seedResult = await _container.ExecAsync([
			"psql",
			"-v",
			"ON_ERROR_STOP=1",
			"-U",
			"postgres",
			"-d",
			"backend_test",
			"-f",
			"/seed/seed.sql",
			"-v",
			"RECENT_ONLY=1",
		]);

		if (seedResult.ExitCode != 0)
		{
			throw new InvalidOperationException(
				$"Seeding failed with exit code {seedResult.ExitCode}. Stdout: {seedResult.Stdout}. Stderr: {seedResult.Stderr}"
			);
		}
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

	public SignedInUserContext CreateOperatorContext()
	{
		return new SignedInUserContext
		{
			User = new User
			{
				Id = KariId,
				Username = "Kari Nordmann",
				Email = "kari.nordmann@aker.com",
				PasswordHash = "testpassword",
				CreatedAt = DateTime.UtcNow,
				Role = UserRole.Operator,
				LocationId = VerdalLocationId,
			},
		};
	}
}
