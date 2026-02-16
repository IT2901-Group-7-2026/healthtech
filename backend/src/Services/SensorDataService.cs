using Backend.Data;
using Backend.DTOs;
using Backend.Models;
using Backend.Records;
using Backend.Utils;
using Microsoft.EntityFrameworkCore;

namespace Backend.Services;

public interface ISensorDataService
{
	Task<IEnumerable<NoiseData>> GetAllNoiseDataAsync();
	Task<IEnumerable<SensorDataDto>> GetAggregatedDataAsync(RequestContext requestContext);
}

public class SensorDataService(AppDbContext context) : ISensorDataService
{
	private readonly AppDbContext _context = context;

	// TODO: Cumulative value for vibration is still being done in the frontend, but now the dangerlevel cumulation is done here which could lead to confusion.
	// Maybe instead of always cumulate vibration, add a flag to the request to indicate if cumulation is wanted? And then do cumulation for both value and dangerlevel here?

	public async Task<IEnumerable<NoiseData>> GetAllNoiseDataAsync()
	{
		return await _context.NoiseData.ToListAsync();
	}

	public async Task<IEnumerable<SensorDataDto>> GetAggregatedDataAsync(
		RequestContext requestContext
	)
	{
		var request = requestContext.Request;
		var sensorType = requestContext.SensorType;

		string materializedViewName = GetMaterializedViewName(sensorType, request.Granularity);

		string aggregateColumnName = GetAggregateColumnName(
			request.Function,
			sensorType,
			request.Field
		);

		DateTimeOffset startTime = request.StartTime;
		DateTimeOffset endTime = request.EndTime;

		// We always fetch max to determine DangerLevel
		string maxColumnName = GetAggregateColumnName(
			AggregationFunction.Max,
			sensorType,
			request.Field
		);

		var sql =
			$@"
            SELECT 
                bucket as Time,
                {aggregateColumnName} as Value,
                {maxColumnName} as MaxValue
            FROM {materializedViewName}
            WHERE bucket >= {{0}} AND bucket <= {{1}}
            ORDER BY bucket";

		var rawSensorData = await _context
			.Database.SqlQueryRaw<RawSensorData>(sql, startTime, endTime)
			.ToListAsync();

		var dataWithDangerLevels = ThresholdUtils.CalculateDangerLevels(sensorType, rawSensorData);

		var result = dataWithDangerLevels.Select(item => new SensorDataDto
		{
			Time = item.data.Time,
			Value = item.data.Value,
			DangerLevel = item.level,
		});

		return result;
	}

	private string GetMaterializedViewName(SensorType sensorType, TimeGranularity granularity)
	{
		var sensorTypeLower = sensorType.ToString().ToLower();

		var sensorType_split = sensorTypeLower + "_data";

		return granularity switch
		{
			TimeGranularity.Minute => sensorType_split + "_minutely",
			TimeGranularity.Hour => sensorType_split + "_hourly",
			TimeGranularity.Day => sensorType_split + "_daily",
			_ => throw new ArgumentException($"Unsupported scope: {granularity}"),
		};
	}

	private string GetAggregateColumnName(
		AggregationFunction function,
		SensorType sensorType,
		Field? field
	)
	{
		var sensorTypeLower = sensorType.ToString().ToLower();

		var aggregateColumnName = function switch
		{
			AggregationFunction.Avg => "avg_" + sensorTypeLower,
			AggregationFunction.Sum => "sum_" + sensorTypeLower,
			AggregationFunction.Min => "min_" + sensorTypeLower,
			AggregationFunction.Max => "max_" + sensorTypeLower,
			AggregationFunction.Count => "sample_count",
			_ => throw new ArgumentException($"Unsupported aggregation type: {function}"),
		};

		if (field.HasValue)
		{
			aggregateColumnName += "_" + field.Value.ToString().ToLower();
		}

		return aggregateColumnName;
	}
}
