namespace Backend.Records;

public record RawExposureData(
	DateTime Time,
	double Value,
	double AvgValue,
	double MaxValue,
	double SumValue,
	Guid UserId
);
