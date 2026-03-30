using Backend.Middleware;
using Backend.Models;
using Microsoft.EntityFrameworkCore;
using Testcontainers.PostgreSql;

namespace Backend.IntegrationTests.Fixtures;

public sealed class PostgresTestDbFixture : IAsyncLifetime
{
	public static readonly Guid KariId = new("87654321-8765-4321-8765-432187654321");
	public static readonly Guid VerdalLocationId = new("11111111-1111-1111-1111-111111111111");

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

		await using var context = CreateDbContext();
		await context.Database.MigrateAsync();
		await EnsureStatusViewsAsync(context);
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

	private static async Task EnsureStatusViewsAsync(AppDbContext context)
	{
		await context.Database.ExecuteSqlRawAsync(
			"""
			DROP MATERIALIZED VIEW IF EXISTS noise_data_minutely;
			DROP MATERIALIZED VIEW IF EXISTS noise_data_hourly;
			DROP MATERIALIZED VIEW IF EXISTS noise_data_daily;
			DROP MATERIALIZED VIEW IF EXISTS dust_data_minutely;
			DROP MATERIALIZED VIEW IF EXISTS dust_data_hourly;
			DROP MATERIALIZED VIEW IF EXISTS dust_data_daily;
			DROP MATERIALIZED VIEW IF EXISTS vibration_data_minutely;
			DROP MATERIALIZED VIEW IF EXISTS vibration_data_hourly;
			DROP MATERIALIZED VIEW IF EXISTS vibration_data_daily;

			CREATE MATERIALIZED VIEW noise_data_minutely AS
			SELECT
			    date_trunc('minute', "Time") AS bucket,
			    "UserId" AS user_id,
			    MAX("LCPK") AS max_noise_lcpk,
			    AVG("LAEQ") AS avg_noise_laeq
			FROM "NoiseData"
			GROUP BY 1, 2;

			CREATE MATERIALIZED VIEW noise_data_hourly AS
			SELECT
			    date_trunc('hour', "Time") AS bucket,
			    "UserId" AS user_id,
			    MAX("LCPK") AS max_noise_lcpk,
			    AVG("LAEQ") AS avg_noise_laeq
			FROM "NoiseData"
			GROUP BY 1, 2;

			CREATE MATERIALIZED VIEW noise_data_daily AS
			SELECT
			    date_trunc('day', "Time") AS bucket,
			    "UserId" AS user_id,
			    MAX("LCPK") AS max_noise_lcpk,
			    AVG("LAEQ") AS avg_noise_laeq
			FROM "NoiseData"
			GROUP BY 1, 2;

			CREATE MATERIALIZED VIEW dust_data_minutely AS
			SELECT
			    date_trunc('minute', "Time") AS bucket,
			    "UserId" AS user_id,
			    MAX("PM1T") AS max_dust_pm1_twa
			FROM "DustData"
			GROUP BY 1, 2;

			CREATE MATERIALIZED VIEW dust_data_hourly AS
			SELECT
			    date_trunc('hour', "Time") AS bucket,
			    "UserId" AS user_id,
			    MAX("PM1T") AS max_dust_pm1_twa
			FROM "DustData"
			GROUP BY 1, 2;

			CREATE MATERIALIZED VIEW dust_data_daily AS
			SELECT
			    date_trunc('day', "Time") AS bucket,
			    "UserId" AS user_id,
			    MAX("PM1T") AS max_dust_pm1_twa
			FROM "DustData"
			GROUP BY 1, 2;

			CREATE MATERIALIZED VIEW vibration_data_minutely AS
			SELECT
			    date_trunc('minute', "ConnectedOn") AS bucket,
			    "UserId" AS user_id,
			    SUM("Exposure") AS sum_vibration
			FROM "VibrationData"
			WHERE "ConnectedOn" IS NOT NULL
			GROUP BY 1, 2;

			CREATE MATERIALIZED VIEW vibration_data_hourly AS
			SELECT
			    date_trunc('hour', "ConnectedOn") AS bucket,
			    "UserId" AS user_id,
			    SUM("Exposure") AS sum_vibration
			FROM "VibrationData"
			WHERE "ConnectedOn" IS NOT NULL
			GROUP BY 1, 2;

			CREATE MATERIALIZED VIEW vibration_data_daily AS
			SELECT
			    date_trunc('day', "ConnectedOn") AS bucket,
			    "UserId" AS user_id,
			    SUM("Exposure") AS sum_vibration
			FROM "VibrationData"
			WHERE "ConnectedOn" IS NOT NULL
			GROUP BY 1, 2;

			CREATE INDEX IF NOT EXISTS idx_noise_minutely_bucket ON noise_data_minutely(bucket);
			CREATE INDEX IF NOT EXISTS idx_noise_hourly_bucket ON noise_data_hourly(bucket);
			CREATE INDEX IF NOT EXISTS idx_noise_daily_bucket ON noise_data_daily(bucket);
			CREATE INDEX IF NOT EXISTS idx_dust_minutely_bucket ON dust_data_minutely(bucket);
			CREATE INDEX IF NOT EXISTS idx_dust_hourly_bucket ON dust_data_hourly(bucket);
			CREATE INDEX IF NOT EXISTS idx_dust_daily_bucket ON dust_data_daily(bucket);
			CREATE INDEX IF NOT EXISTS idx_vibration_minutely_bucket ON vibration_data_minutely(bucket);
			CREATE INDEX IF NOT EXISTS idx_vibration_hourly_bucket ON vibration_data_hourly(bucket);
			CREATE INDEX IF NOT EXISTS idx_vibration_daily_bucket ON vibration_data_daily(bucket);
			"""
		);
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
