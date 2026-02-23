using Backend.DTOs;
using Backend.Models;
using Backend.Validation;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Abstractions;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.AspNetCore.Routing;
using Microsoft.VisualBasic;

namespace Backend.Tests.UnitTests.Validation;

/// <summary>
/// Unit tests for ValidateFieldForSensorTypeFilter to verify field validation logic.
/// </summary>
public class ValidateFieldForSensorTypeFilterTests
{
	/// <summary>
	/// Tests for scenarios where field validation should pass.
	/// </summary>
	/// <remarks>
	/// These tests ensure that valid combinations of data types and fields do not trigger validation errors.
	/// </remarks>
	public class ValidFieldTests
	{
		private readonly ValidateFieldForSensorTypeFilter _filter;

		public ValidFieldTests()
		{
			_filter = new ValidateFieldForSensorTypeFilter();
		}

		/// <summary>
		/// Verifies that validation passes when no field is provided for the noise data type.
		/// </summary>
		[Fact]
		public void OnActionExecuting_PassesValidation_WhenNoFieldForNoiseSensorType()
		{
			var context = CreateActionExecutingContext(
				SensorType.Noise,
				new SensorDataRequestDto(
					DateTimeOffset.Now,
					DateTimeOffset.Now.AddDays(1),
					TimeGranularity.Day,
					AggregationFunction.Avg,
					null
				)
			);

			_filter.OnActionExecuting(context);
			Assert.Null(context.Result);
		}

		/// <summary>
		/// Verifies that validation passes when no field is provided for the vibration data type.
		/// </summary>
		[Fact]
		public void OnActionExecuting_PassesValidation_WhenNoFieldForVibrationSensorType()
		{
			var context = CreateActionExecutingContext(
				SensorType.Vibration,
				new SensorDataRequestDto(
					DateTimeOffset.Now,
					DateTimeOffset.Now.AddDays(1),
					TimeGranularity.Day,
					AggregationFunction.Avg,
					null
				)
			);

			_filter.OnActionExecuting(context);
			Assert.Null(context.Result);
		}

		/// <summary>
		/// Verifies that validation passes when a valid field is provided for the dust data type.
		/// </summary>
		[Fact]
		public void OnActionExecuting_PassesValidation_WhenValidFieldForDustSensorType()
		{
			var context = CreateActionExecutingContext(
				SensorType.Dust,
				new SensorDataRequestDto(
					DateTimeOffset.Now,
					DateTimeOffset.Now.AddDays(1),
					TimeGranularity.Day,
					AggregationFunction.Avg,
					Field.Pm10_stel
				)
			);

			_filter.OnActionExecuting(context);
			Assert.Null(context.Result);
		}
	}

	/// <summary>
	/// Tests for scenarios where field validation should fail.
	/// </summary>
	/// <remarks>
	/// These tests ensure that invalid combinations of data types and fields correctly trigger validation errors.
	/// </remarks>
	public class InvalidFieldTests
	{
		private readonly ValidateFieldForSensorTypeFilter _filter;

		public InvalidFieldTests()
		{
			_filter = new ValidateFieldForSensorTypeFilter();
		}

		/// <summary>
		/// Verifies that validation fails when a field is provided for the noise data type.
		/// </summary>
		[Fact]
		public void OnActionExecuting_ReturnsBadRequest_WhenFieldProvidedForNoiseSensorType()
		{
			var context = CreateActionExecutingContext(
				SensorType.Noise,
				new SensorDataRequestDto(
					DateTimeOffset.Now,
					DateTimeOffset.Now.AddDays(1),
					TimeGranularity.Day,
					AggregationFunction.Avg,
					Field.Pm10_stel
				)
			);

			_filter.OnActionExecuting(context);
			var badRequestResult = context.Result as BadRequestObjectResult;
			Assert.IsType<BadRequestObjectResult>(badRequestResult);
			Assert.Equal(
				"Field must not be specified for Noise.",
				GetErrorMessage(badRequestResult)
			);
		}

		/// <summary>
		/// Verifies that validation fails when no field is provided for the dust data type.
		/// </summary>
		[Fact]
		public void OnActionExecuting_ReturnsBadRequest_WhenNoFieldForDustSensorType()
		{
			var context = CreateActionExecutingContext(
				SensorType.Dust,
				new SensorDataRequestDto(
					DateTimeOffset.Now,
					DateTimeOffset.Now.AddDays(1),
					TimeGranularity.Day,
					AggregationFunction.Avg,
					null
				)
			);

			_filter.OnActionExecuting(context);
			var badRequestResult = context.Result as BadRequestObjectResult;
			Assert.IsType<BadRequestObjectResult>(badRequestResult);
			Assert.Equal("Field is required for Dust.", GetErrorMessage(badRequestResult));
		}

		/// <summary>
		/// Verifies that validation fails when a field is provided for the vibration data type.
		/// </summary>
		[Fact]
		public void OnActionExecuting_ReturnsBadRequest_WhenFieldProvidedForVibrationSensorType()
		{
			var context = CreateActionExecutingContext(
				SensorType.Vibration,
				new SensorDataRequestDto(
					DateTimeOffset.Now,
					DateTimeOffset.Now.AddDays(1),
					TimeGranularity.Day,
					AggregationFunction.Avg,
					Field.Pm10_stel
				)
			);

			_filter.OnActionExecuting(context);
			var badRequestResult = context.Result as BadRequestObjectResult;
			Assert.IsType<BadRequestObjectResult>(badRequestResult);
			Assert.Equal(
				"Field must not be specified for Vibration.",
				GetErrorMessage(badRequestResult)
			);
		}

		/// <summary>
		/// Verifies that validation fails when an invalid field is provided for the dust data type.
		/// </summary>
		[Fact]
		public void OnActionExecuting_ReturnsBadRequest_WhenInvalidFieldForDustSensorType()
		{
			var context = CreateActionExecutingContext(
				SensorType.Dust,
				new SensorDataRequestDto(
					DateTimeOffset.Now,
					DateTimeOffset.Now.AddDays(1),
					TimeGranularity.Day,
					AggregationFunction.Avg,
					(Field)999
				)
			);

			_filter.OnActionExecuting(context);
			var badRequestResult = context.Result as BadRequestObjectResult;
			Assert.IsType<BadRequestObjectResult>(badRequestResult);
			Assert.Equal(
				$"Field '999' is not valid for {SensorType.Dust}. Valid fields: Pm1_stel, Pm25_stel, Pm4_stel, Pm10_stel",
				GetErrorMessage(badRequestResult)
			);
		}
	}

	/// <summary>
	/// Helper method to create ActionExecutingContext for testing.
	/// </summary>
	/// <param name="sensorType">The SensorType to set in route values.</param>
	/// <param name="dto">The SensorDataRequestDto to include in action arguments.</param>
	/// <returns>A configured ActionExecutingContext instance.</returns>
	/// <remarks>
	/// This method sets up the necessary context to simulate an action execution environment,
	/// including route data and action arguments, for testing the ValidateFieldForSensorTypeFilter.
	/// </remarks>
	private static ActionExecutingContext CreateActionExecutingContext(
		SensorType sensorType,
		SensorDataRequestDto dto
	)
	{
		var actionContext = new ActionContext(
			new DefaultHttpContext(),
			new RouteData(),
			new ActionDescriptor()
		);

		// Set the sensorType in route
		actionContext.RouteData.Values["sensorType"] = sensorType.ToString();

		// Set the dto in action arguments
		var actionExecutingContext = new ActionExecutingContext(
			actionContext,
			[],
			new Dictionary<string, object?> { { "request", dto } },
			controller: null!
		);

		return actionExecutingContext;
	}

	/// <summary>
	/// Helper method to extract error message from BadRequestObjectResult.
	/// </summary>
	/// <param name="result">The BadRequestObjectResult containing the error message.</param>
	/// <returns>The extracted error message string.</returns>
	private static String GetErrorMessage(BadRequestObjectResult result)
	{
		var errorObject =
			result.Value ?? throw new InvalidOperationException("Result value is null");
		var errorProperty = errorObject.GetType().GetProperty("error");
		var errorMessage = errorProperty?.GetValue(errorObject)?.ToString();
		return errorMessage ?? throw new InvalidOperationException("Error message is null");
	}
}
