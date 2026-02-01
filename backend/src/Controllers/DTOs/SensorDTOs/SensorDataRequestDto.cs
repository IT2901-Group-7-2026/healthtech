using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;
using SensorDataType = Backend.Models.DataType;

namespace Backend.DTOs;

public enum TimeGranularity
{
    Minute,
    Hour,
    Day
}

public enum AggregationFunction
{
    Avg,
    Sum,
    Min,
    Max,
    Count
}

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

public class DataTypeFieldAttribute(SensorDataType dataType) : Attribute
{
    public SensorDataType DataType { get; } = dataType;
}

public record SensorDataRequestDto(
    [Required] DateTimeOffset StartTime,
    [Required] DateTimeOffset EndTime,
    [Required] TimeGranularity Granularity,
    [Required] AggregationFunction Function,
    Field? Field
);  