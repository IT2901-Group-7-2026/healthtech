using Backend.Models;
using Microsoft.EntityFrameworkCore;

namespace Backend.Records;

[PrimaryKey(nameof(Id), nameof(Time))]
public class DustData()
{
	public Guid Id { get; set; }
	public DateTime Time { get; set; }
	public double PM1S { get; set; }
	public double PM25S { get; set; }
	public double PM4S { get; set; }
	public double PM10S { get; set; }
	public double PM1T { get; set; }
	public double PM25T { get; set; }
	public double PM4T { get; set; }
	public double PM10T { get; set; }
	public Guid UserId { get; set; }
	public User? User { get; set; }
}
