namespace Backend.DTOs;

public class SensorOverviewResponse
{
	public required IEnumerable<CombinedSensorBucketDto> Data { get; set; }
	public required HourDomainDto HourDomain { get; set; }
}
