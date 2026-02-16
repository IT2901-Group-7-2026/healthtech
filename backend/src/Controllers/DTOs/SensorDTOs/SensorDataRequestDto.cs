using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;
using SensorType = Backend.Models.SensorType;

namespace Backend.DTOs;

public enum TimeGranularity
{
	Minute,
	Hour,
	Day,
}

public enum AggregationFunction
{
	Avg,
	Sum,
	Min,
	Max,
	Count,
}

public enum Field
{
	[SensorTypeField(SensorType.Dust)]
	Pm1_stel,

	[SensorTypeField(SensorType.Dust)]
	Pm25_stel,

	[SensorTypeField(SensorType.Dust)]
	Pm4_stel,

	[SensorTypeField(SensorType.Dust)]
	Pm10_stel,
}

public class SensorTypeFieldAttribute(SensorType sensorType) : Attribute
{
	public SensorType SensorType { get; } = sensorType;
}

public record SensorDataRequestDto(
	[Required] DateTimeOffset StartTime,
	[Required] DateTimeOffset EndTime,
	[Required] TimeGranularity Granularity,
	[Required] AggregationFunction Function,
	Field? Field
);
