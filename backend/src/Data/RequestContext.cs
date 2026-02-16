using Backend.DTOs;
using Backend.Models;

namespace Backend.Data;

public class RequestContext
{
	public SensorDataRequestDto Request { get; set; }
	public Guid? UserId { get; set; }
	public SensorType SensorType { get; set; }

	public RequestContext(SensorDataRequestDto request, Guid userId, SensorType sensorType)
	{
		Request = request;
		UserId = userId;
		SensorType = sensorType;
	}
}
