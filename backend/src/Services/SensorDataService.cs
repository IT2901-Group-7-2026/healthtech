using Backend.Data;
using Backend.DTOs;
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
				&& (requestContext.UserId == null || data.UserId == requestContext.UserId)
			)
			.ToListAsync();

		var dataWithDangerLevels = ThresholdUtils.CalculateDangerLevels(sensorType, rawSensorData);

		var result = dataWithDangerLevels.Select(item => new SensorDataDto
		{
			Time = item.data.Time,
			Value = item.data.Value,
			DangerLevel = item.dangerLevel,
		});

		return result;
	}
}
