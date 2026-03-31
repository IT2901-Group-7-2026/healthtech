using Backend.IntegrationTests.Fixtures;
using Backend.Models;
using Backend.Records;
using Backend.Services;
using Microsoft.EntityFrameworkCore;

namespace Backend.IntegrationTests.ServiceTests;

[Collection(PostgresTestDbCollection.Name)]
public sealed class UserStatusServiceIntegrationTests(PostgresTestDbFixture fixture)
	: IntegrationTestBase(fixture)
{
	private const int QueryWindowMinutes = 1;
	private const int AssertionPrecision = 3;
	private const double DefaultDustMetricValue = 0d;
	private const int VibrationSampleDurationMinutes = 5;

	[Fact]
	public async Task GetStatusForUsersInRange_ReturnsAggregatedStatuses()
	{
		await using var context = Fixture.CreateDbContext();

		Guid userId = SeedIds.KariId;
		const double noiseAverage = 82d;
		const double noisePeak = 131d;
		const double dustAverage = 31d;
		const double vibrationExposure = 120d;
		DateTime sampleTime = new(2026, 1, 1, 10, 0, 0, DateTimeKind.Utc);

		AddNoiseSample(context, userId, sampleTime, laeq: noiseAverage, lcpk: noisePeak);
		AddDustSample(context, userId, sampleTime, pm1t: dustAverage);
		AddVibrationSample(context, userId, sampleTime, exposure: vibrationExposure);

		await context.SaveChangesAsync();
		await RefreshMinutelyViewsAsync(context);

		var service = new UserStatusService(context, Fixture.CreateOperatorContext());
		DateTime start = sampleTime.AddMinutes(-QueryWindowMinutes);
		DateTime end = sampleTime.AddMinutes(QueryWindowMinutes);

		IEnumerable<DTOs.UserStatusDto> result = await service.GetStatusForUsersInRange(
			[userId],
			start,
			end
		);

		DTOs.UserStatusDto status = Assert.Single(result);

		Assert.Equal(userId, status.UserId);
		Assert.Equal(DangerLevel.Danger, status.Status);

		Assert.NotNull(status.Noise);
		Assert.Equal(DangerLevel.Warning, status.Noise.dangerLevel);
		Assert.Equal(DangerLevel.Danger, status.Noise.peakDangerLevel);
		Assert.Equal(noiseAverage, status.Noise.Value, precision: AssertionPrecision);
		Assert.NotNull(status.Noise.PeakValue);
		Assert.Equal(noisePeak, status.Noise.PeakValue.Value, precision: AssertionPrecision);

		Assert.NotNull(status.Dust);
		Assert.Equal(DangerLevel.Danger, status.Dust.dangerLevel);
		Assert.Equal(dustAverage, status.Dust.Value, precision: AssertionPrecision);

		Assert.NotNull(status.Vibration);
		Assert.Equal(DangerLevel.Warning, status.Vibration.dangerLevel);
		Assert.Equal(vibrationExposure, status.Vibration.Value, precision: AssertionPrecision);
	}

	[Fact]
	public async Task GetStatusForUsersInRange_NoisePeakDanger_DoesNotElevateOverallStatus()
	{
		await using var context = Fixture.CreateDbContext();

		Guid userId = SeedIds.KariId;
		const double safeAverageNoise = 70d;
		const double dangerousPeakNoise = 135d;
		DateTime sampleTime = new(2026, 1, 1, 11, 0, 0, DateTimeKind.Utc);

		AddNoiseSample(
			context,
			userId,
			sampleTime,
			laeq: safeAverageNoise,
			lcpk: dangerousPeakNoise
		);
		await context.SaveChangesAsync();
		await RefreshMinutelyViewsAsync(context);

		var service = new UserStatusService(context, Fixture.CreateOperatorContext());
		DateTime start = sampleTime.AddMinutes(-QueryWindowMinutes);
		DateTime end = sampleTime.AddMinutes(QueryWindowMinutes);

		IEnumerable<DTOs.UserStatusDto> result = await service.GetStatusForUsersInRange(
			[userId],
			start,
			end
		);

		DTOs.UserStatusDto status = Assert.Single(result);

		Assert.Equal(DangerLevel.Safe, status.Status);
		Assert.NotNull(status.Noise);
		Assert.Equal(DangerLevel.Safe, status.Noise.dangerLevel);
		Assert.Equal(DangerLevel.Danger, status.Noise.peakDangerLevel);
		Assert.Null(status.Dust);
		Assert.Null(status.Vibration);
	}

	[Fact]
	public async Task GetStatusForUsersInRange_DistinctUserIdsAndRangeFilter_AppliesPerUser()
	{
		await using var context = Fixture.CreateDbContext();

		Guid userA = SeedIds.KariId;
		Guid userB = SeedIds.PerId;
		const double userASafeVibrationExposure = 50d;
		const double outOfRangeDustAverage = 40d;
		const double userBDangerVibrationExposure = 450d;

		DateTime inRange = new(2026, 1, 1, 12, 0, 0, DateTimeKind.Utc);
		DateTime outOfRange = inRange.AddDays(-2);

		AddVibrationSample(context, userA, inRange, exposure: userASafeVibrationExposure);
		AddDustSample(context, userA, outOfRange, pm1t: outOfRangeDustAverage);
		AddVibrationSample(context, userB, inRange, exposure: userBDangerVibrationExposure);

		await context.SaveChangesAsync();
		await RefreshMinutelyViewsAsync(context);

		var service = new UserStatusService(context, Fixture.CreateOperatorContext());
		DateTime start = inRange.AddMinutes(-QueryWindowMinutes);
		DateTime end = inRange.AddMinutes(QueryWindowMinutes);

		IEnumerable<DTOs.UserStatusDto> result = await service.GetStatusForUsersInRange(
			[userA, userB, userA],
			start,
			end
		);

		var resultByUser = result.ToDictionary(status => status.UserId);

		Assert.Equal(2, resultByUser.Count);

		DTOs.UserStatusDto statusA = resultByUser[userA];
		Assert.Equal(DangerLevel.Safe, statusA.Status);
		Assert.NotNull(statusA.Vibration);
		Assert.Equal(DangerLevel.Safe, statusA.Vibration.dangerLevel);
		Assert.Equal(
			userASafeVibrationExposure,
			statusA.Vibration.Value,
			precision: AssertionPrecision
		);
		Assert.Null(statusA.Dust);

		DTOs.UserStatusDto statusB = resultByUser[userB];
		Assert.Equal(DangerLevel.Danger, statusB.Status);
		Assert.NotNull(statusB.Vibration);
		Assert.Equal(DangerLevel.Danger, statusB.Vibration.dangerLevel);
		Assert.Equal(
			userBDangerVibrationExposure,
			statusB.Vibration.Value,
			precision: AssertionPrecision
		);
	}

	[Fact]
	public async Task GetStatusForUsersInRange_UserWithoutMeasurements_ReturnsSafeWithNullSensors()
	{
		await using var context = Fixture.CreateDbContext();

		Guid targetUserId = SeedIds.KariId;
		Guid otherUserId = SeedIds.PerId;
		const double otherUsersDustAverage = 45d;
		DateTime sampleTime = new(2026, 1, 1, 13, 0, 0, DateTimeKind.Utc);

		AddDustSample(context, otherUserId, sampleTime, pm1t: otherUsersDustAverage);
		await context.SaveChangesAsync();
		await RefreshMinutelyViewsAsync(context);

		var service = new UserStatusService(context, Fixture.CreateOperatorContext());
		DateTime start = sampleTime.AddMinutes(-QueryWindowMinutes);
		DateTime end = sampleTime.AddMinutes(QueryWindowMinutes);

		IEnumerable<DTOs.UserStatusDto> result = await service.GetStatusForUsersInRange(
			[targetUserId],
			start,
			end
		);

		DTOs.UserStatusDto status = Assert.Single(result);

		Assert.Equal(targetUserId, status.UserId);
		Assert.Equal(DangerLevel.Safe, status.Status);
		Assert.Null(status.Noise);
		Assert.Null(status.Dust);
		Assert.Null(status.Vibration);
	}

	[Fact]
	public async Task GetStatusForUsersInRange_EmptyUserIds_ReturnsEmptyEvenWhenDataExists()
	{
		await using var context = Fixture.CreateDbContext();

		Guid userId = SeedIds.KariId;
		const double noiseAverage = 90d;
		const double noisePeak = 120d;
		DateTime sampleTime = new(2026, 1, 1, 14, 0, 0, DateTimeKind.Utc);

		AddNoiseSample(context, userId, sampleTime, laeq: noiseAverage, lcpk: noisePeak);
		await context.SaveChangesAsync();
		await RefreshMinutelyViewsAsync(context);

		var service = new UserStatusService(context, Fixture.CreateOperatorContext());

		DateTime start = sampleTime.AddMinutes(-QueryWindowMinutes);
		DateTime end = sampleTime.AddMinutes(QueryWindowMinutes);

		IEnumerable<DTOs.UserStatusDto> result = await service.GetStatusForUsersInRange(
			[],
			start,
			end
		);

		Assert.Empty(result);
	}

	private static void AddNoiseSample(
		AppDbContext context,
		Guid userId,
		DateTime time,
		double laeq,
		double lcpk
	)
	{
		context.NoiseData.Add(
			new NoiseData
			{
				Id = Guid.NewGuid(),
				UserId = userId,
				Time = time,
				LAEQ = laeq,
				LCPK = lcpk,
			}
		);
	}

	private static void AddDustSample(AppDbContext context, Guid userId, DateTime time, double pm1t)
	{
		context.DustData.Add(
			new DustData
			{
				Id = Guid.NewGuid(),
				UserId = userId,
				Time = time,
				PM1S = DefaultDustMetricValue,
				PM25S = DefaultDustMetricValue,
				PM4S = DefaultDustMetricValue,
				PM10S = DefaultDustMetricValue,
				PM1T = pm1t,
				PM25T = DefaultDustMetricValue,
				PM4T = DefaultDustMetricValue,
				PM10T = DefaultDustMetricValue,
			}
		);
	}

	private static void AddVibrationSample(
		AppDbContext context,
		Guid userId,
		DateTime connectedOn,
		double exposure
	)
	{
		context.VibrationData.Add(
			new VibrationData
			{
				Id = Guid.NewGuid(),
				UserId = userId,
				ConnectedOn = connectedOn,
				DisconnectedOn = connectedOn.AddMinutes(VibrationSampleDurationMinutes),
				Exposure = exposure,
			}
		);
	}

	private static async Task RefreshMinutelyViewsAsync(AppDbContext context)
	{
		await context.Database.ExecuteSqlRawAsync("REFRESH MATERIALIZED VIEW noise_data_minutely;");
		await context.Database.ExecuteSqlRawAsync("REFRESH MATERIALIZED VIEW dust_data_minutely;");
		await context.Database.ExecuteSqlRawAsync(
			"REFRESH MATERIALIZED VIEW vibration_data_minutely;"
		);
	}
}
