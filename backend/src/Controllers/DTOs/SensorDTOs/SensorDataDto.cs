using Backend.Models;

namespace Backend.DTOs;

public class SensorDataDto
{
	public DateTime Time { get; set; }
	public double Value { get; set; }
	public DangerLevel DangerLevel { get; set; }

	/// <summary>
	/// Only used for noise data, as lcpk has a separate max-value threshold
	/// </summary>
	public DangerLevel? PeakDangerLevel { get; set; } = null;
}
