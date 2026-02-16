using Backend.Models;
using Backend.Records;

namespace Backend.Utils;

public static class ThresholdUtils
{
	public static IEnumerable<(RawSensorData data, DangerLevel dangerLevel)> CalculateDangerLevels(
		DataType dataType,
		IEnumerable<RawSensorData> rawSensorData
	)
	{
		var result = new List<(RawSensorData data, DangerLevel dangerLevel)>();

		// Vibration thresholds are calculated cumulatively over a day
		if (dataType == DataType.Vibration)
		{
			var sortedData = rawSensorData.OrderBy(data => data.Time).ToList();
			double cumulativeValue = 0;
			DateOnly? currentDate = null;

			foreach (var data in sortedData)
			{
				if (currentDate != DateOnly.FromDateTime(data.Time))
				{
					cumulativeValue = 0;
					currentDate = DateOnly.FromDateTime(data.Time);
				}

				cumulativeValue += data.SumValue;

				result.Add((data, CalculateDangerLevel(dataType, cumulativeValue, null)));
			}

			return result;
		}

		foreach (var data in rawSensorData)
		{
			// We only use max value for noise thresholds
			double? maxValue = dataType == DataType.Noise ? data.MaxValue : null;

			result.Add((data, CalculateDangerLevel(dataType, data.AvgValue, maxValue)));
		}

		return result;
	}

	public static DangerLevel CalculateDangerLevel(
		DataType dataType,
		double value,
		double? maxValue
	)
	{
		Threshold threshold = Threshold.GetThresholdForSensorType(dataType);

		DangerLevel dangerLevel = DangerLevel.Safe;

		// Noise has an additional peak danger level
		if (
			dataType == DataType.Noise
			&& threshold.PeakDanger.HasValue
			&& maxValue.HasValue
			&& maxValue.Value >= threshold.PeakDanger.Value
		)
		{
			dangerLevel = DangerLevel.Danger;
		}
		else if (value >= threshold.Danger)
		{
			dangerLevel = DangerLevel.Danger;
		}
		else if (value >= threshold.Warning)
		{
			dangerLevel = DangerLevel.Warning;
		}

		return dangerLevel;
	}

	public static DangerLevel GetHighestDangerLevel(params DangerLevel?[] levels)
	{
		var worst = DangerLevel.Safe;
		foreach (var lvl in levels)
		{
			if (lvl.HasValue && lvl.Value > worst)
			{
				worst = lvl.Value;
			}
		}
		return worst;
	}
}
