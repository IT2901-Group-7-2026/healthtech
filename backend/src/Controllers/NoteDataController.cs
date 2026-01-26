using Microsoft.AspNetCore.Mvc;
using Backend.Services;
using Backend.DTOs;

namespace Backend.Controllers;

[ApiController]
[Route("api/notes")]
public class NoteDataController(INoteDataService noteDataService) : ControllerBase
{
    private readonly INoteDataService _noteDataService = noteDataService;

    [HttpPost("{userId}")]
    public async Task<ActionResult<IEnumerable<NoteDataResponseDto>>> GetNotesAsync([FromBody] NoteDataRequestDto request, [FromRoute] string userId)
    {
        try
        {
            var notes = await _noteDataService.GetNotesAsync(request);
            return Ok(notes);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(ex.Message);
        }
    }


    [HttpPost("{userId}/create")]
    public async Task<ActionResult<string>> CreateNoteAsync([FromBody] NoteDataDto createDto, [FromRoute] string userId)
    {
        try
        {
            var createdNote = await _noteDataService.CreateNoteAsync(createDto);
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