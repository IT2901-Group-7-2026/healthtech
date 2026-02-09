using Backend.Models;

namespace Backend.DTOs;

public class UserDto
{
    public Guid Id { get; set; }
    public required string Username { get; set; }
    public required string Email { get; set; }
    public string? JobDescription { get; set; }
    public required DateTime CreatedAt { get; set; }
    public required UserRole Role { get; set; }
    public LocationDto? Location { get; set; }

    public static UserDto FromEntity(User user) =>
        new UserDto
        {
            Id = user.Id,
            Username = user.Username,
            Email = user.Email,
            JobDescription = user.JobDescription,
            CreatedAt = user.CreatedAt,
            Role = user.Role,
            Location = user.Location != null ? LocationDto.FromEntity(user.Location) : null,
        };
}
