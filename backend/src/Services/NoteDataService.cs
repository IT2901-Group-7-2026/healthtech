using Backend.DTOs;
using Backend.Models;
using Microsoft.EntityFrameworkCore;

namespace Backend.Services;

public interface INoteDataService
{
	Task<IEnumerable<NoteData>> GetNotesAsync(NoteDataRequestDto request);
	Task<NoteData> CreateNoteAsync(NoteDataCreateDto createDto, Guid userId);
	Task<NoteData> UpdateNoteAsync(NoteDataDto updateDto);
	Task<NoteData?> DeleteNoteAsync(NoteDataDto request, Guid userId);
}

public class NoteDataService(AppDbContext dbContext) : INoteDataService
{
	private readonly AppDbContext _dbContext = dbContext;

	public async Task<IEnumerable<NoteData>> GetNotesAsync(NoteDataRequestDto request)
	{
		if (
			request.StartTime!.Value.Offset != TimeSpan.Zero
			|| request.EndTime!.Value.Offset != TimeSpan.Zero
		)
		{
			throw new ArgumentException("Please provide time in UTC format");
		}

		return await _dbContext
			.NoteData.Where(n =>
				n.Time >= request.StartTime
				&& n.Time <= request.EndTime
				&& !string.IsNullOrEmpty(n.Note)
			)
			.OrderBy(n => n.Time)
			.ToListAsync();
	}

	public async Task<NoteData> CreateNoteAsync(NoteDataCreateDto createDto, Guid userId)
	{
		if (createDto.Time!.Value.Offset != TimeSpan.Zero)
		{
			throw new ArgumentException("Please provide time in UTC format");
		}

		var existingNote = await _dbContext.NoteData.AnyAsync(n =>
			n.Time == createDto.Time && n.UserId == userId
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
			UserId = userId,
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

	public async Task<NoteData?> DeleteNoteAsync(NoteDataDto dto, Guid userId)
	{
		if (dto.Time!.Value.Offset != TimeSpan.Zero)
		{
			throw new ArgumentException("Please provide time in UTC format");
		}

		var note = await _dbContext.NoteData.FirstOrDefaultAsync(n =>
			n.Time == dto.Time && n.UserId == userId
		);

		if (note == null)
		{
			return null;
		}

		_dbContext.NoteData.Remove(note);
		await _dbContext.SaveChangesAsync();

		return note;
	}
}
