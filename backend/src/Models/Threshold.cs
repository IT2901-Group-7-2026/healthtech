namespace Backend.Models;

public class Threshold(double warning, double danger)
{
    public static readonly Threshold Dust = new(15, 30);
    public static readonly Threshold Noise = new(80, 85);
    public static readonly Threshold Vibration = new(100, 400);

    public double Warning { get; set; } = warning;
    public double Danger { get; set; } = danger;

    public static Threshold GetThresholdForSensorType(DataType dataType)
    {
        return dataType switch
        {
            DataType.Dust => Dust,
            DataType.Noise => Noise,
            DataType.Vibration => Vibration,
            _ => throw new ArgumentOutOfRangeException(
                nameof(dataType),
                dataType,
                $"No threshold defined for data type {dataType}"
            ),
        };
    }
}
