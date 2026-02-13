using System.ComponentModel.DataAnnotations;
using Backend.Models;

namespace Backend.DTOs;

public class NoteDataDto
{
	[Required]
	public DateTimeOffset? Time { get; set; }

	[Required]
	public string Note { get; set; }

	public static NoteDataDto FromEntity(NoteData noteData) =>
		new NoteDataDto { Time = noteData.Time, Note = noteData.Note };
}
