namespace Backend.Models;

public class NoteData
{
	public required Guid Id { get; set; }
	public required string Note { get; set; }
	public required DateTime Time { get; set; }
	public required Guid UserId { get; set; }
	public User? User { get; set; }
}
