using Backend.Models;
using Microsoft.EntityFrameworkCore;

namespace Backend.Records;

[PrimaryKey(nameof(Id), nameof(Time))]
public class NoiseData()
{
    public Guid Id { get; set; }
    public double LavgQ3 { get; set; }
    public DateTime Time { get; set; }
    public Guid UserId { get; set; }
    public User? User { get; set; }
}
