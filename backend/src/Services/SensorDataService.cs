using Backend.Data;
using Backend.DTOs;
using Backend.Middleware;
using Backend.Models;
using Backend.Records;
using Backend.Utils;
using Microsoft.EntityFrameworkCore;

namespace Backend.Services;

public interface ISensorDataService
{
	Task<IEnumerable<SensorDataDto>> GetAggregatedDataAsync(
		SensorDataRequestDto request,
		Guid? userId,
		SensorType sensorType
	);
	Task<IEnumerable<CombinedSensorBucketDto>> GetOverviewDataAsync(
		Dictionary<SensorType, SensorDataRequestDto> requests,
		Guid? userId
	);
}

public class SensorDataService(AppDbContext context, SignedInUserContext signedInUserContext)
	: ISensorDataService
{
	private readonly AppDbContext _context = context;
	private readonly SignedInUserContext _signedInUserContext = signedInUserContext;

	public async Task<IEnumerable<SensorDataDto>> GetAggregatedDataAsync(
		SensorDataRequestDto request,
		Guid? userId,
		SensorType sensorType
	)
	{
		string materializedViewName = SensorUtils.GetMaterializedViewName(
			sensorType,
			request.Granularity
		);

		string aggregateColumnName = SensorUtils.GetAggregateColumnName(
			request.Function,
			sensorType,
			request.Field
		);

		DateTimeOffset startTime = request.StartTime;
		DateTimeOffset endTime = request.EndTime;

		startTime = AuthorizationUtils.ClampRequestStartDateForRole(
			startTime.UtcDateTime,
			_signedInUserContext?.User?.Role
		);

		string avgColumnName = SensorUtils.GetAggregateColumnName(
			AggregationFunction.Avg,
			sensorType,
			request.Field
		);

		string maxColumnName = SensorUtils.GetAggregateColumnName(
			AggregationFunction.Max,
			sensorType,
			request.Field
		);

		string sumColumnName = SensorUtils.GetAggregateColumnName(
			AggregationFunction.Sum,
			sensorType,
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

		var rawSensorData = await _context
			.Database.SqlQueryRaw<RawSensorData>(sql)
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
		var dataWithCumulatedSensorSumValues = SensorUtils.CumulateVibrationSumValues(
			sensorType,
			request.Function,
			rawSensorData
		);

		var dataWithDangerLevels = ThresholdUtils.CalculateDangerLevels(
			sensorType,
			dataWithCumulatedSensorSumValues,
			request.Field
		);

		var result = dataWithDangerLevels.Select(item => new SensorDataDto
		{
			Time = item.data.Time,
			Value = item.data.Value,
			PeakValue = sensorType == SensorType.Noise ? item.data.MaxValue : null,
			DangerLevel = item.dangerLevels.dangerLevel,
			PeakDangerLevel = item.dangerLevels.peakDangerLevel,
		});

		return result;
	}

	/// <summary>
	/// Combines data from multiple sensor requests into buckets
	/// </summary>
	/// <param name="requests"></param>
	/// <param name="userId"></param>
	/// <returns></returns>
	public async Task<IEnumerable<CombinedSensorBucketDto>> GetOverviewDataAsync(
		Dictionary<SensorType, SensorDataRequestDto> requests,
		Guid? userId
	)
	{
		Dictionary<DateTime, CombinedSensorBucketDto> combinedData = [];

		foreach (var (sensorType, request) in requests)
		{
			IEnumerable<SensorDataDto> sensorDataList = await GetAggregatedDataAsync(
				request,
				userId,
				sensorType
			);

			foreach (var sensorData in sensorDataList)
			{
				if (!combinedData.TryGetValue(sensorData.Time, out CombinedSensorBucketDto? bucket))
				{
					bucket = new CombinedSensorBucketDto
					{
						Time = sensorData.Time,
						DangerLevel = sensorData.DangerLevel,
						SensorDangerLevels = [],
					};
					combinedData[sensorData.Time] = bucket;
				}

				bucket.SensorDangerLevels[sensorType] = sensorData.DangerLevel;

				if (sensorData.DangerLevel > bucket.DangerLevel)
				{
					bucket.DangerLevel = sensorData.DangerLevel;
				}
			}
		}

		return combinedData.Values.OrderBy(bucket => bucket.Time).ToList();
	}
}
