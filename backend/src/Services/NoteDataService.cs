using Backend.DTOs;
using Backend.Models;
using Microsoft.EntityFrameworkCore;

namespace Backend.Services;

public interface INoteDataService
{
    Task<IEnumerable<NoteDataResponseDto>> GetNotesAsync(NoteDataRequestDto request);
    Task<NoteData> CreateNoteAsync(NoteDataDto createDto);
    Task<NoteData> UpdateNoteAsync(NoteDataDto updateDto);
}

public class NoteDataService(AppDbContext dbContext) : INoteDataService
{
    private readonly AppDbContext _dbContext = dbContext;

    public async Task<IEnumerable<NoteDataResponseDto>> GetNotesAsync(NoteDataRequestDto request)
    {
        if (
            request.StartTime!.Value.Offset != TimeSpan.Zero
            || request.EndTime!.Value.Offset != TimeSpan.Zero
        )
        {
            throw new ArgumentException("Please provide time in UTC format");
        }

        var notes = await _dbContext
            .NoteData.Where(n =>
                n.Time >= request.StartTime
                && n.Time <= request.EndTime
                && !string.IsNullOrEmpty(n.Note)
            )
            .Include(n => n.User)
            .ToListAsync();

        return notes.Select(n =>
        {
            var managers = n
                .User.Managers.Select(m => new UserDto(
                    m.Id,
                    m.Username,
                    m.Email,
                    m.JobDescription,
                    m.CreatedAt,
                    m.Role,
                    m.Location,
                    null,
                    null
                ))
                .ToList();

            var subordinates = n
                .User.Subordinates.Select(s => new UserDto(
                    s.Id,
                    s.Username,
                    s.Email,
                    s.JobDescription,
                    s.CreatedAt,
                    s.Role,
                    s.Location,
                    null,
                    null
                ))
                .ToList();

            return new NoteDataResponseDto
            {
                Note = n.Note,
                Time = n.Time,
                User = new UserDto(
                    n.User.Id,
                    n.User.Username,
                    n.User.Email,
                    n.User.JobDescription,
                    n.User.CreatedAt,
                    n.User.Role,
                    n.User.Location,
                    managers,
                    subordinates
                ),
            };
        });
    }

    public async Task<NoteData> CreateNoteAsync(NoteDataDto createDto)
    {
        if (createDto.Time!.Value.Offset != TimeSpan.Zero)
        {
            throw new ArgumentException("Please provide time in UTC format");
        }

        var existingNote = await _dbContext.NoteData.AnyAsync(n =>
            n.Time == createDto.Time && n.UserId == createDto.User.Id
        );

        if (existingNote)
        {
            throw new InvalidOperationException("A note with this time already exists");
        }

        var noteData = new NoteData
        {
            Id = Guid.NewGuid(),
            Note = createDto.Note,
            Time = createDto.Time!.Value.UtcDateTime,
            UserId = createDto.User.Id,
            User = null!,
        };

        var createdNote = _dbContext.NoteData.Add(noteData);
        await _dbContext.SaveChangesAsync();

        return createdNote.Entity;
    }

    public async Task<NoteData> UpdateNoteAsync(NoteDataDto updateDto)
    {
        if (updateDto.Time!.Value.Offset != TimeSpan.Zero)
        {
            throw new ArgumentException("Please provide time in UTC format");
        }

        var note = await _dbContext.NoteData.FirstOrDefaultAsync(n => n.Time == updateDto.Time);

        if (note == null)
        {
            throw new InvalidOperationException("This is not a note that exists");
        }

        note.Note = updateDto.Note;
        await _dbContext.SaveChangesAsync();

        return note;
    }
}
