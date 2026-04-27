using Backend.DTOs;
using Backend.Middleware;
using Backend.Models;
using Backend.Records;
using Backend.Utils;
using Microsoft.EntityFrameworkCore;

namespace Backend.Services;

public interface IExposureDataService
{
	Task<IEnumerable<ExposureDataDto>> GetAggregatedDataAsync(
		ExposureDataRequestDto request,
		Guid? userId,
		ExposureType exposureType
	);
	Task<IEnumerable<CombinedExposureBucketDto>> GetOverviewDataAsync(
		Dictionary<ExposureType, ExposureDataRequestDto> requests,
		Guid? userId
	);
	Task<HourDomainDto> GetHourDomainForWeekAsync(
		Dictionary<ExposureType, ExposureDataRequestDto> requests,
		Guid? userId
	);
}

public class ExposureDataService(AppDbContext context, SignedInUserContext signedInUserContext)
	: IExposureDataService
{
	private readonly AppDbContext _context = context;
	private readonly SignedInUserContext _signedInUserContext = signedInUserContext;

	public async Task<IEnumerable<ExposureDataDto>> GetAggregatedDataAsync(
		ExposureDataRequestDto request,
		Guid? userId,
		ExposureType exposureType
	)
	{
		string materializedViewName = ExposureUtils.GetMaterializedViewName(
			exposureType,
			request.Granularity
		);

		string aggregateColumnName = ExposureUtils.GetAggregateColumnName(
			request.Function,
			exposureType,
			request.Field
		);

		DateTimeOffset startTime = request.StartTime;
		DateTimeOffset endTime = request.EndTime;

		startTime = AuthorizationUtils.ClampRequestStartDateForRole(
			startTime.UtcDateTime,
			_signedInUserContext?.User?.Role
		);
		endTime = TimeWindowUtils.ClampRequestEndDateToCurrentDateTime(endTime.UtcDateTime);

		string avgColumnName = ExposureUtils.GetAggregateColumnName(
			AggregationFunction.Avg,
			exposureType,
			request.Field
		);

		string maxColumnName = ExposureUtils.GetAggregateColumnName(
			AggregationFunction.Max,
			exposureType,
			request.Field
		);

		string sumColumnName = ExposureUtils.GetAggregateColumnName(
			AggregationFunction.Sum,
			exposureType,
			request.Field
		);

		var sql =
			$@"
            SELECT 
                bucket as ""Time"",
                {aggregateColumnName} as ""Value"",
                {avgColumnName} as ""AvgValue"",
                {maxColumnName} as ""MaxValue"",
				{sumColumnName} as ""SumValue"",
				user_id as ""UserId""
            FROM {materializedViewName}";

		var rawExposureData = await _context
			.Database.SqlQueryRaw<RawExposureData>(sql)
			.AsQueryable()
			.Where(data =>
				data.Time >= startTime
				&& data.Time <= endTime
				&& (userId == null || data.UserId == userId)
			)
			.ToListAsync();

		// For vibration data, danger levels are always calculated from cumulative daily sum expore,
		// ignoring the requested aggregation function.
		// If the requested aggregation function is sum, the value is cumulated.
		// NOTE: Maybe this should be changed in the future, for example by only allowing sum aggregation for vibration data,
		// but for now this is done to allow fetching different aggregations while making sure the threshold logic remains correct.
		var dataWithCumulatedExposureSumValues = ExposureUtils.CumulateVibrationSumValues(
			exposureType,
			request.Function,
			rawExposureData
		);

		var dataWithDangerLevels = ThresholdUtils.CalculateDangerLevels(
			exposureType,
			dataWithCumulatedExposureSumValues,
			request.Field
		);

		var result = dataWithDangerLevels.Select(item => new ExposureDataDto
		{
			Time = item.data.Time,
			Value = item.data.Value,
			PeakValue = exposureType == ExposureType.Noise ? item.data.MaxValue : null,
			DangerLevel = item.dangerLevels.dangerLevel,
			PeakDangerLevel = item.dangerLevels.peakDangerLevel,
		});

		return result;
	}

	/// <summary>
	/// Combines data from multiple exposure requests into buckets
	/// </summary>
	/// <param name="requests"></param>
	/// <param name="userId"></param>
	/// <returns></returns>
	public async Task<IEnumerable<CombinedExposureBucketDto>> GetOverviewDataAsync(
		Dictionary<ExposureType, ExposureDataRequestDto> requests,
		Guid? userId
	)
	{
		Dictionary<DateTime, CombinedExposureBucketDto> combinedData = [];

		foreach (var (exposureType, request) in requests)
		{
			DateTime startTime = AuthorizationUtils.ClampRequestStartDateForRole(
				request.StartTime.UtcDateTime,
				_signedInUserContext?.User?.Role
			);
			DateTime endTime = TimeWindowUtils.ClampRequestEndDateToCurrentDateTime(
				request.EndTime.UtcDateTime
			);

			IEnumerable<ExposureDataDto> exposureDataList = await GetAggregatedDataAsync(
				request,
				userId,
				exposureType
			);

			foreach (var exposureData in exposureDataList)
			{
				if (!combinedData.TryGetValue(exposureData.Time, out CombinedExposureBucketDto? bucket))
				{
					bucket = new CombinedExposureBucketDto
					{
						Time = exposureData.Time,
						DangerLevel = exposureData.DangerLevel,
						ExposureDangerLevels = [],
					};
					combinedData[exposureData.Time] = bucket;
				}

				bucket.ExposureDangerLevels[exposureType] = exposureData.DangerLevel;

				if (exposureData.DangerLevel > bucket.DangerLevel)
				{
					bucket.DangerLevel = exposureData.DangerLevel;
				}
			}
		}

		return combinedData.Values.OrderBy(bucket => bucket.Time).ToList();
	}

	public async Task<HourDomainDto> GetHourDomainForWeekAsync(
		Dictionary<ExposureType, ExposureDataRequestDto> requests,
		Guid? userId
	)
	{
		HashSet<DateTime> timestamps = [];

		foreach (var (exposureType, request) in requests)
		{
			// We always calculate domain based on the hourly data for the whole week.
			DateTimeOffset weekStart = GetWeekStart(request.StartTime.UtcDateTime);
			DateTimeOffset weekEnd = GetWeekEnd(request.StartTime.UtcDateTime);

			DateTime startTime = AuthorizationUtils.ClampRequestStartDateForRole(
				request.StartTime.UtcDateTime,
				_signedInUserContext?.User?.Role
			);
			DateTime endTime = TimeWindowUtils.ClampRequestEndDateToCurrentDateTime(
				request.EndTime.UtcDateTime
			);

			var weekRequest = request with
			{
				StartTime = startTime,
				EndTime = endTime,
				Granularity = TimeGranularity.Hour,
			};

			var weekData = await GetAggregatedDataAsync(weekRequest, userId, exposureType);

			foreach (var dataPoint in weekData)
			{
				timestamps.Add(dataPoint.Time);
			}
		}

		return GetHourDomain(timestamps);
	}

	private HourDomainDto GetHourDomain(IEnumerable<DateTime> timestamps)
	{
		int minAllowedHour = 0;
		int maxAllowedHour = 23;

		if (!timestamps.Any())
		{
			return new HourDomainDto { MinHourUtc = minAllowedHour, MaxHourUtc = maxAllowedHour };
		}

		int minHour = timestamps.Min().Hour;
		int maxHour = timestamps.Max().Hour;

		return new HourDomainDto { MinHourUtc = minHour, MaxHourUtc = maxHour };
	}

	private static DateTimeOffset GetWeekStart(DateTime date)
	{
		var dayOfWeek = (int)date.DayOfWeek;
		var diff = date.Date.AddDays(-dayOfWeek);
		return new DateTimeOffset(diff, TimeSpan.Zero);
	}

	private static DateTimeOffset GetWeekEnd(DateTime date)
	{
		var weekStart = GetWeekStart(date);
		return weekStart.AddDays(7).AddTicks(-1);
	}
}
