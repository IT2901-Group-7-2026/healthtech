using Backend.DTOs;
using Backend.Models;

namespace Backend.Utils;

public class SensorUtils
{
	public static string GetMaterializedViewName(SensorType sensorType, TimeGranularity granularity)
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

	public static string GetAggregateColumnName(
		AggregationFunction function,
		SensorType sensorType,
		Field? field
	)
	{
		var sensorTypeLower = sensorType.ToString().ToLower();

		// Noise uses laeq for average and lcpk for max
		if (sensorType == SensorType.Noise)
		{
			if (function == AggregationFunction.Avg)
			{
				return "avg_noise_laeq";
			}
			else if (function == AggregationFunction.Max)
			{
				return "max_noise_lcpk";
			}
		}

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

		if (sensorType == SensorType.Noise)
		{
			if (function == AggregationFunction.Max)
			{
				aggregateColumnName += "_lcpk";
			}
			else
			{
				aggregateColumnName += "_laeq";
			}
		}

		return aggregateColumnName;
	}
}
