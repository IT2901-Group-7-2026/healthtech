using Backend.DTOs;
using Backend.Models;

namespace Backend.Utils;

public class SensorUtils
{
	public static string GetMaterializedViewName(DataType dataType, TimeGranularity granularity)
	{
		var dataTypeLower = dataType.ToString().ToLower();

		var dataType_split = dataTypeLower + "_data";

		return granularity switch
		{
			TimeGranularity.Minute => dataType_split + "_minutely",
			TimeGranularity.Hour => dataType_split + "_hourly",
			TimeGranularity.Day => dataType_split + "_daily",
			_ => throw new ArgumentException($"Unsupported scope: {granularity}"),
		};
	}

	public static string GetAggregateColumnName(
		AggregationFunction function,
		DataType dataType,
		Field? field
	)
	{
		var dataTypeLower = dataType.ToString().ToLower();

		// Noise uses laeq for average and lcpk for max
		if (dataType == DataType.Noise)
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
			AggregationFunction.Avg => "avg_" + dataTypeLower,
			AggregationFunction.Sum => "sum_" + dataTypeLower,
			AggregationFunction.Min => "min_" + dataTypeLower,
			AggregationFunction.Max => "max_" + dataTypeLower,
			AggregationFunction.Count => "sample_count",
			_ => throw new ArgumentException($"Unsupported aggregation type: {function}"),
		};

		if (field.HasValue)
		{
			aggregateColumnName += "_" + field.Value.ToString().ToLower();
		}

		if (dataType == DataType.Noise)
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
