using System.ComponentModel.DataAnnotations;
namespace Backend.DTOs;
public record UpdateUserDto(
    string? Username = null,    // Optional update
    string? Email = null,       // Optional update
    string? Password = null     // Optional password change
);