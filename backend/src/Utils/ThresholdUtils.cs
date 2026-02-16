using Backend.Models;
using Backend.Records;

namespace Backend.Utils;

public static class ThresholdUtils
{
	/// <summary>
	/// We calculate the danger level based on the max value for the queried time period, and compare it with sensor-specific max value thresholds.
	/// Therefore, it's important that all sensor data queries include the max value to correctly determine the danger level.
	/// </summary>
	public static IEnumerable<(RawSensorData data, DangerLevel level)> CalculateDangerLevels(
		SensorType sensorType,
		IEnumerable<RawSensorData> rawSensorData
	)
	{
		var result = new List<(RawSensorData data, DangerLevel level)>();

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

				cumulativeValue += data.Value;

				result.Add((data, CalculateDangerLevel(sensorType, cumulativeValue)));
			}

			return result;
		}

		// For other sensor types, calculate danger levels based on individual max values
		foreach (var data in rawSensorData)
		{
			result.Add((data, CalculateDangerLevel(sensorType, data.MaxValue)));
		}

		return result;
	}

	/// <summary>
	/// Calculate danger level from a single value.
	/// </summary>
	/// <remarks>
	/// Do NOT use this in a loop for query results. Use CalculateDangerLevels instead,
	/// which handles vibration's cumulative logic correctly.
	/// </remarks>
	public static DangerLevel CalculateDangerLevel(SensorType sensorType, double maxValue)
	{
		Threshold threshold = Threshold.GetThresholdForSensorType(sensorType);

		DangerLevel dangerLevel = DangerLevel.Safe;

		if (maxValue >= threshold.Danger)
		{
			dangerLevel = DangerLevel.Danger;
		}
		else if (maxValue >= threshold.Warning)
		{
			dangerLevel = DangerLevel.Warning;
		}

		return dangerLevel;
	}
}
