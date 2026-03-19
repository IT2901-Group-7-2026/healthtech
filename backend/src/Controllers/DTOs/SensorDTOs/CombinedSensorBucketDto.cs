using Backend.Models;

namespace Backend.DTOs;

public class CombinedSensorBucketDto
{
	public DateTime Time { get; set; }
	public DangerLevel DangerLevel { get; set; }
	public Dictionary<SensorType, DangerLevel> SensorDangerLevels { get; set; } = new();
}
