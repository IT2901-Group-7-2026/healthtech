using Backend.Models;

namespace Backend.DTOs;

public class SensorDataDto
{
	public DateTime Time { get; set; }
	public double Value { get; set; }
	public DangerLevel DangerLevel { get; set; }
}
