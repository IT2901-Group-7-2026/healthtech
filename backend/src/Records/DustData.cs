using Microsoft.EntityFrameworkCore;

namespace Backend.Records;

[PrimaryKey(nameof(Id), nameof(Time))]
public record DustData(Guid Id, DateTime Time, double PM1S, double PM25S, double PM4S, double PM10S, double PM1T, double PM25T, double PM4T, double PM10T);