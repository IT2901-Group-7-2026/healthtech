using Backend.Data;
using Backend.DTOs;
using Backend.Models;
using Backend.Services;
using Backend.Validation;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Controllers;

[ApiController]
[Route("api/sensor")]
public class SensorDataController(ISensorDataService sensorDataService) : ControllerBase
{
	private readonly ISensorDataService _sensorDataService = sensorDataService;

	[HttpPost("{sensorType}/{userId}")]
	[ServiceFilter(typeof(ValidateFieldForSensorTypeFilter))]
	public async Task<ActionResult<IEnumerable<SensorDataDto>>> GetAggregatedData(
		[FromBody] SensorDataRequestDto request,
		[FromRoute] Guid userId,
		[FromRoute] SensorType sensorType
	)
	{
		if (request.StartTime >= request.EndTime)
		{
			return BadRequest("StartTime must be earlier than EndTime.");
		}

		var requestContext = new RequestContext(request, userId, sensorType);
		var response = await _sensorDataService.GetAggregatedDataAsync(requestContext);
		return Ok(response);
	}
}
