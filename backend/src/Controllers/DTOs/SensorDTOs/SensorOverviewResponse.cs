namespace Backend.DTOs;

public class SensorOverviewResponse
{
	public IEnumerable<CombinedSensorBucketDto> Data { get; set; }
	public HourDomainDto HourDomain { get; set; }
}
