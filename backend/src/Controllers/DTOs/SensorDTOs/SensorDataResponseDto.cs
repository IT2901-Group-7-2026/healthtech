using Backend.Models;

namespace Backend.DTOs;

public class SensorDataResponseDto
{
    public DateTime Time { get; set; }
    public double Value { get; set; }
    public DangerLevel DangerLevel { get; set; }
}
