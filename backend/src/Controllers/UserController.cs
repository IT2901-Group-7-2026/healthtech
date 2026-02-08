using Backend.DTOs;
using Backend.Models;
using Backend.Services;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Controllers;

[ApiController]
[Route("api/users")]
public class UserController : ControllerBase
{
    private readonly IUserService _userService;

    public UserController(IUserService userService)
    {
        _userService = userService;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<UserDto>>> GetAllUsers()
    {
        List<User> users = await _userService.GetAllUsersAsync();
        List<UserDto> dtos = users.Select(UserDto.FromEntity).ToList();

        return dtos;
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<UserDto>> GetUserById(Guid id)
    {
        User? user = await _userService.GetUserByIdAsync(id);
        if (user == null)
        {
            return NotFound();
        }

        return UserDto.FromEntity(user);
    }

    [HttpPost]
    public async Task<ActionResult<UserDto>> CreateUser(CreateUserDto createUserDto)
    {
        User user = await _userService.CreateUserAsync(createUserDto);

        return UserDto.FromEntity(user);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<UserDto>> UpdateUser(Guid id, UpdateUserDto updateUserDto)
    {
        User? user = await _userService.UpdateUserAsync(id, updateUserDto);
        if (user == null)
        {
            return NotFound();
        }

        return UserDto.FromEntity(user);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteUser(Guid id)
    {
        bool success = await _userService.DeleteUserAsync(id);
        if (!success)
        {
            return NotFound();
        }

        return NoContent();
    }
}
