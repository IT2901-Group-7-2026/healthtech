using Backend.DTOs;
using Backend.Models;
using Backend.Services;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Controllers;

[ApiController]
[Route("api/notes")]
public class NoteDataController(INoteDataService noteDataService) : ControllerBase
{
    private readonly INoteDataService _noteDataService = noteDataService;

    [HttpPost("{userId}")]
    public async Task<ActionResult<IEnumerable<NoteDataDto>>> GetNotesAsync(
        [FromBody] NoteDataRequestDto request,
        [FromRoute] string userId
    )
    {
        try
        {
            IEnumerable<NoteData> notes = await _noteDataService.GetNotesAsync(request);
            var dtos = notes.Select(NoteDataDto.FromEntity).ToList();

            return dtos;
        }
        catch (ArgumentException ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpPost("{userId}/create")]
    public async Task<ActionResult<NoteDataDto>> CreateNoteAsync(
        [FromBody] NoteDataCreateDto createDto,
        [FromRoute] Guid userId
    )
    {
        try
        {
            var createdNote = await _noteDataService.CreateNoteAsync(createDto, userId);
            var dto = NoteDataDto.FromEntity(createdNote);
            return dto;
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpPut("{userId}")]
    public async Task<ActionResult<NoteDataDto>> UpdateNoteAsync(
        [FromBody] NoteDataDto updateDto,
        [FromRoute] Guid userId
    )
    {
        try
        {
            var result = await _noteDataService.UpdateNoteAsync(updateDto);
            var dto = NoteDataDto.FromEntity(result);
            return dto;
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(ex.Message);
        }
    }
}
