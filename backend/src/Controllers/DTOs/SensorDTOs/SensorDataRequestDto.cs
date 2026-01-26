using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;
using SensorDataType = Backend.Models.DataType;

namespace Backend.DTOs;

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum TimeGranularity
{
    Minute,
    Hour,
    Day
}

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum AggregationFunction
{
    Avg,
    Sum,
    Min,
    Max,
    Count
}

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum Field
{
    [DataTypeField(SensorDataType.Dust)]
    Pm1_stel,

    [DataTypeField(SensorDataType.Dust)]
    Pm25_stel,

    [DataTypeField(SensorDataType.Dust)]
    Pm4_stel,

    [DataTypeField(SensorDataType.Dust)]
    Pm10_stel
}

[AttributeUsage(AttributeTargets.Field)]
public class DataTypeFieldAttribute(SensorDataType dataType) : Attribute
{
    public SensorDataType DataType { get; } = dataType;
}

public record SensorDataRequestDto(
    [Required] DateTimeOffset? StartTime,
    [Required] DateTimeOffset? EndTime,
    [Required] TimeGranularity? Granularity,
    [Required] AggregationFunction? Function,
    Field? Field
);  