using Backend.DTOs;
using Backend.Models;
using Microsoft.EntityFrameworkCore;

namespace Backend.Services;

public interface INoteDataService
{
    Task<IEnumerable<NoteDataResponseDto>> GetNotesAsync(NoteDataRequestDto request);
    Task<string> CreateNoteAsync(NoteDataDto createDto);
    Task<string> UpdateNoteAsync(NoteDataDto updateDto);
}

public class NoteDataService(AppDbContext dbContext) : INoteDataService
{
    private readonly AppDbContext _dbContext = dbContext;

    public async Task<IEnumerable<NoteDataResponseDto>> GetNotesAsync(NoteDataRequestDto request)
    {
        if (request.StartTime!.Value.Offset != TimeSpan.Zero || request.EndTime!.Value.Offset != TimeSpan.Zero)
        {
            throw new ArgumentException("Please provide time in UTC format");
        }

        var notes = await _dbContext.NoteData
            .Where(n => n.Time >= request.StartTime && n.Time <= request.EndTime && !string.IsNullOrEmpty(n.Note))
            .ToListAsync();

        return notes.Select(n => new NoteDataResponseDto
        {
            Note = n.Note,
            Time = n.Time
        });
    }

    public async Task<string> CreateNoteAsync(NoteDataDto createDto)
    {
        if (createDto.Time!.Value.Offset != TimeSpan.Zero)
        {
            throw new ArgumentException("Please provide time in UTC format");
        }

        var existingNote = await _dbContext.NoteData
            .AnyAsync(n => n.Time == createDto.Time);

        if (existingNote)
        {
            throw new InvalidOperationException("A note with this time already exists");
        }


        var noteData = new NoteData(
            Guid.NewGuid(),
            createDto.Note,
            createDto.Time!.Value.UtcDateTime
        );

        _dbContext.NoteData.Add(noteData);
        await _dbContext.SaveChangesAsync();

        return "Note created successfully";
    }

    public async Task<string> UpdateNoteAsync(NoteDataDto updateDto)
    {
        if (updateDto.Time!.Value.Offset != TimeSpan.Zero)
        {
            throw new ArgumentException("Please provide time in UTC format");
        }
        
        var note = await _dbContext.NoteData
            .FirstOrDefaultAsync(n => n.Time == updateDto.Time);

        if (note == null)
        {
            throw new InvalidOperationException("This is not a note that exists");
        }

        note.Note = updateDto.Note;  
        await _dbContext.SaveChangesAsync();  

        return "Note updated successfully";
    }
}