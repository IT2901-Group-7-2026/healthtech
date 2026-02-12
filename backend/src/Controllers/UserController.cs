using Backend.DTOs;
using Backend.Models;
using Backend.Services;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Controllers;

[ApiController]
[Route("api/users")]
public class UserController(IUserService _userService, IUserStatusService _userStatusService)
    : ControllerBase
{
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

    [HttpGet("{managerId}/subordinates")]
    public async Task<ActionResult<IEnumerable<UserWithStatusDto>>> GetSubordinates(Guid managerId)
    {
        List<User> subordinates = await _userService.GetSubordinatesAsync(managerId);

        // Calculate danger level for each subordinate for the past hour
        IEnumerable<UserStatusDto> userStatuses = await _userStatusService.GetCurrentStatusForUsers(
            subordinates.Select(u => u.Id)
        );

        List<UserWithStatusDto> dtos = subordinates
            .Select(user =>
            {
                UserStatusDto? status = userStatuses.FirstOrDefault(s => s.UserId == user.Id);
                return UserWithStatusDto.FromEntity(
                    user,
                    status ?? new UserStatusDto { UserId = user.Id, Status = DangerLevel.Safe }
                );
            })
            .ToList();

        return dtos;
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
