using Backend.Models;

public class Location
{
    public required Guid Id { get; set; }
    public required double Latitude { get; set; }
    public required double Longitude { get; set; }
    public required string Country { get; set; }
    public required string Region { get; set; }
    public required string City { get; set; }
    public required string Site { get; set; }
    public string? Building { get; set; }
    public required ICollection<User> Users { get; set; } = [];

    public Location(Guid id, double latitude, double longitude, string country, string region, string city, string site, string? building = null)
    {
        Id = id;
        Latitude = latitude;
        Longitude = longitude;
        Country = country;
        Region = region;
        City = city;
        Site = site;
        Building = building;
    }
}
