namespace Backend.DTOs;

public class ExposureResponseDto
{
	public required IEnumerable<ExposureDataDto> Data { get; set; }
	public required HourDomainDto HourDomain { get; set; }
}
