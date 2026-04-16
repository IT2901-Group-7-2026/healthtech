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
}
