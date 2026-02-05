using Microsoft.AspNetCore.Mvc;
using Backend.Services;
using Backend.DTOs;
using Backend.Models;

namespace Backend.Controllers;

[ApiController]
[Route("api/notes")]
public class NoteDataController(INoteDataService noteDataService) : ControllerBase
{
    private readonly INoteDataService _noteDataService = noteDataService;

    [HttpPost("{userId}")]
    public async Task<ActionResult<IEnumerable<NoteDataDto>>> GetNotesAsync([FromBody] NoteDataRequestDto request, [FromRoute] string userId)
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
    public async Task<ActionResult<string>> CreateNoteAsync([FromBody] NoteDataCreateDto createDto, [FromRoute] Guid userId)
    {
        try
        {
            var createdNote = await _noteDataService.CreateNoteAsync(createDto, userId);
            return Created($"/api/notes/{userId}", createdNote);
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
    public async Task<ActionResult<string>> UpdateNoteAsync([FromBody] NoteDataDto updateDto, [FromRoute] string userId)
    {
        try
        {
            var result = await _noteDataService.UpdateNoteAsync(updateDto);
            return Ok(result);
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