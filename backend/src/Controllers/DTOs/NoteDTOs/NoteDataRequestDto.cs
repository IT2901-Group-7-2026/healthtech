using System.ComponentModel.DataAnnotations;

namespace Backend.DTOs;

public record NoteDataRequestDto(
	DateTimeOffset? StartTime,
	DateTimeOffset? EndTime,
	string? UserId
);
