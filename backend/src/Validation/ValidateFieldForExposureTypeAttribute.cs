using Backend.DTOs;
using Backend.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;

namespace Backend.Validation;

public class ValidateFieldForExposureTypeFilter : IActionFilter
{
	public void OnActionExecuting(ActionExecutingContext context)
	{
		// Get ExposureType from route
		if (
			!context.RouteData.Values.TryGetValue("exposureType", out var exposureTypeObj)
			|| !Enum.TryParse<ExposureType>(exposureTypeObj?.ToString(), true, out var exposureType)
		)
		{
			context.Result = new BadRequestObjectResult(
				new { error = "Invalid or missing exposureType." }
			);
			return;
		}

		// Get the DTO from action arguments
		var dto = context.ActionArguments.Values.OfType<ExposureDataRequestDto>().FirstOrDefault();
		if (dto == null)
		{
			return;
		}

		// Validate
		var validFields = GetValidFields(exposureType);

		if (validFields.Count == 0 && dto.Field != null)
		{
			context.Result = new BadRequestObjectResult(
				new { error = $"Field must not be specified for {exposureType}." }
			);
			return;
		}

		if (validFields.Count > 0)
		{
			if (dto.Field == null)
			{
				context.Result = new BadRequestObjectResult(
					new { error = $"Field is required for {exposureType}." }
				);
				return;
			}

			if (!validFields.Contains(dto.Field.Value))
			{
				context.Result = new BadRequestObjectResult(
					new { error = $"Field '{dto.Field}' is not valid for {exposureType}." }
				);
				return;
			}
		}
	}

	public void OnActionExecuted(ActionExecutedContext context) { }

	private static HashSet<Field> GetValidFields(ExposureType exposureType)
	{
		return
		[
			.. Enum.GetValues<Field>()
				.Where(f =>
					typeof(Field)
						.GetField(f.ToString())
						?.GetCustomAttributes(typeof(ExposureTypeFieldAttribute), false)
						.Cast<ExposureTypeFieldAttribute>()
						.Any(attr => attr.ExposureType == exposureType) == true
				),
		];
	}
}
