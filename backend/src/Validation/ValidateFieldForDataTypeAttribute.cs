using Backend.DTOs;
using Backend.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;

namespace Backend.Validation;

public class ValidateFieldForDataTypeFilter : IActionFilter
{
    public void OnActionExecuting(ActionExecutingContext context)
    {
        // Get DataType from route
        if (!context.RouteData.Values.TryGetValue("dataType", out var dataTypeObj) 
            || !Enum.TryParse<DataType>(dataTypeObj?.ToString(), true, out var dataType))
        {
            context.Result = new BadRequestObjectResult(
                new { error = "Invalid or missing dataType." });
            return;
        }

        // Get the DTO from action arguments
        var dto = context.ActionArguments.Values.OfType<SensorDataRequestDto>().FirstOrDefault();
        if (dto == null)
        {
            return;
        }

        // Validate
        var validFields = GetValidFields(dataType);
        
        if (validFields.Count == 0 && dto.Field != null)
        {
            context.Result = new BadRequestObjectResult(
                new { error = $"Field must not be specified for {dataType}." });
            return;
        }

        if (validFields.Count > 0)
        {
            if (dto.Field == null)
            {
                context.Result = new BadRequestObjectResult(
                    new { error = $"Field is required for {dataType}." });
                return;
            }

            if (!validFields.Contains(dto.Field.Value))
            {
                context.Result = new BadRequestObjectResult(
                    new { error = $"Field '{dto.Field}' is not valid for {dataType}. Valid fields: {string.Join(", ", validFields)}" });
                return;
            }
        }
    }

    public void OnActionExecuted(ActionExecutedContext context) { }

    private static HashSet<Field> GetValidFields(DataType dataType)
    {
        return [.. Enum.GetValues<Field>()
            .Where(f => typeof(Field)
                .GetField(f.ToString())?
                .GetCustomAttributes(typeof(DataTypeFieldAttribute), false)
                .Cast<DataTypeFieldAttribute>()
                .Any(attr => attr.DataType == dataType) == true)];
    }
}