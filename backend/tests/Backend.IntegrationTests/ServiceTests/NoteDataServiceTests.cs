using Backend.DTOs;
using Backend.IntegrationTests.Fixtures;
using Backend.Models;
using Backend.Services;
using Microsoft.EntityFrameworkCore;

namespace Backend.IntegrationTests.ServiceTests;

[Collection(PostgresTestDbCollection.Name)]
public sealed class NoteDataServiceTests(PostgresTestDbFixture fixture)
	: IntegrationTestBase(fixture)
{
	[Fact]
	public async Task GetNotesAsync_ReturnsOrderedNotes_ForUserWithinRange()
	{
		await using var context = Fixture.CreateDbContext();
		var service = new NoteDataService(context);

		Guid userId = SeedIds.KariId;
		DateTimeOffset startTime = new(2026, 2, 12, 10, 0, 0, TimeSpan.Zero);
		DateTimeOffset endTime = new(2026, 2, 12, 12, 0, 0, TimeSpan.Zero);
		DateTime firstNoteTime = new(2026, 2, 12, 10, 30, 0, DateTimeKind.Utc);
		DateTime secondNoteTime = new(2026, 2, 12, 11, 15, 0, DateTimeKind.Utc);
		DateTime outOfRangeTime = new(2026, 2, 12, 13, 0, 0, DateTimeKind.Utc);

		context.NoteData.AddRange(
			new NoteData
			{
				Id = Guid.NewGuid(),
				UserId = userId,
				Time = secondNoteTime,
				Note = "Second note",
			},
			new NoteData
			{
				Id = Guid.NewGuid(),
				UserId = userId,
				Time = firstNoteTime,
				Note = "First note",
			},
			new NoteData
			{
				Id = Guid.NewGuid(),
				UserId = userId,
				Time = outOfRangeTime,
				Note = "Outside range",
			},
			new NoteData
			{
				Id = Guid.NewGuid(),
				UserId = SeedIds.PerId,
				Time = firstNoteTime,
				Note = "Other user note",
			}
		);

		await context.SaveChangesAsync();

		NoteDataRequestDto request = new(startTime, endTime, userId.ToString());
		IEnumerable<NoteData> result = await service.GetNotesAsync(request, userId);

		NoteData[] notes = result.ToArray();

		Assert.Equal(2, notes.Length);
		Assert.Equal("First note", notes[0].Note);
		Assert.Equal(firstNoteTime, notes[0].Time);
		Assert.Equal("Second note", notes[1].Note);
		Assert.Equal(secondNoteTime, notes[1].Time);
	}

	[Fact]
	public async Task GetNotesAsync_ReturnsEmpty_WhenNoNotesMatch()
	{
		await using var context = Fixture.CreateDbContext();
		var service = new NoteDataService(context);

		Guid userId = SeedIds.KariId;
		DateTimeOffset startTime = new(2026, 2, 12, 10, 0, 0, TimeSpan.Zero);
		DateTimeOffset endTime = new(2026, 2, 12, 12, 0, 0, TimeSpan.Zero);

		context.NoteData.Add(
			new NoteData
			{
				Id = Guid.NewGuid(),
				UserId = userId,
				Time = new DateTime(2026, 2, 12, 13, 0, 0, DateTimeKind.Utc),
				Note = "Outside range",
			}
		);
		await context.SaveChangesAsync();

		NoteDataRequestDto request = new(startTime, endTime, userId.ToString());
		IEnumerable<NoteData> result = await service.GetNotesAsync(request, userId);

		Assert.Empty(result);
	}

	[Fact]
	public async Task GetNotesAsync_ThrowsArgumentException_WhenRequestIsNotUtc()
	{
		await using var context = Fixture.CreateDbContext();
		var service = new NoteDataService(context);

		Guid userId = SeedIds.KariId;
		DateTimeOffset startTime = new(2026, 2, 12, 10, 0, 0, TimeSpan.FromHours(2));
		DateTimeOffset endTime = new(2026, 2, 12, 12, 0, 0, TimeSpan.Zero);
		NoteDataRequestDto request = new(startTime, endTime, userId.ToString());

		ArgumentException exception = await Assert.ThrowsAsync<ArgumentException>(() =>
			service.GetNotesAsync(request, userId)
		);

		Assert.Equal("Please provide time in UTC format", exception.Message);
	}

	[Fact]
	public async Task CreateNoteAsync_CreatesNote_WhenDataIsValid()
	{
		await using var context = Fixture.CreateDbContext();
		var service = new NoteDataService(context);

		Guid userId = SeedIds.KariId;
		DateTimeOffset noteTime = new(2026, 2, 12, 10, 30, 0, TimeSpan.Zero);
		NoteDataCreateDto createDto = new() { Time = noteTime, Note = "Created note" };

		NoteData createdNote = await service.CreateNoteAsync(createDto, userId);

		Assert.NotEqual(Guid.Empty, createdNote.Id);
		Assert.Equal(userId, createdNote.UserId);
		Assert.Equal(noteTime.UtcDateTime, createdNote.Time);
		Assert.Equal("Created note", createdNote.Note);

		NoteData? persistedNote = await context.NoteData.SingleOrDefaultAsync(note =>
			note.UserId == userId && note.Time == noteTime.UtcDateTime
		);

		Assert.NotNull(persistedNote);
		Assert.Equal(createdNote.Id, persistedNote!.Id);
	}

	[Fact]
	public async Task CreateNoteAsync_ThrowsInvalidOperationException_WhenNoteAlreadyExists()
	{
		await using var context = Fixture.CreateDbContext();
		var service = new NoteDataService(context);

		Guid userId = SeedIds.KariId;
		DateTimeOffset noteTime = new(2026, 2, 12, 10, 30, 0, TimeSpan.Zero);

		context.NoteData.Add(
			new NoteData
			{
				Id = Guid.NewGuid(),
				UserId = userId,
				Time = noteTime.UtcDateTime,
				Note = "Existing note",
			}
		);
		await context.SaveChangesAsync();

		NoteDataCreateDto createDto = new() { Time = noteTime, Note = "Created note" };

		InvalidOperationException exception = await Assert.ThrowsAsync<InvalidOperationException>(
			() =>
				service.CreateNoteAsync(createDto, userId)
		);

		Assert.Equal("A note with this time already exists", exception.Message);
	}

	[Fact]
	public async Task CreateNoteAsync_ThrowsArgumentException_WhenTimeIsNotUtc()
	{
		await using var context = Fixture.CreateDbContext();
		var service = new NoteDataService(context);

		Guid userId = SeedIds.KariId;
		NoteDataCreateDto createDto = new()
		{
			Time = new DateTimeOffset(2026, 2, 12, 10, 30, 0, TimeSpan.FromHours(2)),
			Note = "Created note",
		};

		ArgumentException exception = await Assert.ThrowsAsync<ArgumentException>(() =>
			service.CreateNoteAsync(createDto, userId)
		);

		Assert.Equal("Please provide time in UTC format", exception.Message);
	}

	[Fact]
	public async Task UpdateNoteAsync_UpdatesExistingNote_WhenDataIsValid()
	{
		await using var context = Fixture.CreateDbContext();
		var service = new NoteDataService(context);

		Guid userId = SeedIds.KariId;
		DateTimeOffset noteTime = new(2026, 2, 12, 10, 30, 0, TimeSpan.Zero);
		DateTime existingTime = noteTime.UtcDateTime;

		context.NoteData.Add(
			new NoteData
			{
				Id = Guid.NewGuid(),
				UserId = userId,
				Time = existingTime,
				Note = "Old note",
			}
		);
		await context.SaveChangesAsync();

		NoteDataDto updateDto = new() { Time = noteTime, Note = "Updated note" };

		NoteData updatedNote = await service.UpdateNoteAsync(updateDto);

		Assert.Equal(existingTime, updatedNote.Time);
		Assert.Equal("Updated note", updatedNote.Note);

		NoteData persistedNote = await context.NoteData.SingleAsync(note =>
			note.Time == existingTime
		);
		Assert.Equal("Updated note", persistedNote.Note);
	}

	[Fact]
	public async Task UpdateNoteAsync_ThrowsInvalidOperationException_WhenNoteDoesNotExist()
	{
		await using var context = Fixture.CreateDbContext();
		var service = new NoteDataService(context);

		NoteDataDto updateDto = new()
		{
			Time = new DateTimeOffset(2026, 2, 12, 10, 30, 0, TimeSpan.Zero),
			Note = "Updated note",
		};

		InvalidOperationException exception = await Assert.ThrowsAsync<InvalidOperationException>(
			() =>
				service.UpdateNoteAsync(updateDto)
		);

		Assert.Equal("This is not a note that exists", exception.Message);
	}

	[Fact]
	public async Task UpdateNoteAsync_ThrowsArgumentException_WhenTimeIsNotUtc()
	{
		await using var context = Fixture.CreateDbContext();
		var service = new NoteDataService(context);

		NoteDataDto updateDto = new()
		{
			Time = new DateTimeOffset(2026, 2, 12, 10, 30, 0, TimeSpan.FromHours(2)),
			Note = "Updated note",
		};

		ArgumentException exception = await Assert.ThrowsAsync<ArgumentException>(() =>
			service.UpdateNoteAsync(updateDto)
		);

		Assert.Equal("Please provide time in UTC format", exception.Message);
	}

	[Fact]
	public async Task DeleteNoteAsync_DeletesExistingNote_WhenDataIsValid()
	{
		await using var context = Fixture.CreateDbContext();
		var service = new NoteDataService(context);

		Guid userId = SeedIds.KariId;
		DateTimeOffset noteTime = new(2026, 2, 12, 10, 30, 0, TimeSpan.Zero);
		DateTime utcTime = noteTime.UtcDateTime;

		context.NoteData.Add(
			new NoteData
			{
				Id = Guid.NewGuid(),
				UserId = userId,
				Time = utcTime,
				Note = "Note to delete",
			}
		);
		await context.SaveChangesAsync();

		NoteData? deletedNote = await service.DeleteNoteAsync(noteTime, userId);

		Assert.NotNull(deletedNote);
		Assert.Equal("Note to delete", deletedNote!.Note);

		bool noteExists = await context.NoteData.AnyAsync(note =>
			note.Time == utcTime && note.UserId == userId
		);
		Assert.False(noteExists);
	}

	[Fact]
	public async Task DeleteNoteAsync_ReturnsNull_WhenNoteDoesNotExist()
	{
		await using var context = Fixture.CreateDbContext();
		var service = new NoteDataService(context);

		Guid userId = SeedIds.KariId;
		DateTimeOffset noteTime = new(2026, 2, 12, 10, 30, 0, TimeSpan.Zero);

		NoteData? deletedNote = await service.DeleteNoteAsync(noteTime, userId);

		Assert.Null(deletedNote);
	}

	[Fact]
	public async Task DeleteNoteAsync_ThrowsArgumentException_WhenTimeIsNotUtc()
	{
		await using var context = Fixture.CreateDbContext();
		var service = new NoteDataService(context);

		Guid userId = SeedIds.KariId;
		DateTimeOffset noteTime = new(2026, 2, 12, 10, 30, 0, TimeSpan.FromHours(2));

		ArgumentException exception = await Assert.ThrowsAsync<ArgumentException>(() =>
			service.DeleteNoteAsync(noteTime, userId)
		);

		Assert.Equal("Please provide time in UTC format", exception.Message);
	}
}
