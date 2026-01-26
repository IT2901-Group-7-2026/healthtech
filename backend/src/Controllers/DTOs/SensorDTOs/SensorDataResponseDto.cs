using System.ComponentModel.DataAnnotations;

namespace Backend.DTOs;

public class SensorDataResponseDto
{
    public DateTime Time { get; set; }
    public double Value { get; set; }
}