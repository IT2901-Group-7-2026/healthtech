namespace Backend.DTOs;

public record UserDto(
    Guid Id,
    string Username,
    string Email,
    DateTime CreatedAt
);