namespace Backend.DTOs;

public class ExposureOverviewResponse
{
	public required IEnumerable<CombinedExposureBucketDto> Data { get; set; }
	public required HourDomainDto HourDomain { get; set; }
}
