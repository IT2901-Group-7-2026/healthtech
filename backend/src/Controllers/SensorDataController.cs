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

		var response = await _sensorDataService.GetAggregatedDataAsync(request, userId, sensorType);
		return Ok(response);
	}

	[HttpPost("overview/{userId}")]
	public async Task<ActionResult<IEnumerable<CombinedSensorBucketDto>>> GetOverviewData(
		[FromBody] Dictionary<SensorType, SensorDataRequestDto> requests,
		[FromRoute] Guid userId
	)
	{
		var response = await _sensorDataService.GetOverviewDataAsync(requests, userId);
		return Ok(response);
	}
}
