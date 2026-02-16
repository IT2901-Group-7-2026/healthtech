namespace Backend.Records;

public record RawSensorData(
	DateTime Time,
	double Value,
	double AvgValue,
	double MaxValue,
	double SumValue
);
