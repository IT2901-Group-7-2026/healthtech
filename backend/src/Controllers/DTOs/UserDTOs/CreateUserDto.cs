using System.ComponentModel.DataAnnotations;
namespace Backend.DTOs;

public record CreateUserDto(
    [Required] string Username,
    [Required] string Email,
    [Required] string Password,  // Password only needed during creation
    [Required] string LocationId,
    [Required] List<string> ManagerIds,
    [Required] UserRole Role,
    string? JobDescription // JobDescription optional at creation
);