using Backend.Models;
using Microsoft.EntityFrameworkCore;

namespace Backend.Records;

[PrimaryKey(nameof(Id), nameof(ConnectedOn))]
public class VibrationData()
{
	public Guid Id { get; set; }
	public double Exposure { get; set; }
	public DateTime ConnectedOn { get; set; }
	public DateTime DisconnectedOn { get; set; }
	public Guid UserId { get; set; }
	public User? User { get; set; }
}
