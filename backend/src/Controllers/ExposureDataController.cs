using Backend.Data;
using Backend.DTOs;
using Backend.Models;
using Backend.Services;
using Backend.Utils;
using Backend.Validation;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Controllers;

[ApiController]
[Route("api/exposure")]
public class ExposureDataController(IExposureDataService exposureDataService) : ControllerBase
{
	private readonly IExposureDataService _exposureDataService = exposureDataService;

	[HttpPost("{exposureType}/{userId}")]
	[ServiceFilter(typeof(ValidateFieldForExposureTypeFilter))]
	public async Task<ActionResult<ExposureResponseDto>> GetAggregatedData(
		[FromBody] ExposureDataRequestDto request,
		[FromRoute] Guid? userId,
		[FromRoute] ExposureType exposureType
	)
	{
		if (request.StartTime >= request.EndTime)
		{
			return BadRequest("StartTime must be earlier than EndTime.");
		}

		try
		{
			IEnumerable<ExposureDataDto> data = await _exposureDataService.GetAggregatedDataAsync(
				request,
				userId,
				exposureType
			);

			HourDomainDto hourDomain = await _exposureDataService.GetHourDomainForWeekAsync(
				new Dictionary<ExposureType, ExposureDataRequestDto> { { exposureType, request } },
				userId
			);

			ExposureResponseDto response = new() { Data = data, HourDomain = hourDomain };

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

	[HttpPost("overview/{userId}")]
	public async Task<ActionResult<IEnumerable<CombinedExposureBucketDto>>> GetOverviewData(
		[FromBody] Dictionary<ExposureType, ExposureDataRequestDto> requests,
		[FromRoute] Guid? userId
	)
	{
		IEnumerable<CombinedExposureBucketDto> data =
			await _exposureDataService.GetOverviewDataAsync(requests, userId);

		HourDomainDto hourDomain = await _exposureDataService.GetHourDomainForWeekAsync(
			requests,
			userId
		);

		ExposureOverviewResponse response = new() { Data = data, HourDomain = hourDomain };

		return Ok(response);
	}
}
