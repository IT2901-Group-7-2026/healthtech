using Backend.Records;

namespace Backend.Models;

public class User
{
	public Guid Id { get; set; }
	public required string Username { get; set; }
	public required string Email { get; set; }
	public required string PasswordHash { get; set; }
	public string? JobDescription { get; set; }
	public required DateTime CreatedAt { get; set; } = DateTime.UtcNow;
	public required UserRole Role { get; set; }
	public ICollection<NoteData> Notes { get; set; } = [];
	public required Guid LocationId { get; set; }

	/// <summary>
	/// The location associated with the user. If the user type is Worker, the user should not set a value and instead
	/// inherit the location from their supervisor.
	/// </summary>
	public Location? Location { get; set; }
	public ICollection<User> Managers { get; set; } = [];
	public ICollection<User> Subordinates { get; set; } = [];
	public ICollection<VibrationData> VibrationData { get; set; } = [];
	public ICollection<DustData> DustData { get; set; } = [];
	public ICollection<NoiseData> NoiseData { get; set; } = [];
}
