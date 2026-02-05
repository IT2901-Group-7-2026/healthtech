namespace Backend.DTOs;

public record UserDto(
    Guid Id,
    string Username,
    string Email,
    DateTime CreatedAt,
    UserRole Role,
    Location Location,
    List<UserDto>? Managers,
    List<UserDto>? Subordinates
);