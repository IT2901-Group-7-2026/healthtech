using Microsoft.EntityFrameworkCore;

namespace Backend.Models;

public class NoteData
{
    public Guid Id { get; set; }
    public string Note { get; set; }
    public DateTime Time { get; set; }

    public NoteData(Guid id, string note, DateTime time)
    {
        Id = id;
        Note = note;
        Time = time;
    }
}