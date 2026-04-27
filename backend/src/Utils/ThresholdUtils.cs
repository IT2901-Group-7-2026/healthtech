using Backend.DTOs;
using Backend.Models;
using Backend.Records;

namespace Backend.Utils;

public static class ThresholdUtils
{
	public static IEnumerable<(
		RawExposureData data,
		(DangerLevel dangerLevel, DangerLevel? peakDangerLevel) dangerLevels
	)> CalculateDangerLevels(
		ExposureType exposureType,
		IEnumerable<RawExposureData> rawExposureData,
		Field? field = null
	)
	{
		var result =
			new List<(
				RawExposureData data,
				(DangerLevel dangerLevel, DangerLevel? peakDangerLevel) dangerLevels
			)>();

		// Vibration thresholds are calculated cumulatively over a day
		if (exposureType == ExposureType.Vibration)
		{
			var sortedData = rawExposureData.OrderBy(data => data.Time).ToList();
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

				result.Add((data, CalculateDangerLevel(exposureType, cumulativeValue, null, field)));
			}

			return result;
		}

		foreach (var data in rawExposureData)
		{
			// We only use max value for noise thresholds to calculate peak danger levels
			double? maxValue = exposureType == ExposureType.Noise ? data.MaxValue : null;

			result.Add((data, CalculateDangerLevel(exposureType, data.AvgValue, maxValue, field)));
		}

		return result;
	}

	public static (DangerLevel dangerLevel, DangerLevel? peakDangerLevel) CalculateDangerLevel(
		ExposureType exposureType,
		double value,
		double? maxValue,
		Field? field = null
	)
	{
		Threshold threshold = Threshold.GetThresholdForExposureTypeAndField(exposureType, field);

		DangerLevel dangerLevel = DangerLevel.Safe;
		DangerLevel? peakDangerLevel = null;

		if (threshold.PeakDanger.HasValue && maxValue.HasValue)
		{
			if (maxValue.Value >= threshold.PeakDanger.Value)
			{
				peakDangerLevel = DangerLevel.Danger;
			}
			else
			{
				peakDangerLevel = DangerLevel.Safe;
			}
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
