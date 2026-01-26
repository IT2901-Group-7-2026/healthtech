using System.ComponentModel.DataAnnotations;

namespace Backend.DTOs;

public record NoteDataDto(
    [Required] DateTimeOffset? Time,
    [Required] string Note
);