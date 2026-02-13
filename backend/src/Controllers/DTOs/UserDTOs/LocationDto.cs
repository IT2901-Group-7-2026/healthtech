namespace Backend.DTOs;

public class LocationDto()
{
	public required Guid Id { get; set; }
	public required float Latitude { get; set; }
	public required float Longitude { get; set; }
	public required string Country { get; set; }
	public required string Region { get; set; }
	public required string City { get; set; }
	public required string Site { get; set; }
	public string? Building { get; set; }

	public static LocationDto FromEntity(Location location) =>
		new LocationDto
		{
			Id = location.Id,
			Latitude = location.Latitude,
			Longitude = location.Longitude,
			Country = location.Country,
			Region = location.Region,
			City = location.City,
			Site = location.Site,
			Building = location.Building,
		};
}
