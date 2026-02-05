using System.ComponentModel.DataAnnotations;

namespace Backend.DTOs;

public class NoteDataResponseDto
{
    public required string Note { get; set; }
    public required DateTimeOffset Time { get; set; }
    public required UserDto User { get; set; }
}
