using Backend.DTOs;
using Backend.IntegrationTests.Fixtures;
using Backend.Models;
using Backend.Records;
using Backend.Services;
using Microsoft.EntityFrameworkCore;

namespace Backend.IntegrationTests.ServiceTests;

[Collection(PostgresTestDbCollection.Name)]
public sealed class ExposureDataServiceIntegrationTests(PostgresTestDbFixture fixture)
	: IntegrationTestBase(fixture)
{
	private const double DefaultDustMetricValue = 0d;
	private const int VibrationSampleDurationMinutes = 5;

	[Fact]
	public async Task GetAggregatedDataAsync_Noise_ReturnsFilteredBucketsWithPeakValues()
	{
		await using var context = Fixture.CreateDbContext();
		var service = new ExposureDataService(context, Fixture.CreateOperatorContext());

		Guid targetUserId = SeedIds.KariId;
		const double inRangeLaeq = 82d;
		const double inRangeLcpk = 131d;
		DateTime inRange = new(2026, 1, 1, 10, 0, 0, DateTimeKind.Utc);
		DateTime outOfRange = new(2026, 1, 1, 8, 0, 0, DateTimeKind.Utc);

		AddNoiseSample(context, targetUserId, inRange, laeq: inRangeLaeq, lcpk: inRangeLcpk);
		AddNoiseSample(context, targetUserId, outOfRange, laeq: 90d, lcpk: 140d);
		AddNoiseSample(context, SeedIds.PerId, inRange, laeq: 85d, lcpk: 120d);

		await context.SaveChangesAsync();
		await RefreshAllMaterializedViewsAsync(context);

		ExposureDataRequestDto request = new(
			StartTime: inRange.AddMinutes(-1),
			EndTime: inRange.AddMinutes(1),
			Granularity: TimeGranularity.Minute,
			Function: AggregationFunction.Avg,
			Field: null
		);

		IEnumerable<ExposureDataDto> result = await service.GetAggregatedDataAsync(
			request,
			targetUserId,
			ExposureType.Noise
		);

		ExposureDataDto bucket = Assert.Single(result);
		Assert.Equal(inRange, bucket.Time);
		Assert.Equal(inRangeLaeq, bucket.Value, precision: 3);
		Assert.NotNull(bucket.PeakValue);
		Assert.Equal(inRangeLcpk, bucket.PeakValue!.Value, precision: 3);
		Assert.Equal(DangerLevel.Warning, bucket.DangerLevel);
		Assert.Equal(DangerLevel.Danger, bucket.PeakDangerLevel);
	}

	[Fact]
	public async Task GetAggregatedDataAsync_VibrationSum_CumulatesWithinDayAndResetsNextDay()
	{
		await using var context = Fixture.CreateDbContext();
		var service = new ExposureDataService(context, Fixture.CreateOperatorContext());

		Guid userId = SeedIds.KariId;
		const double dayOneFirstExposure = 40d;
		const double dayOneSecondExposure = 60d;
		const double dayTwoFirstExposure = 30d;
		double expectedDayOneSecondCumulative = dayOneFirstExposure + dayOneSecondExposure;
		DateTime dayOneFirst = new(2026, 1, 2, 8, 0, 0, DateTimeKind.Utc);
		DateTime dayOneSecond = new(2026, 1, 2, 9, 0, 0, DateTimeKind.Utc);
		DateTime dayTwoFirst = new(2026, 1, 3, 8, 0, 0, DateTimeKind.Utc);

		AddVibrationSample(context, userId, dayOneFirst, exposure: dayOneFirstExposure);
		AddVibrationSample(context, userId, dayOneSecond, exposure: dayOneSecondExposure);
		AddVibrationSample(context, userId, dayTwoFirst, exposure: dayTwoFirstExposure);

		await context.SaveChangesAsync();
		await RefreshAllMaterializedViewsAsync(context);

		ExposureDataRequestDto request = new(
			StartTime: dayOneFirst.AddMinutes(-1),
			EndTime: dayTwoFirst.AddMinutes(1),
			Granularity: TimeGranularity.Hour,
			Function: AggregationFunction.Sum,
			Field: null
		);

		List<ExposureDataDto> result = (
			await service.GetAggregatedDataAsync(request, userId, ExposureType.Vibration)
		)
			.OrderBy(point => point.Time)
			.ToList();

		Assert.Equal(3, result.Count);
		Assert.Equal(dayOneFirst, result[0].Time);
		Assert.Equal(dayOneFirstExposure, result[0].Value, precision: 3);
		Assert.Equal(dayOneSecond, result[1].Time);
		Assert.Equal(expectedDayOneSecondCumulative, result[1].Value, precision: 3);
		Assert.Equal(dayTwoFirst, result[2].Time);
		Assert.Equal(dayTwoFirstExposure, result[2].Value, precision: 3);
	}

	[Fact]
	public async Task GetOverviewDataAsync_CombinesExposureBucketsAndUsesHighestDangerLevel()
	{
		await using var context = Fixture.CreateDbContext();
		var service = new ExposureDataService(context, Fixture.CreateOperatorContext());

		Guid userId = SeedIds.KariId;
		DateTime bucketTime = new(2026, 1, 4, 10, 0, 0, DateTimeKind.Utc);

		AddNoiseSample(context, userId, bucketTime, laeq: 82d, lcpk: 120d);
		AddDustSample(context, userId, bucketTime, pm1t: 35d);

		await context.SaveChangesAsync();
		await RefreshAllMaterializedViewsAsync(context);

		var requests = new Dictionary<ExposureType, ExposureDataRequestDto>
		{
			[ExposureType.Noise] = new ExposureDataRequestDto(
				bucketTime.AddMinutes(-1),
				bucketTime.AddMinutes(1),
				TimeGranularity.Minute,
				AggregationFunction.Avg,
				null
			),
			[ExposureType.Dust] = new ExposureDataRequestDto(
				bucketTime.AddMinutes(-1),
				bucketTime.AddMinutes(1),
				TimeGranularity.Minute,
				AggregationFunction.Avg,
				Field.Pm1_twa
			),
		};

		CombinedExposureBucketDto bucket = Assert.Single(
			await service.GetOverviewDataAsync(requests, userId)
		);

		Assert.Equal(bucketTime, bucket.Time);
		Assert.Equal(DangerLevel.Danger, bucket.DangerLevel);
		Assert.Equal(DangerLevel.Warning, bucket.ExposureDangerLevels[ExposureType.Noise]);
		Assert.Equal(DangerLevel.Danger, bucket.ExposureDangerLevels[ExposureType.Dust]);
	}

	[Fact]
	public async Task GetHourDomainForWeekAsync_ReturnsHourBoundsAcrossExposureTypes()
	{
		await using var context = Fixture.CreateDbContext();
		var service = new ExposureDataService(context, Fixture.CreateOperatorContext());

		Guid userId = SeedIds.KariId;
		const int expectedMinHour = 6;
		const int expectedMaxHour = 18;
		DateTime earlyHour = new(2026, 1, 5, 6, 0, 0, DateTimeKind.Utc);
		DateTime lateHour = new(2026, 1, 5, 18, 0, 0, DateTimeKind.Utc);

		AddNoiseSample(context, userId, earlyHour, laeq: 70d, lcpk: 90d);
		AddDustSample(context, userId, lateHour, pm1t: 20d);

		await context.SaveChangesAsync();
		await RefreshAllMaterializedViewsAsync(context);

		var requests = new Dictionary<ExposureType, ExposureDataRequestDto>
		{
			[ExposureType.Noise] = new ExposureDataRequestDto(
				earlyHour.AddHours(-1),
				lateHour.AddHours(1),
				TimeGranularity.Minute,
				AggregationFunction.Avg,
				null
			),
			[ExposureType.Dust] = new ExposureDataRequestDto(
				earlyHour.AddHours(-1),
				lateHour.AddHours(1),
				TimeGranularity.Minute,
				AggregationFunction.Avg,
				Field.Pm1_twa
			),
		};

		HourDomainDto domain = await service.GetHourDomainForWeekAsync(requests, userId);

		Assert.Equal(expectedMinHour, domain.MinHourUtc);
		Assert.Equal(expectedMaxHour, domain.MaxHourUtc);
	}

	[Fact]
	public async Task GetHourDomainForWeekAsync_NoData_ReturnsFullUtcDayDomain()
	{
		await using var context = Fixture.CreateDbContext();
		var service = new ExposureDataService(context, Fixture.CreateOperatorContext());

		const int expectedMinHour = 0;
		const int expectedMaxHour = 23;
		DateTime reference = new(2026, 1, 6, 12, 0, 0, DateTimeKind.Utc);
		var requests = new Dictionary<ExposureType, ExposureDataRequestDto>
		{
			[ExposureType.Noise] = new ExposureDataRequestDto(
				reference.AddHours(-1),
				reference.AddHours(1),
				TimeGranularity.Minute,
				AggregationFunction.Avg,
				null
			),
		};

		HourDomainDto domain = await service.GetHourDomainForWeekAsync(requests, SeedIds.KariId);

		Assert.Equal(expectedMinHour, domain.MinHourUtc);
		Assert.Equal(expectedMaxHour, domain.MaxHourUtc);
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

	private static async Task RefreshAllMaterializedViewsAsync(AppDbContext context)
	{
		await context.Database.ExecuteSqlRawAsync("REFRESH MATERIALIZED VIEW noise_data_minutely;");
		await context.Database.ExecuteSqlRawAsync("REFRESH MATERIALIZED VIEW noise_data_hourly;");
		await context.Database.ExecuteSqlRawAsync("REFRESH MATERIALIZED VIEW noise_data_daily;");

		await context.Database.ExecuteSqlRawAsync("REFRESH MATERIALIZED VIEW dust_data_minutely;");
		await context.Database.ExecuteSqlRawAsync("REFRESH MATERIALIZED VIEW dust_data_hourly;");
		await context.Database.ExecuteSqlRawAsync("REFRESH MATERIALIZED VIEW dust_data_daily;");

		await context.Database.ExecuteSqlRawAsync(
			"REFRESH MATERIALIZED VIEW vibration_data_minutely;"
		);
		await context.Database.ExecuteSqlRawAsync(
			"REFRESH MATERIALIZED VIEW vibration_data_hourly;"
		);
		await context.Database.ExecuteSqlRawAsync(
			"REFRESH MATERIALIZED VIEW vibration_data_daily;"
		);
	}
}
