using Backend.DTOs;
using Backend.Models;
using Backend.Records;
using Backend.Utils;

namespace Backend.Tests.UnitTests.Utils;

/// <summary>
/// Unit tests for ThresholdUtils to verify danger level calculation logic.
/// </summary>
public class ThresholdsUtilsTests
{
	/// <summary>
	/// Verifies that calculating danger levels returns an empty result when no raw sensor data is provided.
	/// </summary>
	[Fact]
	public void CalculateDangerLevels_NoData_ReturnsEmpty()
	{
		var sensorType = SensorType.Noise;
		var rawSensorData = new List<RawSensorData>();

		var result = ThresholdUtils.CalculateDangerLevels(sensorType, rawSensorData);

		Assert.Empty(result);
	}

	/// <summary>
	/// Verifies that a single noise data point returns danger for the average value and safe for the peak value.
	/// </summary>
	[Fact]
	public void CalculateDangerLevels_SingleNoiseDataPoint_ReturnsExpectedLevels()
	{
		var sensorType = SensorType.Noise;
		var threshold = Threshold.Noise;
		var rawSensorData = new List<RawSensorData>
		{
			new(
				DateTime.UtcNow,
				0,
				threshold.Danger,
				threshold.PeakDanger!.Value - 1,
				0,
				Guid.NewGuid()
			),
		};
		var result = ThresholdUtils.CalculateDangerLevels(sensorType, rawSensorData).ToList();

		Assert.Single(result);
		var (_, dangerLevels) = result[0];
		Assert.Equal(DangerLevel.Danger, dangerLevels.dangerLevel);
		Assert.Equal(DangerLevel.Safe, dangerLevels.peakDangerLevel);
	}

	/// <summary>
	/// Verifies that a single noise data point returns peak danger when the maximum value exceeds the peak threshold.
	/// </summary>
	[Fact]
	public void CalculateDangerLevels_SingleNoiseDataPoint_WithPeakBreach_ReturnsPeakDanger()
	{
		var threshold = Threshold.Noise;
		var rawSensorData = new List<RawSensorData>
		{
			new(
				DateTime.UtcNow,
				0,
				threshold.Warning - 1,
				threshold.PeakDanger!.Value + 10,
				0,
				Guid.NewGuid()
			),
		};

		var result = ThresholdUtils.CalculateDangerLevels(SensorType.Noise, rawSensorData).ToList();

		Assert.Single(result);
		var (_, dangerLevels) = result[0];
		Assert.Equal(DangerLevel.Safe, dangerLevels.dangerLevel);
		Assert.Equal(DangerLevel.Danger, dangerLevels.peakDangerLevel);
	}

	/// <summary>
	/// Verifies that dust danger level calculations use the average value and do not produce a peak danger level.
	/// </summary>
	[Fact]
	public void CalculateDangerLevels_Dust_UsesAverageValueAndHasNoPeakLevel()
	{
		var threshold = Threshold.Dust;
		var rawSensorData = new List<RawSensorData>
		{
			new(DateTime.UtcNow, 0, threshold.Danger + 1, 0, 0, Guid.NewGuid()),
		};

		var result = ThresholdUtils.CalculateDangerLevels(SensorType.Dust, rawSensorData).ToList();

		Assert.Single(result);
		var (_, dangerLevels) = result[0];
		Assert.Equal(DangerLevel.Danger, dangerLevels.dangerLevel);
		Assert.Null(dangerLevels.peakDangerLevel);
	}

	/// <summary>
	/// Verifies that vibration danger level calculations use cumulative daily values and reset when the day changes.
	/// </summary>
	[Fact]
	public void CalculateDangerLevels_Vibration_UsesDailyCumulativeAndResetsPerDay()
	{
		var threshold = Threshold.Vibration;
		var userId = Guid.NewGuid();
		var dayOneFirst = new DateTime(2026, 4, 10, 8, 0, 0, DateTimeKind.Utc);
		var dayOneSecond = new DateTime(2026, 4, 10, 9, 0, 0, DateTimeKind.Utc);
		var dayTwoFirst = new DateTime(2026, 4, 11, 8, 0, 0, DateTimeKind.Utc);

		var rawSensorData = new List<RawSensorData>
		{
			new(dayOneSecond, 0, 0, 0, threshold.Warning - 30, userId),
			new(dayTwoFirst, 0, 0, 0, threshold.Warning - 40, userId),
			new(dayOneFirst, 0, 0, 0, threshold.Warning - 50, userId),
		};

		var result = ThresholdUtils
			.CalculateDangerLevels(SensorType.Vibration, rawSensorData)
			.ToList();

		Assert.Equal(3, result.Count);

		var expectedDangerLevels = new Dictionary<DateTime, DangerLevel>
		{
			{ dayOneFirst, DangerLevel.Safe },
			{ dayOneSecond, DangerLevel.Warning },
			{ dayTwoFirst, DangerLevel.Safe },
		};

		foreach (var (data, dangerLevels) in result)
		{
			Assert.True(expectedDangerLevels.ContainsKey(data.Time));
			Assert.Equal(expectedDangerLevels[data.Time], dangerLevels.dangerLevel);
			Assert.Null(dangerLevels.peakDangerLevel);
		}
	}

	/// <summary>
	/// Verifies that noise danger level calculation returns safe values when the average value is below the warning threshold.
	/// </summary>
	[Fact]
	public void CalculateDangerLevel_Noise_WhenValueBelowWarning_ReturnsSafeAndPeakSafe()
	{
		var threshold = Threshold.Noise;
		var result = ThresholdUtils.CalculateDangerLevel(
			SensorType.Noise,
			value: threshold.Warning - 1,
			maxValue: threshold.PeakDanger!.Value - 1
		);

		Assert.Equal(DangerLevel.Safe, result.dangerLevel);
		Assert.Equal(DangerLevel.Safe, result.peakDangerLevel);
	}

	/// <summary>
	/// Verifies that noise danger level calculation returns warning when the average value is at the warning threshold.
	/// </summary>
	[Fact]
	public void CalculateDangerLevel_Noise_WhenValueAtWarning_ReturnsWarning()
	{
		var threshold = Threshold.Noise;
		var result = ThresholdUtils.CalculateDangerLevel(
			SensorType.Noise,
			value: threshold.Warning,
			maxValue: threshold.Warning
		);

		Assert.Equal(DangerLevel.Warning, result.dangerLevel);
		Assert.Equal(DangerLevel.Safe, result.peakDangerLevel);
	}

	/// <summary>
	/// Verifies that noise danger level calculation returns danger and peak danger when both thresholds are reached.
	/// </summary>
	[Fact]
	public void CalculateDangerLevel_Noise_WhenValueAtDangerAndPeakAtLimit_ReturnsDangerAndPeakDanger()
	{
		var threshold = Threshold.Noise;
		var result = ThresholdUtils.CalculateDangerLevel(
			SensorType.Noise,
			value: threshold.Danger,
			maxValue: threshold.PeakDanger!.Value
		);

		Assert.Equal(DangerLevel.Danger, result.dangerLevel);
		Assert.Equal(DangerLevel.Danger, result.peakDangerLevel);
	}

	/// <summary>
	/// Verifies that dust calculations use field-specific thresholds when a supported field override is provided.
	/// </summary>
	[Fact]
	public void CalculateDangerLevel_DustFieldOverride_Pm10Twa_UsesFieldThresholds()
	{
		var threshold = Threshold.DustPm10Twa;
		var safeResult = ThresholdUtils.CalculateDangerLevel(
			SensorType.Dust,
			value: threshold.Danger - 1,
			maxValue: null,
			field: Field.Pm10_twa
		);

		var dangerResult = ThresholdUtils.CalculateDangerLevel(
			SensorType.Dust,
			value: threshold.Danger,
			maxValue: null,
			field: Field.Pm10_twa
		);

		Assert.Equal(DangerLevel.Safe, safeResult.dangerLevel);
		Assert.Equal(DangerLevel.Danger, dangerResult.dangerLevel);
		Assert.Null(safeResult.peakDangerLevel);
		Assert.Null(dangerResult.peakDangerLevel);
	}

	/// <summary>
	/// Verifies that the highest danger level helper returns the most severe non-null value.
	/// </summary>
	[Fact]
	public void GetHighestDangerLevel_WithNullAndLowerValues_ReturnsWorst()
	{
		var result = ThresholdUtils.GetHighestDangerLevel(
			null,
			DangerLevel.Warning,
			DangerLevel.Safe,
			null
		);

		Assert.Equal(DangerLevel.Warning, result);
	}

	/// <summary>
	/// Verifies that the highest danger level helper returns safe when all provided values are null.
	/// </summary>
	[Fact]
	public void GetHighestDangerLevel_AllNull_ReturnsSafe()
	{
		var result = ThresholdUtils.GetHighestDangerLevel(null, null);

		Assert.Equal(DangerLevel.Safe, result);
	}
}
