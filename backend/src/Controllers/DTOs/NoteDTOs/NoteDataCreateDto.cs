using System.ComponentModel.DataAnnotations;

namespace Backend.DTOs;

public class NoteDataCreateDto
{
    [Required] public DateTimeOffset? Time { get; set; }
    [Required] public string Note { get; set; }
}
