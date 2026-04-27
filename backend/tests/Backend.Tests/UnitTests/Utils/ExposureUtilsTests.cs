using Backend.DTOs;
using Backend.Models;
using Backend.Records;
using Backend.Utils;

namespace Backend.Tests.UnitTests.Utils;

public class ExposureUtilsTests
{
	[Fact]
	public void GetMaterializedViewName_MinuteGranularity_ReturnsMinutelyViewName()
	{
		string result = ExposureUtils.GetMaterializedViewName(
			ExposureType.Noise,
			TimeGranularity.Minute
		);

		Assert.Equal("noise_data_minutely", result);
	}

	[Fact]
	public void GetMaterializedViewName_HourGranularity_ReturnsHourlyViewName()
	{
		string result = ExposureUtils.GetMaterializedViewName(
			ExposureType.Dust,
			TimeGranularity.Hour
		);

		Assert.Equal("dust_data_hourly", result);
	}

	[Fact]
	public void GetMaterializedViewName_DayGranularity_ReturnsDailyViewName()
	{
		string result = ExposureUtils.GetMaterializedViewName(
			ExposureType.Vibration,
			TimeGranularity.Day
		);

		Assert.Equal("vibration_data_daily", result);
	}

	[Fact]
	public void GetMaterializedViewName_UnsupportedGranularity_ThrowsArgumentException()
	{
		ArgumentException exception = Assert.Throws<ArgumentException>(() =>
			ExposureUtils.GetMaterializedViewName(ExposureType.Noise, (TimeGranularity)99)
		);

		Assert.Equal("Unsupported scope: 99", exception.Message);
	}

	[Fact]
	public void GetAggregateColumnName_NoiseAvg_ReturnsNoiseLaeqColumn()
	{
		string result = ExposureUtils.GetAggregateColumnName(
			AggregationFunction.Avg,
			ExposureType.Noise,
			null
		);

		Assert.Equal("avg_noise_laeq", result);
	}

	[Fact]
	public void GetAggregateColumnName_NoiseMax_ReturnsNoiseLcpkColumn()
	{
		string result = ExposureUtils.GetAggregateColumnName(
			AggregationFunction.Max,
			ExposureType.Noise,
			null
		);

		Assert.Equal("max_noise_lcpk", result);
	}

	[Fact]
	public void GetAggregateColumnName_NoiseMin_ReturnsNoiseMinLaeqColumn()
	{
		string result = ExposureUtils.GetAggregateColumnName(
			AggregationFunction.Min,
			ExposureType.Noise,
			null
		);

		Assert.Equal("min_noise_laeq", result);
	}

	[Fact]
	public void GetAggregateColumnName_DustWithField_ReturnsFieldSpecificColumn()
	{
		string result = ExposureUtils.GetAggregateColumnName(
			AggregationFunction.Sum,
			ExposureType.Dust,
			Field.Pm10_twa
		);

		Assert.Equal("sum_dust_pm10_twa", result);
	}

	[Fact]
	public void GetAggregateColumnName_CountWithoutField_ReturnsSampleCountColumn()
	{
		string result = ExposureUtils.GetAggregateColumnName(
			AggregationFunction.Count,
			ExposureType.Dust,
			null
		);

		Assert.Equal("sample_count", result);
	}

	[Fact]
	public void GetAggregateColumnName_UnsupportedAggregation_ThrowsArgumentException()
	{
		ArgumentException exception = Assert.Throws<ArgumentException>(() =>
			ExposureUtils.GetAggregateColumnName((AggregationFunction)99, ExposureType.Dust, null)
		);

		Assert.Equal("Unsupported aggregation type: 99", exception.Message);
	}

	[Fact]
	public void CumulateVibrationSumValues_NonVibrationOrNonSum_ReturnsInputReference()
	{
		List<RawExposureData> rawData =
		[
			new(new DateTime(2026, 4, 10, 8, 0, 0, DateTimeKind.Utc), 10, 1, 2, 10, Guid.NewGuid()),
		];

		List<RawExposureData> resultForDust = ExposureUtils.CumulateVibrationSumValues(
			ExposureType.Dust,
			AggregationFunction.Sum,
			rawData
		);

		List<RawExposureData> resultForAvg = ExposureUtils.CumulateVibrationSumValues(
			ExposureType.Vibration,
			AggregationFunction.Avg,
			rawData
		);

		Assert.Same(rawData, resultForDust);
		Assert.Same(rawData, resultForAvg);
	}

	[Fact]
	public void CumulateVibrationSumValues_VibrationSum_SortsAndResetsPerDay()
	{
		Guid userId = Guid.NewGuid();
		DateTime dayOneFirst = new(2026, 4, 10, 8, 0, 0, DateTimeKind.Utc);
		DateTime dayOneSecond = new(2026, 4, 10, 9, 0, 0, DateTimeKind.Utc);
		DateTime dayTwoFirst = new(2026, 4, 11, 8, 0, 0, DateTimeKind.Utc);

		List<RawExposureData> rawData =
		[
			new(dayOneSecond, 5, 10, 11, 12, userId),
			new(dayTwoFirst, 7, 20, 21, 22, userId),
			new(dayOneFirst, 3, 30, 31, 32, userId),
		];

		List<RawExposureData> result = ExposureUtils.CumulateVibrationSumValues(
			ExposureType.Vibration,
			AggregationFunction.Sum,
			rawData
		);

		Assert.Equal(3, result.Count);
		Assert.Equal(dayOneFirst, result[0].Time);
		Assert.Equal(3, result[0].Value);
		Assert.Equal(dayOneSecond, result[1].Time);
		Assert.Equal(8, result[1].Value);
		Assert.Equal(dayTwoFirst, result[2].Time);
		Assert.Equal(7, result[2].Value);

		Assert.Equal(30, result[0].AvgValue);
		Assert.Equal(31, result[0].MaxValue);
		Assert.Equal(32, result[0].SumValue);
		Assert.Equal(userId, result[0].UserId);
	}
}
