using System.ComponentModel.DataAnnotations;
namespace Backend.DTOs;

public record CreateUserDto(
    [Required] string Username,
    [Required] string Email,
    [Required] string Password  // Password only needed during creation
);