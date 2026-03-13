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

		try
		{
			var response = await _sensorDataService.GetAggregatedDataAsync(
				request,
				userId,
				sensorType
			);
			return Ok(response);
		}
		catch (ArgumentException ex)
		{
			return BadRequest($"The request is invalid: {ex.Message}");
		}
		catch (InvalidOperationException ex)
		{
			return NotFound($"The requested resource was not found: {ex.Message}");
		}
		catch (Exception)
		{
			return StatusCode(500, "Internal server error");
		}
	}
}
