using Backend.DTOs;
using Backend.Services;
using Microsoft.AspNetCore.Mvc;
using Moq;
using Backend.Controllers;
using Backend.Models;

namespace Backend.Tests.UnitTests.Controllers;

public class UserControllerTests
{
    [Fact]
    public async Task GetAllUsers_ReturnsEmptyList_WhenNoUsers()
    {
        // Arrange
        var mockService = new Mock<IUserService>();
        mockService.Setup(service => service.GetAllUsersAsync())
                   .ReturnsAsync(new List<User>());

        var controller = new UserController(mockService.Object);

        // Act
        var result = await controller.GetAllUsers();

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var users = Assert.IsAssignableFrom<IEnumerable<User>>(okResult.Value);
        Assert.Empty(users);
    }

    [Fact]
    public async Task GetUserById_ReturnsNotFound_WhenUserDoesNotExist()
    {
        // Arrange
        var mockService = new Mock<IUserService>();
        var userId = Guid.NewGuid();
        mockService.Setup(service => service.GetUserByIdAsync(userId))
                   .ReturnsAsync((User?)null);

        var controller = new UserController(mockService.Object);

        // Act
        var result = await controller.GetUserById(userId);

        // Assert
        Assert.IsType<NotFoundResult>(result.Result);
    }

    [Fact]
    public async Task CreateUser_ReturnsCreatedUser_WhenDataIsValid()
    {
        // Arrange
        var mockService = new Mock<IUserService>();
        var createUserDto = new CreateUserDto(
            Username: "testuser",
            Email: "test@example.com",
            Password: "password123"
        );

        var expectedUser = new User
        {
            Id = Guid.NewGuid(),
            Username = createUserDto.Username,
            Email = createUserDto.Email,
            PasswordHash = "hashed",
            CreatedAt = DateTime.UtcNow
        };

        mockService.Setup(service => service.CreateUserAsync(createUserDto))
                   .ReturnsAsync(expectedUser);

        var controller = new UserController(mockService.Object);

        // Act
        var result = await controller.CreateUser(createUserDto);

        // Assert
        var createdAtResult = Assert.IsType<CreatedAtActionResult>(result.Result);
        var userResponse = Assert.IsType<User>(createdAtResult.Value);
        Assert.Equal(expectedUser.Username, userResponse.Username);
        Assert.Equal(expectedUser.Email, userResponse.Email);
    }

    [Fact]
    public async Task UpdateUser_ReturnsNotFound_WhenUserDoesNotExist()
    {
        // Arrange
        var mockService = new Mock<IUserService>();
        var userId = Guid.NewGuid();
        var updateUserDto = new UpdateUserDto(
            Username: "updateduser",
            Email: "updated@example.com"
        );

        mockService.Setup(service => service.UpdateUserAsync(userId, updateUserDto))
                   .ReturnsAsync((User?)null);

        var controller = new UserController(mockService.Object);

        // Act
        var result = await controller.UpdateUser(userId, updateUserDto);

        // Assert
        Assert.IsType<NotFoundResult>(result.Result);
    }
}
