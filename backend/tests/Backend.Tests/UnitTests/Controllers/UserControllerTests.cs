using Backend.Controllers;
using Backend.DTOs;
using Backend.Models;
using Backend.Services;
using Microsoft.AspNetCore.Mvc;
using Moq;

namespace Backend.Tests.UnitTests.Controllers;

public class UserControllerTests
{
	private readonly Mock<IUserService> _mockUserService;
	private readonly Mock<IUserStatusService> _mockUserStatusService;
	private readonly UserController _controller;

	public UserControllerTests()
	{
		_mockUserService = new Mock<IUserService>();
		_mockUserStatusService = new Mock<IUserStatusService>();
		_controller = new UserController(_mockUserService.Object, _mockUserStatusService.Object);
	}

	private readonly Location MockLocation = new()
	{
		Id = Guid.Parse("b7c814ea-47c2-4b11-9841-38d9c429a8be"), // Random GUID
		Latitude = 63.787778f, // Coordinates for Aker Solutions Verdal "The Yard"
		Longitude = 11.440556f,
		Country = "Norway",
		Region = "Trøndelag",
		City = "Verdal",
		Site = "The Yard",
		Building = "A2",
		Users = [],
	};

	[Fact]
	public async Task GetAllUsers_ReturnsEmptyList_WhenNoUsers()
	{
		// Arrange
		_mockUserService
			.Setup(service => service.GetAllUsersAsync())
			.ReturnsAsync(new List<User>());

		// Act
		var result = await _controller.GetAllUsers();

		// Assert
		var users = Assert.IsAssignableFrom<IEnumerable<UserDto>>(result.Value);
		Assert.Empty(users);
	}

	[Fact]
	public async Task GetAllUsers_ReturnsMappedUsers_WhenUsersExist()
	{
		// Arrange
		var users = new List<User>
		{
			CreateUser(Guid.NewGuid(), "Alice Operator", "alice@example.com", UserRole.Operator),
			CreateUser(Guid.NewGuid(), "Bob Foreman", "bob@example.com", UserRole.Foreman),
		};

		_mockUserService.Setup(service => service.GetAllUsersAsync()).ReturnsAsync(users);

		// Act
		var result = await _controller.GetAllUsers();

		// Assert
		var data = Assert.IsAssignableFrom<IEnumerable<UserDto>>(result.Value).ToList();
		Assert.Equal(2, data.Count);
		Assert.Equal("Alice Operator", data[0].Name);
		Assert.Equal("Bob Foreman", data[1].Name);
	}

	[Fact]
	public async Task GetUserById_ReturnsNotFound_WhenUserDoesNotExist()
	{
		// Arrange
		var userId = Guid.NewGuid();
		_mockUserService
			.Setup(service => service.GetUserByIdAsync(userId))
			.ReturnsAsync((User?)null);

		// Act
		var result = await _controller.GetUserById(userId);

		// Assert
		Assert.IsType<NotFoundResult>(result.Result);
	}

	[Fact]
	public async Task GetUserById_ReturnsUser_WhenUserExists()
	{
		// Arrange
		var userId = Guid.NewGuid();
		var user = CreateUser(userId, "Kari Nordmann", "kari@example.com", UserRole.Operator);

		_mockUserService.Setup(service => service.GetUserByIdAsync(userId)).ReturnsAsync(user);

		// Act
		var result = await _controller.GetUserById(userId);

		// Assert
		var dto = Assert.IsType<UserDto>(result.Value);
		Assert.Equal(userId, dto.Id);
		Assert.Equal("Kari Nordmann", dto.Name);
		Assert.Equal("kari@example.com", dto.Email);
	}

	[Fact]
	public async Task CreateUser_ReturnsCreatedUser_WhenDataIsValid()
	{
		// Arrange
		var createUserDto = new CreateUserDto(
			Name: "testuser",
			Email: "test@example.com",
			Password: "password123",
			LocationId: MockLocation.Id,
			ManagerIds: [],
			Role: UserRole.Operator,
			JobDescription: "Welder"
		);

		var expectedUser = new User
		{
			Id = Guid.NewGuid(),
			Name = createUserDto.Name,
			Email = createUserDto.Email,
			PasswordHash = "hashed",
			CreatedAt = DateTime.UtcNow,
			Role = createUserDto.Role,
			LocationId = createUserDto.LocationId,
			Location = MockLocation,
			JobDescription = createUserDto.JobDescription,
			Managers = [],
			Subordinates = [],
		};

		_mockUserService
			.Setup(service => service.CreateUserAsync(createUserDto))
			.ReturnsAsync(expectedUser);

		// Act
		var result = await _controller.CreateUser(createUserDto);

		// Assert
		var userResponse = Assert.IsType<UserDto>(result.Value);
		Assert.Equal(expectedUser.Name, userResponse.Name);
		Assert.Equal(expectedUser.Email, userResponse.Email);
	}

	[Fact]
	public async Task UpdateUser_ReturnsNotFound_WhenUserDoesNotExist()
	{
		// Arrange
		var userId = Guid.NewGuid();
		var updateUserDto = new UpdateUserDto(Name: "updateduser", Email: "updated@example.com");

		_mockUserService
			.Setup(service => service.UpdateUserAsync(userId, updateUserDto))
			.ReturnsAsync((User?)null);

		// Act
		var result = await _controller.UpdateUser(userId, updateUserDto);

		// Assert
		Assert.IsType<NotFoundResult>(result.Result);
	}

	[Fact]
	public async Task UpdateUser_ReturnsUpdatedUser_WhenUserExists()
	{
		// Arrange
		var userId = Guid.NewGuid();
		var updateUserDto = new UpdateUserDto(Name: "updateduser", Email: "updated@example.com");
		var updatedUser = CreateUser(
			userId,
			"updateduser",
			"updated@example.com",
			UserRole.Operator
		);

		_mockUserService
			.Setup(service => service.UpdateUserAsync(userId, updateUserDto))
			.ReturnsAsync(updatedUser);

		// Act
		var result = await _controller.UpdateUser(userId, updateUserDto);

		// Assert
		var dto = Assert.IsType<UserDto>(result.Value);
		Assert.Equal("updateduser", dto.Name);
		Assert.Equal("updated@example.com", dto.Email);
	}

	[Fact]
	public async Task DeleteUser_ReturnsNoContent_WhenDeleteSucceeds()
	{
		// Arrange
		var userId = Guid.NewGuid();
		_mockUserService.Setup(service => service.DeleteUserAsync(userId)).ReturnsAsync(true);

		// Act
		var result = await _controller.DeleteUser(userId);

		// Assert
		Assert.IsType<NoContentResult>(result);
	}

	[Fact]
	public async Task DeleteUser_ReturnsNotFound_WhenDeleteFails()
	{
		// Arrange
		var userId = Guid.NewGuid();
		_mockUserService.Setup(service => service.DeleteUserAsync(userId)).ReturnsAsync(false);

		// Act
		var result = await _controller.DeleteUser(userId);

		// Assert
		Assert.IsType<NotFoundResult>(result);
	}

	[Fact]
	public async Task GetSubordinates_ReturnsMappedSubordinatesWithStatuses_WhenStatusExists()
	{
		// Arrange
		var managerId = Guid.NewGuid();
		var startTime = new DateTime(2026, 2, 12, 10, 0, 0, DateTimeKind.Utc);
		var endTime = new DateTime(2026, 2, 12, 12, 0, 0, DateTimeKind.Utc);

		var subordinateA = CreateUser(
			Guid.NewGuid(),
			"Sub A",
			"suba@example.com",
			UserRole.Operator
		);
		var subordinateB = CreateUser(
			Guid.NewGuid(),
			"Sub B",
			"subb@example.com",
			UserRole.Operator
		);

		_mockUserService
			.Setup(service => service.GetSubordinatesAsync(managerId))
			.ReturnsAsync(new List<User> { subordinateA, subordinateB });

		var statuses = new List<UserStatusDto>
		{
			new() { UserId = subordinateA.Id, Status = DangerLevel.Warning },
			new() { UserId = subordinateB.Id, Status = DangerLevel.Danger },
		};

		_mockUserStatusService
			.Setup(service =>
				service.GetStatusForUsersInRange(
					It.Is<IEnumerable<Guid>>(ids =>
						ids.SequenceEqual(new[] { subordinateA.Id, subordinateB.Id })
					),
					startTime,
					endTime
				)
			)
			.ReturnsAsync(statuses);

		// Act
		var result = await _controller.GetSubordinates(managerId, startTime, endTime);

		// Assert
		var data = Assert.IsAssignableFrom<IEnumerable<UserWithStatusDto>>(result.Value).ToList();
		Assert.Equal(2, data.Count);
		Assert.Equal(DangerLevel.Warning, data[0].Status.Status);
		Assert.Equal(DangerLevel.Danger, data[1].Status.Status);
	}

	[Fact]
	public async Task GetSubordinates_ReturnsSafeStatus_WhenStatusMissingForUser()
	{
		// Arrange
		var managerId = Guid.NewGuid();
		var startTime = new DateTime(2026, 2, 12, 10, 0, 0, DateTimeKind.Utc);
		var endTime = new DateTime(2026, 2, 12, 12, 0, 0, DateTimeKind.Utc);

		var subordinate = CreateUser(
			Guid.NewGuid(),
			"Sub A",
			"suba@example.com",
			UserRole.Operator
		);

		_mockUserService
			.Setup(service => service.GetSubordinatesAsync(managerId))
			.ReturnsAsync(new List<User> { subordinate });

		_mockUserStatusService
			.Setup(service =>
				service.GetStatusForUsersInRange(It.IsAny<IEnumerable<Guid>>(), startTime, endTime)
			)
			.ReturnsAsync(new List<UserStatusDto>());

		// Act
		var result = await _controller.GetSubordinates(managerId, startTime, endTime);

		// Assert
		var dto = Assert.Single(
			Assert.IsAssignableFrom<IEnumerable<UserWithStatusDto>>(result.Value)
		);
		Assert.Equal(subordinate.Id, dto.Id);
		Assert.Equal(DangerLevel.Safe, dto.Status.Status);
	}

	[Fact]
	public async Task GetSubordinatesThresholdStatus_ReturnsEmptyDictionary_WhenNoSubordinates()
	{
		// Arrange
		var managerId = Guid.NewGuid();
		_mockUserService
			.Setup(service => service.GetSubordinatesAsync(managerId))
			.ReturnsAsync(new List<User>());

		// Act
		var result = await _controller.GetSubordinatesThresholdStatus(managerId, null, null);

		// Assert
		var ok = Assert.IsType<OkObjectResult>(result.Result);
		var summary = Assert.IsType<Dictionary<string, ExposureThresholdSummaryDto>>(ok.Value);
		Assert.Empty(summary);
	}

	[Fact]
	public async Task GetSubordinatesThresholdStatus_ReturnsAggregatedCounts_WhenStatusesExist()
	{
		// Arrange
		var managerId = Guid.NewGuid();
		var startTime = new DateTime(2026, 2, 12, 10, 0, 0, DateTimeKind.Utc);
		var endTime = new DateTime(2026, 2, 12, 12, 0, 0, DateTimeKind.Utc);

		var subordinateA = CreateUser(
			Guid.NewGuid(),
			"Sub A",
			"suba@example.com",
			UserRole.Operator
		);
		var subordinateB = CreateUser(
			Guid.NewGuid(),
			"Sub B",
			"subb@example.com",
			UserRole.Operator
		);

		_mockUserService
			.Setup(service => service.GetSubordinatesAsync(managerId))
			.ReturnsAsync(new List<User> { subordinateA, subordinateB });

		var statuses = new List<UserStatusDto>
		{
			new()
			{
				UserId = subordinateA.Id,
				Status = DangerLevel.Warning,
				Noise = new UserExposureStatusDto(DangerLevel.Safe, null, 70, null),
				Dust = new UserExposureStatusDto(DangerLevel.Warning, null, 25, null),
				Vibration = new UserExposureStatusDto(DangerLevel.Safe, null, 10, null),
			},
			new()
			{
				UserId = subordinateB.Id,
				Status = DangerLevel.Danger,
				Noise = new UserExposureStatusDto(DangerLevel.Danger, null, 95, null),
				Dust = null,
				Vibration = new UserExposureStatusDto(DangerLevel.Warning, null, 250, null),
			},
		};

		_mockUserStatusService
			.Setup(service =>
				service.GetStatusForUsersInRange(
					It.Is<IEnumerable<Guid>>(ids =>
						ids.SequenceEqual(new[] { subordinateA.Id, subordinateB.Id })
					),
					startTime,
					endTime
				)
			)
			.ReturnsAsync(statuses);

		// Act
		var result = await _controller.GetSubordinatesThresholdStatus(
			managerId,
			startTime,
			endTime
		);

		// Assert
		var ok = Assert.IsType<OkObjectResult>(result.Result);
		var summary = Assert.IsType<Dictionary<string, ExposureThresholdSummaryDto>>(ok.Value);

		Assert.Equal(4, summary.Count);

		Assert.Equal(1, summary["noise"].Safe);
		Assert.Equal(0, summary["noise"].Warning);
		Assert.Equal(1, summary["noise"].Danger);

		Assert.Equal(0, summary["dust"].Safe);
		Assert.Equal(1, summary["dust"].Warning);
		Assert.Equal(0, summary["dust"].Danger);

		Assert.Equal(1, summary["vibration"].Safe);
		Assert.Equal(1, summary["vibration"].Warning);
		Assert.Equal(0, summary["vibration"].Danger);

		Assert.Equal(0, summary["total"].Safe);
		Assert.Equal(1, summary["total"].Warning);
		Assert.Equal(1, summary["total"].Danger);
	}

	[Fact]
	public async Task DeleteSubordinates_ReturnsUpdatedUser_WhenManagerExists()
	{
		// Arrange
		var managerId = Guid.NewGuid();
		var subordinateAId = Guid.NewGuid();
		var subordinateBId = Guid.NewGuid();
		var subordinateToDeleteId = subordinateAId;

		var manager = CreateUser(managerId, "Manager", "manager@example.com", UserRole.Foreman);

		var currentSubordinates = new List<User>
		{
			CreateUser(subordinateAId, "Sub A", "suba@example.com", UserRole.Operator),
			CreateUser(subordinateBId, "Sub B", "subb@example.com", UserRole.Operator),
		};

		_mockUserService
			.Setup(service => service.GetSubordinatesAsync(managerId))
			.ReturnsAsync(currentSubordinates);

		_mockUserService
			.Setup(service =>
				service.UpdateSubordinatesAsync(
					managerId,
					It.Is<List<Guid>>(ids => ids.Count == 1 && ids[0] == subordinateBId)
				)
			)
			.ReturnsAsync(manager);

		// Act
		var result = await _controller.DeleteSubordinates(
			managerId,
			new List<Guid> { subordinateToDeleteId }
		);

		// Assert
		var dto = Assert.IsType<UserDto>(result.Value);
		Assert.Equal(managerId, dto.Id);
	}

	[Fact]
	public async Task DeleteSubordinates_ReturnsNotFound_WhenUpdateFails()
	{
		// Arrange
		var managerId = Guid.NewGuid();
		var subordinateId = Guid.NewGuid();

		_mockUserService
			.Setup(service => service.GetSubordinatesAsync(managerId))
			.ReturnsAsync(
				new List<User>
				{
					CreateUser(subordinateId, "Sub A", "suba@example.com", UserRole.Operator),
				}
			);

		_mockUserService
			.Setup(service => service.UpdateSubordinatesAsync(managerId, It.IsAny<List<Guid>>()))
			.ReturnsAsync((User?)null);

		// Act
		var result = await _controller.DeleteSubordinates(
			managerId,
			new List<Guid> { subordinateId }
		);

		// Assert
		Assert.IsType<NotFoundResult>(result.Result);
	}

	[Fact]
	public async Task CreateSubordinates_ReturnsUpdatedUser_WhenManagerExists()
	{
		// Arrange
		var managerId = Guid.NewGuid();
		var existingSubordinateId = Guid.NewGuid();
		var newSubordinateId = Guid.NewGuid();

		var manager = CreateUser(managerId, "Manager", "manager@example.com", UserRole.Foreman);

		_mockUserService
			.Setup(service => service.GetSubordinatesAsync(managerId))
			.ReturnsAsync(
				new List<User>
				{
					CreateUser(
						existingSubordinateId,
						"Sub Existing",
						"subexisting@example.com",
						UserRole.Operator
					),
				}
			);

		_mockUserService
			.Setup(service =>
				service.UpdateSubordinatesAsync(
					managerId,
					It.Is<List<Guid>>(ids =>
						ids.Count == 2
						&& ids[0] == existingSubordinateId
						&& ids[1] == newSubordinateId
					)
				)
			)
			.ReturnsAsync(manager);

		// Act
		var result = await _controller.CreateSubordinates(
			managerId,
			new List<Guid> { newSubordinateId }
		);

		// Assert
		var dto = Assert.IsType<UserDto>(result.Value);
		Assert.Equal(managerId, dto.Id);
	}

	[Fact]
	public async Task CreateSubordinates_ReturnsNotFound_WhenUpdateFails()
	{
		// Arrange
		var managerId = Guid.NewGuid();
		var newSubordinateId = Guid.NewGuid();

		_mockUserService
			.Setup(service => service.GetSubordinatesAsync(managerId))
			.ReturnsAsync(new List<User>());

		_mockUserService
			.Setup(service => service.UpdateSubordinatesAsync(managerId, It.IsAny<List<Guid>>()))
			.ReturnsAsync((User?)null);

		// Act
		var result = await _controller.CreateSubordinates(
			managerId,
			new List<Guid> { newSubordinateId }
		);

		// Assert
		Assert.IsType<NotFoundResult>(result.Result);
	}

	private User CreateUser(Guid id, string name, string email, UserRole role)
	{
		return new User
		{
			Id = id,
			Name = name,
			Email = email,
			PasswordHash = "hashed",
			CreatedAt = DateTime.UtcNow,
			Role = role,
			LocationId = MockLocation.Id,
			Location = MockLocation,
			Managers = [],
			Subordinates = [],
		};
	}
}
