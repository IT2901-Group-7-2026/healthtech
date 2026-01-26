using Microsoft.AspNetCore.Mvc;
using Backend.Services;
using Backend.DTOs;
using Backend.Models;
using Backend.Validation;
using Backend.Data;

namespace Backend.Controllers;

[ApiController]
[Route("api/sensor")]
public class SensorDataController(ISensorDataService sensorDataService) : ControllerBase
{
    private readonly ISensorDataService _sensorDataService = sensorDataService;

    [HttpGet("noisedata/all")]
    public async Task<ActionResult<IEnumerable<SensorDataResponseDto>>> GetAllNoiseData()
    {
        var noiseData = await _sensorDataService.GetAllNoiseDataAsync();
        var response = noiseData.Select(nd => new SensorDataResponseDto
        {
            Time = nd.Time,
            Value = nd.LavgQ3
        });
        return Ok(response);
    }

    [HttpPost("{dataType}/{userId}")]
    [ServiceFilter(typeof(ValidateFieldForDataTypeFilter))]
    public async Task<ActionResult<IEnumerable<SensorDataResponseDto>>> GetAggregatedData(
        [FromBody] SensorDataRequestDto request,
        [FromRoute] Guid userId,
        [FromRoute] DataType dataType)
    {
        if (request.StartTime >= request.EndTime)
        {
            return BadRequest("StartTime must be earlier than EndTime.");
        }
        try
        {
            var requestContext = new RequestContext();
            requestContext.Initialize(request, userId, dataType);
            var response = await _sensorDataService.GetAggregatedDataAsync(requestContext);
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
            return StatusCode(500, $"Internal server error");
        }
    }
}