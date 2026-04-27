using Backend.Controllers;
using Backend.DTOs;
using Backend.Models;
using Backend.Services;
using Microsoft.AspNetCore.Mvc;
using Moq;

namespace Backend.Tests.UnitTests.Controllers;

public class NoteDataControllerTests
{
	private readonly Mock<INoteDataService> _mockService;
	private readonly NoteDataController _controller;

	public NoteDataControllerTests()
	{
		_mockService = new Mock<INoteDataService>();
		_controller = new NoteDataController(_mockService.Object);
	}

	[Fact]
	public async Task GetNotesAsync_ReturnsDtos_WhenNotesExist()
	{
		NoteData note1 = new NoteData
		{
			Id = Guid.NewGuid(),
			Note = "Note 1",
			Time = DateTime.Parse("2026-02-12T10:12:31+00:00"),
			UserId = Guid.NewGuid(),
		};

		NoteData note2 = new NoteData
		{
			Id = Guid.NewGuid(),
			Note = "Note 2",
			Time = DateTime.Parse("2026-02-13T11:15:45+00:00"),
			UserId = note1.UserId,
		};

		// Arrange
		var userId = Guid.NewGuid();
		var request = new NoteDataRequestDto(note1.Time, note2.Time.AddHours(1), null);

		var notes = new List<NoteData> { note1, note2 };

		_mockService.Setup(service => service.GetNotesAsync(request, userId)).ReturnsAsync(notes);

		// Act
		var result = await _controller.GetNotesAsync(request, userId);

		// Assert
		var data = Assert.IsAssignableFrom<IEnumerable<NoteDataDto>>(result.Value);
		Assert.Equal(2, data.Count());
		Assert.Equal(note1.Note, data.First().Note);
	}

	[Fact]
	public async Task GetNotesAsync_ReturnsBadRequest_WhenServiceThrowsArgumentException()
	{
		// Arrange
		var userId = Guid.NewGuid();
		var startTime = DateTimeOffset.Parse("2026-02-12T10:12:31+00:00");
		var endTime = DateTimeOffset.Parse("2026-02-25T16:14:10+00:00");
		var request = new NoteDataRequestDto(startTime, endTime, null);

		_mockService
			.Setup(service => service.GetNotesAsync(request, userId))
			.ThrowsAsync(new ArgumentException("Please provide time in UTC format"));

		// Act
		var result = await _controller.GetNotesAsync(request, userId);

		// Assert
		var badRequest = Assert.IsType<BadRequestObjectResult>(result.Result);
		Assert.Equal(400, badRequest.StatusCode);
		Assert.Equal("Please provide time in UTC format", badRequest.Value);
	}

	[Fact]
	public async Task CreateNoteAsync_ReturnsDto_WhenCreateSucceeds()
	{
		// Arrange
		var userId = Guid.NewGuid();
		var noteTime = DateTimeOffset.Parse("2026-02-12T10:12:31+00:00");
		var createDto = new NoteDataCreateDto { Time = noteTime, Note = "New note" };

		var createdNote = new NoteData
		{
			Id = Guid.NewGuid(),
			Time = noteTime.UtcDateTime,
			Note = createDto.Note,
			UserId = userId,
		};

		_mockService
			.Setup(service => service.CreateNoteAsync(createDto, userId))
			.ReturnsAsync(createdNote);

		// Act
		var result = await _controller.CreateNoteAsync(createDto, userId);

		// Assert
		var dto = Assert.IsType<NoteDataDto>(result.Value);
		Assert.Equal("New note", dto.Note);
		Assert.Equal(noteTime, dto.Time);
	}

	[Fact]
	public async Task CreateNoteAsync_ReturnsBadRequest_WhenServiceThrowsInvalidOperationException()
	{
		// Arrange
		var userId = Guid.NewGuid();
		var noteTime = DateTimeOffset.Parse("2026-02-12T10:12:31+00:00");
		var createDto = new NoteDataCreateDto { Time = noteTime, Note = "New note" };

		_mockService
			.Setup(service => service.CreateNoteAsync(createDto, userId))
			.ThrowsAsync(new InvalidOperationException("A note with this time already exists"));

		// Act
		var result = await _controller.CreateNoteAsync(createDto, userId);

		// Assert
		var badRequest = Assert.IsType<BadRequestObjectResult>(result.Result);
		Assert.Equal(400, badRequest.StatusCode);
		Assert.Equal("A note with this time already exists", badRequest.Value);
	}

	[Fact]
	public async Task CreateNoteAsync_ReturnsBadRequest_WhenServiceThrowsArgumentException()
	{
		// Arrange
		var userId = Guid.NewGuid();
		var noteTime = DateTimeOffset.Parse("2026-02-12T10:12:31+00:00");
		var createDto = new NoteDataCreateDto { Time = noteTime, Note = "New note" };

		_mockService
			.Setup(service => service.CreateNoteAsync(createDto, userId))
			.ThrowsAsync(new ArgumentException("Please provide time in UTC format"));

		// Act
		var result = await _controller.CreateNoteAsync(createDto, userId);

		// Assert
		var badRequest = Assert.IsType<BadRequestObjectResult>(result.Result);
		Assert.Equal(400, badRequest.StatusCode);
		Assert.Equal("Please provide time in UTC format", badRequest.Value);
	}

	[Fact]
	public async Task UpdateNoteAsync_ReturnsDto_WhenUpdateSucceeds()
	{
		// Arrange
		var userId = Guid.NewGuid();
		var noteTime = DateTimeOffset.Parse("2026-02-12T10:12:31+00:00");
		var updateDto = new NoteDataDto { Time = noteTime, Note = "Updated note" };

		var updatedNote = new NoteData
		{
			Id = Guid.NewGuid(),
			Time = noteTime.UtcDateTime,
			Note = updateDto.Note,
			UserId = userId,
		};

		_mockService.Setup(service => service.UpdateNoteAsync(updateDto)).ReturnsAsync(updatedNote);

		// Act
		var result = await _controller.UpdateNoteAsync(updateDto, userId);

		// Assert
		var dto = Assert.IsType<NoteDataDto>(result.Value);
		Assert.Equal("Updated note", dto.Note);
		Assert.Equal(noteTime, dto.Time);
	}

	[Fact]
	public async Task UpdateNoteAsync_ReturnsBadRequest_WhenServiceThrowsInvalidOperationException()
	{
		// Arrange
		var userId = Guid.NewGuid();
		var noteTime = DateTimeOffset.Parse("2026-02-12T10:12:31+00:00");
		var updateDto = new NoteDataDto { Time = noteTime, Note = "Updated note" };

		_mockService
			.Setup(service => service.UpdateNoteAsync(updateDto))
			.ThrowsAsync(new InvalidOperationException("This is not a note that exists"));

		// Act
		var result = await _controller.UpdateNoteAsync(updateDto, userId);

		// Assert
		var badRequest = Assert.IsType<BadRequestObjectResult>(result.Result);
		Assert.Equal(400, badRequest.StatusCode);
		Assert.Equal("This is not a note that exists", badRequest.Value);
	}

	[Fact]
	public async Task UpdateNoteAsync_ReturnsBadRequest_WhenServiceThrowsArgumentException()
	{
		// Arrange
		var userId = Guid.NewGuid();
		var noteTime = DateTimeOffset.Parse("2026-02-12T10:12:31+00:00");
		var updateDto = new NoteDataDto { Time = noteTime, Note = "Updated note" };

		_mockService
			.Setup(service => service.UpdateNoteAsync(updateDto))
			.ThrowsAsync(new ArgumentException("Please provide time in UTC format"));

		// Act
		var result = await _controller.UpdateNoteAsync(updateDto, userId);

		// Assert
		var badRequest = Assert.IsType<BadRequestObjectResult>(result.Result);
		Assert.Equal(400, badRequest.StatusCode);
		Assert.Equal("Please provide time in UTC format", badRequest.Value);
	}

	[Fact]
	public async Task DeleteNoteAsync_ReturnsDto_WhenDeleteSucceeds()
	{
		// Arrange
		var userId = Guid.NewGuid();
		var deletedTime = DateTimeOffset.Parse("2026-02-12T10:12:31+00:00");

		var deletedNote = new NoteData
		{
			Id = Guid.NewGuid(),
			Time = deletedTime.UtcDateTime,
			Note = "Deleted note",
			UserId = userId,
		};

		_mockService
			.Setup(service => service.DeleteNoteAsync(deletedTime, userId))
			.ReturnsAsync(deletedNote);

		// Act
		var result = await _controller.DeleteNoteAsync(deletedTime, userId);

		// Assert
		var dto = Assert.IsType<NoteDataDto>(result.Value);
		Assert.Equal("Deleted note", dto.Note);
		Assert.Equal(deletedTime, dto.Time);
	}

	[Fact]
	public async Task DeleteNoteAsync_ReturnsNotFound_WhenNoteDoesNotExist()
	{
		// Arrange
		var userId = Guid.NewGuid();
		var deletedTime = DateTimeOffset.Parse("2026-02-12T10:12:31+00:00");

		_mockService
			.Setup(service => service.DeleteNoteAsync(deletedTime, userId))
			.ReturnsAsync((NoteData?)null);

		// Act
		var result = await _controller.DeleteNoteAsync(deletedTime, userId);

		// Assert
		var notFound = Assert.IsType<NotFoundObjectResult>(result.Result);
		Assert.Equal(404, notFound.StatusCode);
		Assert.Equal("Note not found", notFound.Value);
	}

	[Fact]
	public async Task DeleteNoteAsync_ReturnsBadRequest_WhenServiceThrowsArgumentException()
	{
		// Arrange
		var userId = Guid.NewGuid();
		var deletedTime = DateTimeOffset.Parse("2026-02-12T10:12:31+00:00");

		_mockService
			.Setup(service => service.DeleteNoteAsync(deletedTime, userId))
			.ThrowsAsync(new ArgumentException("Please provide time in UTC format"));

		// Act
		var result = await _controller.DeleteNoteAsync(deletedTime, userId);

		// Assert
		var badRequest = Assert.IsType<BadRequestObjectResult>(result.Result);
		Assert.Equal(400, badRequest.StatusCode);
		Assert.Equal("Please provide time in UTC format", badRequest.Value);
	}
}
