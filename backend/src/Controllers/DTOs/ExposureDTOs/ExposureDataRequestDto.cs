using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;
using ExposureType = Backend.Models.ExposureType;

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
	[ExposureTypeField(ExposureType.Dust)]
	Pm1_stel,

	[ExposureTypeField(ExposureType.Dust)]
	Pm25_stel,

	[ExposureTypeField(ExposureType.Dust)]
	Pm4_stel,

	[ExposureTypeField(ExposureType.Dust)]
	Pm10_stel,

	[ExposureTypeField(ExposureType.Dust)]
	Pm1_twa,

	[ExposureTypeField(ExposureType.Dust)]
	Pm25_twa,

	[ExposureTypeField(ExposureType.Dust)]
	Pm4_twa,

	[ExposureTypeField(ExposureType.Dust)]
	Pm10_twa,
}

public class ExposureTypeFieldAttribute(ExposureType exposureType) : Attribute
{
	public ExposureType ExposureType { get; } = exposureType;
}

// TODO: Get rid of this, just use parameters
public record ExposureDataRequestDto(
	[Required] DateTimeOffset StartTime,
	[Required] DateTimeOffset EndTime,
	[Required] TimeGranularity Granularity,
	[Required] AggregationFunction Function,
	Field? Field
);
