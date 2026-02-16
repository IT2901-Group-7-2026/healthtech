using Backend.DTOs;
using Backend.Models;
using Backend.Utils;
using Microsoft.EntityFrameworkCore;

namespace Backend.Services;

public interface IUserStatusService
{
	Task<IEnumerable<UserStatusDto>> GetCurrentStatusForUsers(IEnumerable<Guid> userIds);
}

public record UserAggRow(Guid UserId, double? Value, double? MaxValue);

public class UserStatusService(AppDbContext _context) : IUserStatusService
{
	public async Task<IEnumerable<UserStatusDto>> GetCurrentStatusForUsers(
		IEnumerable<Guid> userIds
	)
	{
		var ids = userIds.Distinct().ToArray();
		if (ids.Length == 0)
		{
			return [];
		}

		DateOnly today = DateOnly.FromDateTime(DateTime.UtcNow);

		var noiseRows = await _context
			.Database.SqlQuery<UserAggRow>(
				$"""
				SELECT "user_id" as "UserId",
				MAX(max_noise_lcpk) as MaxValue,
				AVG(avg_noise_laeq) as Value
				FROM noise_data_daily
				WHERE bucket = {today}
				  AND "user_id" = ANY({ids})
				GROUP BY "user_id"
				"""
			)
			.ToListAsync();

		var dustRows = await _context
			.Database.SqlQuery<UserAggRow>(
				$"""
				SELECT "user_id" as "UserId", MAX(max_dust_Pm1_twa) as Value, null as MaxValue
				FROM dust_data_daily
				WHERE bucket = {today}
				  AND "user_id" = ANY({ids})
				GROUP BY "user_id"
				"""
			)
			.ToListAsync();

		var vibrationRows = await _context
			.Database.SqlQuery<UserAggRow>(
				$"""
				SELECT "user_id" as "UserId", SUM(sum_vibration) as Value, null as MaxValue
				FROM vibration_data_daily
				WHERE bucket = {today}
				  AND "user_id" = ANY({ids})
				GROUP BY "user_id"
				"""
			)
			.ToListAsync();

		var noiseByUser = noiseRows.ToDictionary(x => x.UserId, x => new { x.Value, x.MaxValue });
		var dustByUser = dustRows.ToDictionary(x => x.UserId, x => new { x.Value, x.MaxValue });
		var vibByUser = vibrationRows.ToDictionary(x => x.UserId, x => new { x.Value, x.MaxValue });

		var now = DateTimeOffset.UtcNow;

		var result = new List<UserStatusDto>(ids.Length);

		foreach (var userId in ids)
		{
			var noiseLevel = TryLevel(
				SensorType.Noise,
				noiseByUser.GetValueOrDefault(userId)?.Value,
				noiseByUser.GetValueOrDefault(userId)?.MaxValue
			);
			var dustLevel = TryLevel(
				SensorType.Dust,
				dustByUser.GetValueOrDefault(userId)?.Value,
				dustByUser.GetValueOrDefault(userId)?.MaxValue
			);
			var vibLevel = TryLevel(
				SensorType.Vibration,
				vibByUser.GetValueOrDefault(userId)?.Value,
				vibByUser.GetValueOrDefault(userId)?.MaxValue
			);

			var overall = ThresholdUtils.GetHighestDangerLevel(noiseLevel, dustLevel, vibLevel);

			result.Add(
				new UserStatusDto
				{
					UserId = userId,
					Status = overall,
					Noise = noiseLevel,
					Dust = dustLevel,
					Vibration = vibLevel,
					CalculatedAt = now,
				}
			);
		}

		return result;
	}

	private static DangerLevel? TryLevel(SensorType type, double? value, double? maxValue = null)
	{
		if (!value.HasValue)
		{
			return null;
		}

		return ThresholdUtils.CalculateDangerLevel(type, value.Value, maxValue);
	}
}
