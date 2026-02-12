using Backend.DTOs;
using Backend.Models;
using Backend.Utils;
using Microsoft.EntityFrameworkCore;

namespace Backend.Services;

public interface IUserStatusService
{
    Task<IEnumerable<UserStatusDto>> GetCurrentStatusForUsers(
        IEnumerable<Guid> userIds,
        DateTimeOffset startTime,
        DateTimeOffset endTime
    );
}

public record UserAggRow(Guid UserId, double? Value);

public class UserStatusService(AppDbContext _context) : IUserStatusService
{
    public async Task<IEnumerable<UserStatusDto>> GetCurrentStatusForUsers(
        IEnumerable<Guid> userIds,
        DateTimeOffset startTime,
        DateTimeOffset endTime
    )
    {
        var ids = userIds.Distinct().ToArray();
        if (ids.Length == 0)
        {
            return [];
        }

        var noiseRows = await _context
            .Database.SqlQueryRaw<UserAggRow>(
                """
                SELECT "user_id" as "UserId", MAX(max_noise) as "Value"
                FROM noise_data_minutely
                WHERE bucket >= {0} AND bucket <= {1}
                  AND "user_id" = ANY({2})
                GROUP BY "user_id"
                """,
                startTime,
                endTime,
                ids
            )
            .ToListAsync();

        var dustRows = await _context
            .Database.SqlQueryRaw<UserAggRow>(
                """
                SELECT "user_id" as "UserId", MAX(max_dust_Pm1_stel) as "Value"
                FROM dust_data_minutely
                WHERE bucket >= {0} AND bucket <= {1}
                  AND "user_id" = ANY({2})
                GROUP BY "user_id"
                """,
                startTime,
                endTime,
                ids
            )
            .ToListAsync();

        // Vibration is cumulative over each day
        var dayStartUtc = new DateTimeOffset(endTime.UtcDateTime.Date, TimeSpan.Zero);

        var vibrationRows = await _context
            .Database.SqlQueryRaw<UserAggRow>(
                """
                SELECT "user_id" as "UserId", SUM(sum_vibration) as "Value"
                FROM vibration_data_daily
                WHERE bucket >= {0} AND bucket <= {1}
                  AND "user_id" = ANY({2})
                GROUP BY "user_id"
                """,
                dayStartUtc,
                endTime,
                ids
            )
            .ToListAsync();

        var noiseByUser = noiseRows.ToDictionary(x => x.UserId, x => x.Value);
        var dustByUser = dustRows.ToDictionary(x => x.UserId, x => x.Value);
        var vibByUser = vibrationRows.ToDictionary(x => x.UserId, x => x.Value);

        var now = DateTimeOffset.UtcNow;

        var result = new List<UserStatusDto>(ids.Length);

        foreach (var userId in ids)
        {
            var noiseLevel = TryLevel(DataType.Noise, noiseByUser.GetValueOrDefault(userId));
            var dustLevel = TryLevel(DataType.Dust, dustByUser.GetValueOrDefault(userId));
            var vibLevel = TryLevel(DataType.Vibration, vibByUser.GetValueOrDefault(userId));

            var overall = WorstOf(noiseLevel, dustLevel, vibLevel);

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

    private static DangerLevel? TryLevel(DataType type, double? value)
    {
        if (!value.HasValue)
        {
            return null;
        }

        return ThresholdUtils.CalculateDangerLevel(type, value.Value);
    }

    private static DangerLevel WorstOf(params DangerLevel?[] levels)
    {
        var worst = DangerLevel.Safe;
        foreach (var lvl in levels)
        {
            if (lvl.HasValue && lvl.Value > worst)
            {
                worst = lvl.Value;
            }
        }
        return worst;
    }
}
