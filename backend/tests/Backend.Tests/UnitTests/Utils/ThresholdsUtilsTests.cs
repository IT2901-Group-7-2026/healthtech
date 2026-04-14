using Backend.DTOs;
using Backend.Models;
using Backend.Records;
using Backend.Utils;

namespace Backend.Tests.UnitTests.Utils;

public class ThresholdsUtilsTests
{
	[Fact]
	public void CalculateDangerLevels_NoData_ReturnsEmpty()
	{
		// Arrange
		var sensorType = SensorType.Noise;
		var rawSensorData = new List<RawSensorData>();

		// Act
		var result = ThresholdUtils.CalculateDangerLevels(sensorType, rawSensorData);

		// Assert
		Assert.Empty(result);
	}

	[Fact]
	public void CalculateDangerLevels_SingleNoiseDataPoint_ReturnsExpectedLevels()
	{
		// Arrange
		var sensorType = SensorType.Noise;
		var rawSensorData = new List<RawSensorData>
		{
			new(DateTime.UtcNow, 85, 85, 90, 85, Guid.NewGuid()),
		};

		// Act
		var result = ThresholdUtils.CalculateDangerLevels(sensorType, rawSensorData).ToList();

		// Assert
		Assert.Single(result);
		var (_, dangerLevels) = result[0];
		Assert.Equal(DangerLevel.Danger, dangerLevels.dangerLevel);
		Assert.Equal(DangerLevel.Safe, dangerLevels.peakDangerLevel);
	}

	[Fact]
	public void CalculateDangerLevels_SingleNoiseDataPoint_WithPeakBreach_ReturnsPeakDanger()
	{
		// Arrange
		var rawSensorData = new List<RawSensorData>
		{
			new(DateTime.UtcNow, 0, 70, 131, 0, Guid.NewGuid()),
		};

		// Act
		var result = ThresholdUtils.CalculateDangerLevels(SensorType.Noise, rawSensorData).ToList();

		// Assert
		Assert.Single(result);
		var (_, dangerLevels) = result[0];
		Assert.Equal(DangerLevel.Safe, dangerLevels.dangerLevel);
		Assert.Equal(DangerLevel.Danger, dangerLevels.peakDangerLevel);
	}

	[Fact]
	public void CalculateDangerLevels_Dust_UsesAverageValueAndHasNoPeakLevel()
	{
		// Arrange
		var rawSensorData = new List<RawSensorData>
		{
			new(DateTime.UtcNow, 0, 31, 999, 0, Guid.NewGuid()),
		};

		// Act
		var result = ThresholdUtils.CalculateDangerLevels(SensorType.Dust, rawSensorData).ToList();

		// Assert
		Assert.Single(result);
		var (_, dangerLevels) = result[0];
		Assert.Equal(DangerLevel.Danger, dangerLevels.dangerLevel);
		Assert.Null(dangerLevels.peakDangerLevel);
	}

	[Fact]
	public void CalculateDangerLevels_Vibration_UsesDailyCumulativeAndResetsPerDay()
	{
		// Arrange
		var userId = Guid.NewGuid();
		var dayOneFirst = new DateTime(2026, 4, 10, 8, 0, 0, DateTimeKind.Utc);
		var dayOneSecond = new DateTime(2026, 4, 10, 9, 0, 0, DateTimeKind.Utc);
		var dayTwoFirst = new DateTime(2026, 4, 11, 8, 0, 0, DateTimeKind.Utc);

		var rawSensorData = new List<RawSensorData>
		{
			new(dayOneSecond, 0, 0, 0, 70, userId),
			new(dayTwoFirst, 0, 0, 0, 60, userId),
			new(dayOneFirst, 0, 0, 0, 50, userId),
		};

		// Act
		var result = ThresholdUtils.CalculateDangerLevels(SensorType.Vibration, rawSensorData).ToList();

		// Assert
		Assert.Equal(3, result.Count);
		Assert.Equal(dayOneFirst, result[0].data.Time);
		Assert.Equal(dayOneSecond, result[1].data.Time);
		Assert.Equal(dayTwoFirst, result[2].data.Time);

		Assert.Equal(DangerLevel.Safe, result[0].dangerLevels.dangerLevel);
		Assert.Equal(DangerLevel.Warning, result[1].dangerLevels.dangerLevel);
		Assert.Equal(DangerLevel.Safe, result[2].dangerLevels.dangerLevel);

		Assert.Null(result[0].dangerLevels.peakDangerLevel);
		Assert.Null(result[1].dangerLevels.peakDangerLevel);
		Assert.Null(result[2].dangerLevels.peakDangerLevel);
	}

	[Fact]
	public void CalculateDangerLevel_Noise_WhenValueBelowWarning_ReturnsSafeAndPeakSafe()
	{
		// Act
		var result = ThresholdUtils.CalculateDangerLevel(SensorType.Noise, value: 79, maxValue: 120);

		// Assert
		Assert.Equal(DangerLevel.Safe, result.dangerLevel);
		Assert.Equal(DangerLevel.Safe, result.peakDangerLevel);
	}

	[Fact]
	public void CalculateDangerLevel_Noise_WhenValueAtWarning_ReturnsWarning()
	{
		// Act
		var result = ThresholdUtils.CalculateDangerLevel(SensorType.Noise, value: 80, maxValue: 80);

		// Assert
		Assert.Equal(DangerLevel.Warning, result.dangerLevel);
		Assert.Equal(DangerLevel.Safe, result.peakDangerLevel);
	}

	[Fact]
	public void CalculateDangerLevel_Noise_WhenValueAtDangerAndPeakAtLimit_ReturnsDangerAndPeakDanger()
	{
		// Act
		var result = ThresholdUtils.CalculateDangerLevel(SensorType.Noise, value: 85, maxValue: 130);

		// Assert
		Assert.Equal(DangerLevel.Danger, result.dangerLevel);
		Assert.Equal(DangerLevel.Danger, result.peakDangerLevel);
	}

	[Fact]
	public void CalculateDangerLevel_DustFieldOverride_Pm10Twa_UsesFieldThresholds()
	{
		// Act
		var safeResult = ThresholdUtils.CalculateDangerLevel(
			SensorType.Dust,
			value: 29,
			maxValue: null,
			field: Field.Pm10_twa
		);

		var dangerResult = ThresholdUtils.CalculateDangerLevel(
			SensorType.Dust,
			value: 30,
			maxValue: null,
			field: Field.Pm10_twa
		);

		// Assert
		Assert.Equal(DangerLevel.Safe, safeResult.dangerLevel);
		Assert.Equal(DangerLevel.Danger, dangerResult.dangerLevel);
		Assert.Null(safeResult.peakDangerLevel);
		Assert.Null(dangerResult.peakDangerLevel);
	}

	[Fact]
	public void GetHighestDangerLevel_WithNullAndLowerValues_ReturnsWorst()
	{
		// Act
		var result = ThresholdUtils.GetHighestDangerLevel(null, DangerLevel.Warning, DangerLevel.Safe, null);

		// Assert
		Assert.Equal(DangerLevel.Warning, result);
	}

	[Fact]
	public void GetHighestDangerLevel_AllNull_ReturnsSafe()
	{
		// Act
		var result = ThresholdUtils.GetHighestDangerLevel(null, null);

		// Assert
		Assert.Equal(DangerLevel.Safe, result);
	}
}
