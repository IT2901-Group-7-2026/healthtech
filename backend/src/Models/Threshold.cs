using Backend.DTOs;

namespace Backend.Models;

public class Threshold(double warning, double danger, double? peakDanger = null)
{
	public static readonly Threshold Dust = new(7.5, 15);
	public static readonly Threshold DustPm1Stel = new(7.5, 15);
	public static readonly Threshold DustPm25Stel = new(7.5, 15);
	public static readonly Threshold DustPm4Stel = new(7.5, 15);
	public static readonly Threshold DustPm10Stel = new(15, 30);
	public static readonly Threshold DustPm1Twa = new(7.5, 15);
	public static readonly Threshold DustPm25Twa = new(7.5, 15);
	public static readonly Threshold DustPm4Twa = new(7.5, 15);
	public static readonly Threshold DustPm10Twa = new(15, 30);
	public static readonly Threshold Noise = new(80, 85, 130);
	public static readonly Threshold Vibration = new(100, 400);

	private static readonly IReadOnlyDictionary<Field, Threshold> DustThresholdsByField =
		new Dictionary<Field, Threshold>
		{
			{ Field.Pm1_stel, DustPm1Stel },
			{ Field.Pm25_stel, DustPm25Stel },
			{ Field.Pm4_stel, DustPm4Stel },
			{ Field.Pm10_stel, DustPm10Stel },
			{ Field.Pm1_twa, DustPm1Twa },
			{ Field.Pm25_twa, DustPm25Twa },
			{ Field.Pm4_twa, DustPm4Twa },
			{ Field.Pm10_twa, DustPm10Twa },
		};

	public double Warning { get; set; } = warning;
	public double Danger { get; set; } = danger;
	public double? PeakDanger { get; set; } = peakDanger;

	public static Threshold GetThresholdForExposureType(ExposureType exposureType)
	{
		return exposureType switch
		{
			ExposureType.Dust => Dust,
			ExposureType.Noise => Noise,
			ExposureType.Vibration => Vibration,
			_ => throw new ArgumentOutOfRangeException(
				nameof(exposureType),
				exposureType,
				$"No threshold defined for data type {exposureType}"
			),
		};
	}

	public static Threshold GetThresholdForExposureTypeAndField(ExposureType exposureType, Field? field)
	{
		if (exposureType != ExposureType.Dust)
		{
			return GetThresholdForExposureType(exposureType);
		}

		if (field.HasValue && DustThresholdsByField.TryGetValue(field.Value, out var threshold))
		{
			return threshold;
		}

		return Dust;
	}
}
