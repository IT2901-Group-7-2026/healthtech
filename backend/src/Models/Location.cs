using Backend.Models;

public class Location
{
	public required Guid Id { get; set; }
	public required float Latitude { get; set; }
	public required float Longitude { get; set; }
	public required string Country { get; set; }
	public required string Region { get; set; }
	public required string City { get; set; }
	public required string Site { get; set; }
	public string? Building { get; set; }
	public required ICollection<User> Users { get; set; } = [];
}
