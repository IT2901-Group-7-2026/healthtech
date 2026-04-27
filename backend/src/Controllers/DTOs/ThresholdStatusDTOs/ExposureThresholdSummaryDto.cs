namespace Backend.DTOs;

public record ExposureThresholdSummaryDto
{
	public int Safe { get; set; } = 0;
	public int Warning { get; set; } = 0;
	public int Danger { get; set; } = 0;
}
