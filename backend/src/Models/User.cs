namespace Backend.Models;

public class User
{
    public Guid Id { get; set; }
    public required string Username { get; set; }
    public required string Email { get; set; }
    public required string PasswordHash { get; set; }
    public string? JobDescription { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}