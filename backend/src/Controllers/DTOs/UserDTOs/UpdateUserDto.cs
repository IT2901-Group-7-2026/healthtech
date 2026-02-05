using System.ComponentModel.DataAnnotations;

namespace Backend.DTOs;

public record UpdateUserDto(
    string? Username = null,
    string? Email = null,
    string? Password = null,
    string? JobDescription = null,
    string? LocationId = null,
    List<string>? ManagerIds = null,
    List<string>? SubordinateIds = null,
    UserRole? Role = null
);
