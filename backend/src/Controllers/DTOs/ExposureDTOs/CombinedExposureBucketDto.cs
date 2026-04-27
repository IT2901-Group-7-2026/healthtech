using Backend.Models;

namespace Backend.DTOs;

public class CombinedExposureBucketDto
{
	public DateTime Time { get; set; }
	public DangerLevel DangerLevel { get; set; }
	public Dictionary<ExposureType, DangerLevel> ExposureDangerLevels { get; set; } = new();
}
