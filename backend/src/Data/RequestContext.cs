using Backend.DTOs;
using Backend.Models;

namespace Backend.Data;

public class RequestContext
{
	public SensorDataRequestDto Request { get; set; }
	public Guid? UserId { get; set; }
	public DataType DataType { get; set; }

	public RequestContext(SensorDataRequestDto request, Guid userId, DataType dataType)
	{
		Request = request;
		UserId = userId;
		DataType = dataType;
	}
}
