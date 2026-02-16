namespace Backend.Models;

public class Threshold(double warning, double danger, double? peakDanger = null)
{
	public static readonly Threshold Dust = new(15, 30);
	public static readonly Threshold Noise = new(80, 85, 130);
	public static readonly Threshold Vibration = new(100, 400);

	public double Warning { get; set; } = warning;
	public double Danger { get; set; } = danger;
	public double? PeakDanger { get; set; } = peakDanger;

	public static Threshold GetThresholdForSensorType(SensorType sensorType)
	{
		return sensorType switch
		{
			SensorType.Dust => Dust,
			SensorType.Noise => Noise,
			SensorType.Vibration => Vibration,
			_ => throw new ArgumentOutOfRangeException(
				nameof(sensorType),
				sensorType,
				$"No threshold defined for data type {sensorType}"
			),
		};
	}
}
