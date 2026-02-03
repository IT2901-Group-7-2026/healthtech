using Microsoft.EntityFrameworkCore;

namespace Backend.Models;

public class NoteData
{
    public required Guid Id { get; set; }
    public required string Note { get; set; }
    public required DateTime Time { get; set; }
    public required string UserId { get; set; }
    public required User User { get; set; }

    public NoteData(Guid id, string note, DateTime time, string userId)
    {
        Id = id;
        Note = note;
        Time = time;
        UserId = userId;
    }
}