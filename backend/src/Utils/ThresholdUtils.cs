using Backend.Models;
using Backend.Records;

namespace Backend.Utils;

public static class ThresholdUtils
{
	public static IEnumerable<(
		RawSensorData data,
		(DangerLevel dangerLevel, DangerLevel? peakDangerLevel) dangerLevels
	)> CalculateDangerLevels(SensorType sensorType, IEnumerable<RawSensorData> rawSensorData)
	{
		var result =
			new List<(
				RawSensorData data,
				(DangerLevel dangerLevel, DangerLevel? peakDangerLevel) dangerLevels
			)>();

		// Vibration thresholds are calculated cumulatively over a day
		if (sensorType == SensorType.Vibration)
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

				result.Add((data, CalculateDangerLevel(sensorType, cumulativeValue, null)));
			}

			return result;
		}

		foreach (var data in rawSensorData)
		{
			// We only use max value for noise thresholds
			double? maxValue = sensorType == SensorType.Noise ? data.MaxValue : null;

			result.Add((data, CalculateDangerLevel(sensorType, data.AvgValue, maxValue)));
		}

		return result;
	}

	public static (DangerLevel dangerLevel, DangerLevel? peakDangerLevel) CalculateDangerLevel(
		SensorType sensorType,
		double value,
		double? maxValue
	)
	{
		Threshold threshold = Threshold.GetThresholdForSensorType(sensorType);

		DangerLevel dangerLevel = DangerLevel.Safe;
		DangerLevel? peakDangerLevel = null;

		if (
			threshold.PeakDanger.HasValue
			&& maxValue.HasValue
			&& maxValue.Value >= threshold.PeakDanger.Value
		)
		{
			peakDangerLevel = DangerLevel.Danger;
		}

		if (value >= threshold.Danger)
		{
			dangerLevel = DangerLevel.Danger;
		}
		else if (value >= threshold.Warning)
		{
			dangerLevel = DangerLevel.Warning;
		}

		return (dangerLevel, peakDangerLevel);
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
