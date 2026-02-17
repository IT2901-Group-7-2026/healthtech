using Backend.DTOs;
using Backend.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;

namespace Backend.Validation;

public class ValidateFieldForSensorTypeFilter : IActionFilter
{
	public void OnActionExecuting(ActionExecutingContext context)
	{
		// Get SensorType from route
		if (
			!context.RouteData.Values.TryGetValue("sensorType", out var sensorTypeObj)
			|| !Enum.TryParse<SensorType>(sensorTypeObj?.ToString(), true, out var sensorType)
		)
		{
			context.Result = new BadRequestObjectResult(
				new { error = "Invalid or missing sensorType." }
			);
			return;
		}

		// Get the DTO from action arguments
		var dto = context.ActionArguments.Values.OfType<SensorDataRequestDto>().FirstOrDefault();
		if (dto == null)
		{
			return;
		}

		// Validate
		var validFields = GetValidFields(sensorType);

		if (validFields.Count == 0 && dto.Field != null)
		{
			context.Result = new BadRequestObjectResult(
				new { error = $"Field must not be specified for {sensorType}." }
			);
			return;
		}

		if (validFields.Count > 0)
		{
			if (dto.Field == null)
			{
				context.Result = new BadRequestObjectResult(
					new { error = $"Field is required for {sensorType}." }
				);
				return;
			}

			if (!validFields.Contains(dto.Field.Value))
			{
				context.Result = new BadRequestObjectResult(
					new
					{
						error = $"Field '{dto.Field}' is not valid for {sensorType}. Valid fields: {string.Join(", ", validFields)}",
					}
				);
				return;
			}
		}
	}

	public void OnActionExecuted(ActionExecutedContext context) { }

	private static HashSet<Field> GetValidFields(SensorType sensorType)
	{
		return
		[
			.. Enum.GetValues<Field>()
				.Where(f =>
					typeof(Field)
						.GetField(f.ToString())
						?.GetCustomAttributes(typeof(SensorTypeFieldAttribute), false)
						.Cast<SensorTypeFieldAttribute>()
						.Any(attr => attr.SensorType == sensorType) == true
				),
		];
	}
}
