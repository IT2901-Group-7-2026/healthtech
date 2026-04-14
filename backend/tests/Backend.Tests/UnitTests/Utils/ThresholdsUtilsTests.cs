using Backend.Controllers;
using Backend.Data;
using Backend.DTOs;
using Backend.Models;
using Backend.Services;
using Backend.Utils;
using System.Linq;
using System.Collections.Generic;

namespace Backend.Tests.UnitTests.Utils;

/// <summary>
/// Unit tests for ThresholdUtils to verify danger level calculation logic.
/// </summary>
/// <remarks>
/// These tests focus on the core logic of calculating danger levels based on sensor data and thresholds.
/// They do not involve any database interactions or external dependencies, ensuring that the logic is tested in isolation.
/// </remarks>
/// <seealso cref="ThresholdUtils"/>
/// <seealso cref="DangerLevel"/>
/// <seealso cref="SensorType"/>
public class ThresholdsUtilsTest
{
    [Fact]
    public void CalculateDangerLevels_NoData_ReturnsEmpty()
    {
        // Arrange
        var sensorType = SensorType.Noise;
        var rawSensorData = new List<Records.RawSensorData>();

        // Act
        var result = ThresholdUtils.CalculateDangerLevels(sensorType, rawSensorData);

        // Assert
        Assert.Empty(result);
    }

    [Fact]
    public void CalculateDangerLevels_SingleNoiseDataPoint_ReturnsCorrectDangerLevel()
    {
        // Arrange
        var sensorType = SensorType.Noise;
        var rawSensorData = new List<Records.RawSensorData>
        {
            new Records.RawSensorData(DateTime.Now, 85, 85, 90, 85, Guid.NewGuid())
        };

        // Act
        var result = ThresholdUtils.CalculateDangerLevels(sensorType, rawSensorData).ToList();

        // Assert
        Assert.Single(result);
        var (data, dangerLevels) = result[0];
        Assert.Equal(DangerLevel.Danger, dangerLevels.dangerLevel);
        Assert.Equal(DangerLevel.Safe, dangerLevels.peakDangerLevel);
    }
}