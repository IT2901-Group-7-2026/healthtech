using System.ComponentModel.DataAnnotations;

namespace Backend.DTOs;

public record NoteDataRequestDto(
    [Required] DateTimeOffset? StartTime,
    [Required] DateTimeOffset? EndTime
);