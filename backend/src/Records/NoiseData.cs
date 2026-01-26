using Microsoft.EntityFrameworkCore;

namespace Backend.Records;

[PrimaryKey(nameof(Id), nameof(Time))]
public record NoiseData(Guid Id, double LavgQ3, DateTime Time);