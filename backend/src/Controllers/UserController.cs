using Backend.DTOs;
using Backend.Models;
using Backend.Services;
using Backend.Utils;
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
	public async Task<ActionResult<IEnumerable<UserWithStatusDto>>> GetSubordinates(
		Guid managerId,
		[FromQuery] DateTime? startTime,
		[FromQuery] DateTime? endTime
	)
	{
		List<User> subordinates = await _userService.GetSubordinatesAsync(managerId);

		// Default to current day if no time range is provided
		DateTime start = startTime ?? DateTime.UtcNow.Date;
		DateTime end = endTime ?? DateTime.UtcNow.Date.AddDays(1).AddTicks(-1);

		IEnumerable<UserStatusDto> userStatuses = await _userStatusService.GetStatusForUsersInRange(
			subordinates.Select(u => u.Id),
			start,
			end
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

	[HttpGet("{managerId}/subordinates/threshold-summary")]
	public async Task<
		ActionResult<Dictionary<string, SensorThresholdSummaryDto>>
	> GetSubordinatesThresholdStatus(
		Guid managerId,
		[FromQuery] DateTime? startTime,
		[FromQuery] DateTime? endTime
	)
	{
		List<User> subordinates = await _userService.GetSubordinatesAsync(managerId);
		if (subordinates.Count == 0)
		{
			return Ok(new Dictionary<string, SensorThresholdSummaryDto>());
		}

		var start = startTime ?? DateTime.UtcNow.Date;
		var end = endTime ?? DateTime.UtcNow.Date.AddDays(1).AddTicks(-1);

		IEnumerable<UserStatusDto> userStatuses = await _userStatusService.GetStatusForUsersInRange(
			subordinates.Select(u => u.Id),
			start,
			end
		);

		var summary = new Dictionary<string, SensorThresholdSummaryDto>(
			StringComparer.OrdinalIgnoreCase
		)
		{
			["noise"] = new SensorThresholdSummaryDto(),
			["dust"] = new SensorThresholdSummaryDto(),
			["vibration"] = new SensorThresholdSummaryDto(),
			["total"] = new SensorThresholdSummaryDto(),
		};

		// Helper function to safely increment the correct bucket
		void IncrementBucket(SensorThresholdSummaryDto counts, DangerLevel? level)
		{
			switch (level)
			{
				case DangerLevel.Safe:
					counts.Safe++;
					break;
				case DangerLevel.Warning:
					counts.Warning++;
					break;
				case DangerLevel.Danger:
					counts.Danger++;
					break;
			}
		}

		foreach (var status in userStatuses)
		{
			IncrementBucket(summary["noise"], status.Noise?.dangerLevel);
			IncrementBucket(summary["dust"], status.Dust?.dangerLevel);
			IncrementBucket(summary["vibration"], status.Vibration?.dangerLevel);

			var highest = ThresholdUtils.GetHighestDangerLevel(
				status.Noise?.dangerLevel,
				status.Dust?.dangerLevel,
				status.Vibration?.dangerLevel
			);

			IncrementBucket(summary["total"], highest);
		}

		return Ok(summary);
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

	[HttpPut("{managerId}/subordinates/delete")]
	public async Task<ActionResult<UserDto>> DeleteSubordinates(
		Guid managerId,
		List<Guid> subordinateIds
	)
	{
		List<User> subordinates = await _userService.GetSubordinatesAsync(managerId);
		List<Guid> remainingSubordinateIds = subordinates
			.Select(s => s.Id)
			.Where(id => !subordinateIds.Contains(id))
			.ToList();

		User? user = await _userService.UpdateSubordinatesAsync(managerId, remainingSubordinateIds);
		if (user == null)
		{
			return NotFound();
		}

		return UserDto.FromEntity(user);
	}

	[HttpPut("{managerId}/subordinates/create")]
	public async Task<ActionResult<UserDto>> CreateSubordinates(
		Guid managerId,
		List<Guid> subordinateIds
	)
	{
		List<User> subordinates = await _userService.GetSubordinatesAsync(managerId);
		List<Guid> newSubordinateIdList = subordinates
			.Select(s => s.Id)
			.Concat(subordinateIds)
			.ToList();

		User? user = await _userService.UpdateSubordinatesAsync(managerId, newSubordinateIdList);
		if (user == null)
		{
			return NotFound();
		}

		return UserDto.FromEntity(user);
	}
}
