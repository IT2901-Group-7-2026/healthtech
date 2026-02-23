using Backend.Models;
using Microsoft.EntityFrameworkCore;

namespace Backend.Records;

[PrimaryKey(nameof(Id), nameof(Time))]
public class NoiseData()
{
	public Guid Id { get; set; }

	/// <summary>
	/// Peak sound pressure level, measured in decibels, that occurs during a specified time period. Used for peak noise exposure thresholds
	/// </summary>
	public double LCPK { get; set; }

	/// <summary>
	/// Equivalent continuous sound level, measured in decibels, over a specified time period. It represents the average noise level. Used for average noise exposure thresholds
	/// </summary>
	public double LAEQ { get; set; }
	public DateTime Time { get; set; }
	public Guid UserId { get; set; }
	public User? User { get; set; }
}
