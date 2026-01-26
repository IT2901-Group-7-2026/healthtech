using Microsoft.EntityFrameworkCore;

namespace Backend.Records;

[PrimaryKey(nameof(Id), nameof(ConnectedOn))]
public record VibrationData(Guid Id, double Exposure, DateTime ConnectedOn, DateTime DisconnectedOn);