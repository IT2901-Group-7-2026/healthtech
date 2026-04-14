namespace Backend.DTOs;

public class SensorResponseDto
{
	public IEnumerable<SensorDataDto> Data { get; set; }
	public HourDomainDto HourDomain { get; set; }
}
