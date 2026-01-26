using Backend.DTOs;
using Backend.Services;
using Microsoft.AspNetCore.Mvc;
using Moq;
using Backend.Controllers;
using Backend.Models;
using Backend.Data;

namespace Backend.Tests.UnitTests.Controllers;


/// <summary>
/// Unit tests for SensorDataController to verify handling of various data retrieval scenarios.
/// </summary>
public class SensorDataControllerTests
{

    /// <summary>
    /// Nested test class verifies that GetAggregatedData returns an empty list when no sensor data (noise, dust, vibration) is available.
    /// </summary>
    /// <remarks>
    /// These tests ensure that the controller properly handles empty datasets from the service layer
    /// and returns an appropriate HTTP 200 response with an empty collection for noise, dust and vibration data.
    /// </remarks>
    public class GetEmptyAggregatedDataListTests
    {
        private readonly Mock<ISensorDataService> _mockService;
        private readonly SensorDataController _controller;

        public GetEmptyAggregatedDataListTests()
        {
            _mockService = new Mock<ISensorDataService>();
            _controller = new SensorDataController(_mockService.Object);
            _mockService.Setup(service => service.GetAggregatedDataAsync(It.IsAny<RequestContext>()))
                        .ReturnsAsync(new List<SensorDataResponseDto>());
        }


        /// <summary>
        /// Verifies that GetAggregatedData returns an empty list when there is no noise data available.
        /// </summary>
        [Fact]
        public async Task GetAggregatedData_ReturnsEmptyList_WhenNoNoiseData()
        {
            var noiseRequest = new SensorDataRequestDto(
                DateTimeOffset.Parse("2025-02-12T10:12:31+00:00"),
                DateTimeOffset.Parse("2025-02-25T16:14:10+00:00"),
                (TimeGranularity)2,
                (AggregationFunction)0,
                null
            );
            var noiseResult = await _controller.GetAggregatedData(noiseRequest, Guid.NewGuid(), DataType.Noise);
            var okNoiseResult = noiseResult.Result as OkObjectResult;
            Assert.IsType<OkObjectResult>(okNoiseResult);
            var noiseData = okNoiseResult.Value as IEnumerable<SensorDataResponseDto>;
            Assert.NotNull(noiseData);
            Assert.Empty(noiseData);
        }


        /// <summary>
        /// Verifies that GetAggregatedData returns an empty list when there is no dust data available.
        /// </summary>
        [Fact]
        public async Task GetAggregatedData_ReturnsEmptyList_WhenNoDustData()
        {
            var dustRequest = new SensorDataRequestDto(
                DateTimeOffset.Parse("2025-02-12T10:12:31+00:00"),
                DateTimeOffset.Parse("2025-02-25T16:14:10+00:00"),
                (TimeGranularity)2,
                (AggregationFunction)0,
                Field.Pm10_stel
            );

            var dustResult = await _controller.GetAggregatedData(dustRequest, Guid.NewGuid(), DataType.Dust);
            var okDustResult = dustResult.Result as OkObjectResult;
            Assert.IsType<OkObjectResult>(okDustResult);
            var dustData = okDustResult.Value as IEnumerable<SensorDataResponseDto>;
            Assert.NotNull(dustData);
            Assert.Empty(dustData);
        }


        /// <summary>
        /// Verifies that GetAggregatedData returns an empty list when there is no vibration data available.
        /// </summary>
        [Fact]
        public async Task GetAggregatedData_ReturnsEmptyList_WhenNoVibrationData()
        {
            var vibrationRequest = new SensorDataRequestDto(
                DateTimeOffset.Parse("2025-02-12T10:12:31+00:00"),
                DateTimeOffset.Parse("2025-02-25T16:14:10+00:00"),
                (TimeGranularity)2,
                (AggregationFunction)0,
                null
            );
            var vibrationResult = await _controller.GetAggregatedData(vibrationRequest, Guid.NewGuid(), DataType.Vibration);
            var okVibrationResult = vibrationResult.Result as OkObjectResult;
            Assert.IsType<OkObjectResult>(okVibrationResult);
            var vibrationData = okVibrationResult.Value as IEnumerable<SensorDataResponseDto>;
            Assert.NotNull(vibrationData);
            Assert.Empty(vibrationData);
        }


    }

    /// <summary>
    /// Verifies that GetAggregatedData returns a list of sensor data (noise, dust, vibration) when data is available.
    /// </summary>
    /// <remarks>
    /// These tests ensure that the controller properly handles datasets from the service layer
    /// and returns an appropriate HTTP 200 response with the expected collection of sensor data for noise, dust and vibration.
    /// </remarks>
    public class GetAggregatedDataListTests
    {
        private readonly Mock<ISensorDataService> _mockService;
        private readonly SensorDataController _controller;

        public GetAggregatedDataListTests()
        {
            _mockService = new Mock<ISensorDataService>();
            _controller = new SensorDataController(_mockService.Object);
        }


        /// <summary>
        /// Verifies that GetAggregatedData returns a list of noise data when noise data is available.
        /// </summary>
        [Fact]
        public async Task GetAggregatedData_ReturnsDataList_WhenNoiseDataExists()
        {
            _mockService.Setup(service => service.GetAggregatedDataAsync(It.IsAny<RequestContext>()))
                    .ReturnsAsync(new List<SensorDataResponseDto>
                    {
                        new SensorDataResponseDto { Time = DateTime.Parse("2025-02-12T10:12:31+00:00"), Value = 42.0 },
                        new SensorDataResponseDto { Time = DateTime.Parse("2025-02-13T11:15:45+00:00"), Value = 36.5 }
                    });

            var request = new SensorDataRequestDto(
                DateTimeOffset.Parse("2025-02-12T10:12:31+00:00"),
                DateTimeOffset.Parse("2025-02-25T16:14:10+00:00"),
                (TimeGranularity)2,
                (AggregationFunction)0,
                null
            );
            var result = await _controller.GetAggregatedData(request, Guid.NewGuid(), DataType.Noise);
            var okResult = result.Result as OkObjectResult;
            Assert.IsType<OkObjectResult>(okResult);

            var data = okResult.Value as IEnumerable<SensorDataResponseDto>;
            Assert.NotNull(data);
            Assert.Equal(2, data.Count());
        }


        /// <summary>
        /// Verifies that GetAggregatedData returns a list of dust data when dust data is available.
        /// </summary>
        [Fact]
        public async Task GetAggregatedData_ReturnsDataList_WhenDustDataExists()
        {
            _mockService.Setup(service => service.GetAggregatedDataAsync(It.IsAny<RequestContext>()))
                    .ReturnsAsync(new List<SensorDataResponseDto>
                    {
                        new SensorDataResponseDto { Time = DateTime.Parse("2025-02-12T10:12:31+00:00"), Value = 15.0 },
                        new SensorDataResponseDto { Time = DateTime.Parse("2025-02-13T11:15:45+00:00"), Value = 20.5 }
                    });

            var request = new SensorDataRequestDto(
                DateTimeOffset.Parse("2025-02-12T10:12:31+00:00"),
                DateTimeOffset.Parse("2025-02-25T16:14:10+00:00"),
                (TimeGranularity)2,
                (AggregationFunction)0,
                Field.Pm10_stel
            );
            var result = await _controller.GetAggregatedData(request, Guid.NewGuid(), DataType.Dust);
            var okResult = result.Result as OkObjectResult;
            Assert.IsType<OkObjectResult>(okResult);

            var data = okResult.Value as IEnumerable<SensorDataResponseDto>;
            Assert.NotNull(data);
            Assert.Equal(2, data.Count());
        }


        /// <summary>
        /// Verifies that GetAggregatedData returns a list of vibration data when vibration data is available.
        /// </summary>
        [Fact]
        public async Task GetAggregatedData_ReturnsDataList_WhenVibrationDataExists()
        {
            _mockService.Setup(service => service.GetAggregatedDataAsync(It.IsAny<RequestContext>()))
                    .ReturnsAsync(new List<SensorDataResponseDto>
                    {
                        new SensorDataResponseDto { Time = DateTime.Parse("2025-02-12T10:12:31+00:00"), Value = 5.0 },
                        new SensorDataResponseDto { Time = DateTime.Parse("2025-02-13T11:15:45+00:00"), Value = 7.5 }
                    });

            var request = new SensorDataRequestDto(
                DateTimeOffset.Parse("2025-02-12T10:12:31+00:00"),
                DateTimeOffset.Parse("2025-02-25T16:14:10+00:00"),
                (TimeGranularity)2,
                (AggregationFunction)0,
                null
            );
            var result = await _controller.GetAggregatedData(request, Guid.NewGuid(), DataType.Vibration);
            var okResult = result.Result as OkObjectResult;
            Assert.IsType<OkObjectResult>(okResult);

            var data = okResult.Value as IEnumerable<SensorDataResponseDto>;
            Assert.NotNull(data);
            Assert.Equal(2, data.Count());
        }

    }


    /// <summary>
    /// Nested test class for testing different invalid request scenarios. The datatype used is Noise.
    /// </summary>
    /// <remarks>
    /// These tests ensure that the controller properly handles invalid requests and exceptions from the service layer,
    /// returning appropriate HTTP error responses such as BadRequest, NotFound, and InternalServerError
    /// for noise data requests.
    /// </remarks>
    public class InvalidRequestTests
    {
        private readonly Mock<ISensorDataService> _mockService;
        private readonly SensorDataController _controller;

        public InvalidRequestTests()
        {
            _mockService = new Mock<ISensorDataService>();
            _controller = new SensorDataController(_mockService.Object);
        }


        /// <summary>
        /// Verifies that GetAggregatedData returns BadRequest when the start date is after the end date.
        /// </summary>
        [Fact]
        public async Task GetAggregatedData_ReturnsBadRequest_WhenStartTimeIsAfterEndTime()
        {
            var request = new SensorDataRequestDto(
                DateTimeOffset.Parse("2025-02-25T16:14:10+00:00"),
                DateTimeOffset.Parse("2025-02-12T10:12:31+00:00"),
                (TimeGranularity)2,
                (AggregationFunction)0,
                null
            );

            var result = await _controller.GetAggregatedData(request, Guid.NewGuid(), DataType.Noise);
            var badRequestResult = result.Result as BadRequestObjectResult;

            Assert.IsType<BadRequestObjectResult>(badRequestResult);
            Assert.Equal(400, badRequestResult.StatusCode);
            Assert.Equal("StartTime must be earlier than EndTime.", badRequestResult.Value);
        }


        /// <summary>
        /// Verifies that GetAggregatedData returns BadRequest when the service throws an ArgumentException.
        /// </summary>
        [Fact]
        public async Task GetAggregatedData_ReturnsBadRequest_WhenServiceThrowsArgumentException()
        {
            _mockService.Setup(service => service.GetAggregatedDataAsync(It.IsAny<RequestContext>()))
                        .ThrowsAsync(new ArgumentException("Invalid argument"));

            var request = new SensorDataRequestDto(
                DateTimeOffset.Parse("2025-02-12T10:12:31+00:00"),
                DateTimeOffset.Parse("2025-02-25T16:14:10+00:00"),
                (TimeGranularity)2,
                (AggregationFunction)0,
                null
            );

            var result = await _controller.GetAggregatedData(request, Guid.NewGuid(), DataType.Noise);
            var badRequestResult = result.Result as BadRequestObjectResult;

            Assert.IsType<BadRequestObjectResult>(badRequestResult);
            Assert.Equal(400, badRequestResult.StatusCode);
            Assert.Equal("The request is invalid: Invalid argument", badRequestResult.Value);
        }


        /// <summary>
        /// Verifies that GetAggregatedData returns NotFound when the service throws an InvalidOperationException.
        /// </summary>
        [Fact]
        public async Task GetAggregatedData_ReturnsNotFound_WhenServiceThrowsInvalidOperationException()
        {
            _mockService.Setup(service => service.GetAggregatedDataAsync(It.IsAny<RequestContext>()))
                        .ThrowsAsync(new InvalidOperationException("Resource not found"));

            var request = new SensorDataRequestDto(
                DateTimeOffset.Parse("2025-02-12T10:12:31+00:00"),
                DateTimeOffset.Parse("2025-02-25T16:14:10+00:00"),
                (TimeGranularity)2,
                (AggregationFunction)0,
                null
            );

            var result = await _controller.GetAggregatedData(request, Guid.NewGuid(), DataType.Noise);
            var notFoundResult = result.Result as NotFoundObjectResult;

            Assert.IsType<NotFoundObjectResult>(notFoundResult);
            Assert.Equal(404, notFoundResult.StatusCode);
            Assert.Equal("The requested resource was not found: Resource not found", notFoundResult.Value);
        }


        /// <summary>
        /// Verifies that GetAggregatedData returns InternalServerError when the service throws a general exception.
        /// </summary>
        [Fact]
        public async Task GetAggregatedData_ReturnsInternalServerError_WhenServiceThrowsException()
        {
            _mockService.Setup(service => service.GetAggregatedDataAsync(It.IsAny<RequestContext>()))
                        .ThrowsAsync(new Exception("Unexpected error"));

            var request = new SensorDataRequestDto(
                DateTimeOffset.Parse("2025-02-12T10:12:31+00:00"),
                DateTimeOffset.Parse("2025-02-25T16:14:10+00:00"),
                (TimeGranularity)2,
                (AggregationFunction)0,
                null
            );

            var result = await _controller.GetAggregatedData(request, Guid.NewGuid(), DataType.Noise);
            var internalErrorResult = result.Result as ObjectResult;

            Assert.IsType<ObjectResult>(internalErrorResult);
            Assert.Equal(500, internalErrorResult.StatusCode);
            Assert.Equal("Internal server error", internalErrorResult.Value);
        }
    }
}