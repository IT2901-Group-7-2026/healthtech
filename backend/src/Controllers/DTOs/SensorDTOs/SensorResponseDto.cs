namespace Backend.DTOs;

public class SensorResponseDto
{
	public required IEnumerable<SensorDataDto> Data { get; set; }
	public required HourDomainDto HourDomain { get; set; }
}
