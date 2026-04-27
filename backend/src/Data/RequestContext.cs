using Backend.DTOs;
using Backend.Models;

namespace Backend.Data;

public class RequestContext
{
	public ExposureDataRequestDto Request { get; set; }
	public Guid? UserId { get; set; }
	public ExposureType ExposureType { get; set; }

	public RequestContext(ExposureDataRequestDto request, Guid userId, ExposureType exposureType)
	{
		Request = request;
		UserId = userId;
		ExposureType = exposureType;
	}
}
