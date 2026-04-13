using Backend.Data;
using Backend.DTOs;
using Backend.Models;
using Backend.Services;
using Backend.Utils;
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
	public async Task<ActionResult<SensorResponseDto>> GetAggregatedData(
		[FromBody] SensorDataRequestDto request,
		[FromRoute] Guid? userId,
		[FromRoute] SensorType sensorType
	)
	{
		if (request.StartTime >= request.EndTime)
		{
			return BadRequest("StartTime must be earlier than EndTime.");
		}

		try
		{
			IEnumerable<SensorDataDto> data = await _sensorDataService.GetAggregatedDataAsync(
				request,
				userId,
				sensorType
			);

			HourDomainDto hourDomain = await _sensorDataService.GetHourDomainForWeekAsync(
				new Dictionary<SensorType, SensorDataRequestDto> { { sensorType, request } },
				userId
			);

			SensorResponseDto response = new() { Data = data, HourDomain = hourDomain };

			return response;
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

	[HttpPost("overview/{userId}")]
	public async Task<ActionResult<IEnumerable<CombinedSensorBucketDto>>> GetOverviewData(
		[FromBody] Dictionary<SensorType, SensorDataRequestDto> requests,
		[FromRoute] Guid? userId
	)
	{
		IEnumerable<CombinedSensorBucketDto> data = await _sensorDataService.GetOverviewDataAsync(
			requests,
			userId
		);

		HourDomainDto hourDomain = await _sensorDataService.GetHourDomainForWeekAsync(
			requests,
			userId
		);

		SensorOverviewResponse response = new() { Data = data, HourDomain = hourDomain };

		return Ok(response);
	}
}
