using Backend.DTOs;
using Backend.IntegrationTests.Fixtures;
using Backend.Models;
using Backend.Services;
using Microsoft.EntityFrameworkCore;

namespace Backend.IntegrationTests.ServiceTests;

[Collection(PostgresTestDbCollection.Name)]
public sealed class UserServiceTests(PostgresTestDbFixture fixture) : IntegrationTestBase(fixture)
{
	[Fact]
	public async Task GetUserByIdAsync_ReturnsUserWithLocation_WhenUserExists()
	{
		await using var context = Fixture.CreateDbContext();
		var service = new UserService(context);

		User? user = await service.GetUserByIdAsync(SeedIds.KariId);

		Assert.NotNull(user);
		Assert.Equal(SeedIds.KariId, user!.Id);
		Assert.NotNull(user.Location);
		Assert.Equal(SeedIds.VerdalLocationId, user.Location!.Id);
	}

	[Fact]
	public async Task GetUserByIdAsync_ReturnsNull_WhenUserDoesNotExist()
	{
		await using var context = Fixture.CreateDbContext();
		var service = new UserService(context);

		User? user = await service.GetUserByIdAsync(Guid.NewGuid());

		Assert.Null(user);
	}

	[Fact]
	public async Task GetSubordinatesAsync_ReturnsUsersOrderedByName_WhenManagerHasSubordinates()
	{
		await using var context = Fixture.CreateDbContext();
		var service = new UserService(context);

		User manager = CreateUser("mgr", UserRole.Foreman);
		User subordinateZ = CreateUser("zed", UserRole.Operator);
		User subordinateA = CreateUser("amy", UserRole.Operator);

		subordinateZ.Managers.Add(manager);
		subordinateA.Managers.Add(manager);

		context.User.AddRange(manager, subordinateZ, subordinateA);
		await context.SaveChangesAsync();

		List<User> result = await service.GetSubordinatesAsync(manager.Id);

		Assert.Equal(2, result.Count);
		Assert.Equal(subordinateA.Id, result[0].Id);
		Assert.Equal(subordinateZ.Id, result[1].Id);
		Assert.All(result, user => Assert.NotNull(user.Location));
	}

	[Fact]
	public async Task GetAllUsersAsync_ReturnsUsersWithLocations()
	{
		await using var context = Fixture.CreateDbContext();
		var service = new UserService(context);

		List<User> users = await service.GetAllUsersAsync();

		Assert.NotEmpty(users);
		Assert.All(users, user => Assert.NotNull(user.Location));
	}

	[Fact]
	public async Task CreateUserAsync_PersistsUserAndHashesPassword()
	{
		await using var context = Fixture.CreateDbContext();
		var service = new UserService(context);
		string suffix = NewSuffix();

		CreateUserDto createDto = new(
			Name: $"user-{suffix}",
			Email: $"user-{suffix}@example.com",
			Password: "password123",
			LocationId: SeedIds.VerdalLocationId,
			ManagerIds: [],
			Role: UserRole.Operator,
			JobDescription: "welder"
		);

		User created = await service.CreateUserAsync(createDto);

		Assert.NotEqual(Guid.Empty, created.Id);
		Assert.Equal(createDto.Name, created.Name);
		Assert.Equal(createDto.Email, created.Email);
		Assert.Equal(createDto.LocationId, created.LocationId);
		Assert.NotNull(created.Location);
		Assert.NotEqual(createDto.Password, created.PasswordHash);
		Assert.True(BCrypt.Net.BCrypt.Verify(createDto.Password, created.PasswordHash));

		User? persisted = await context.User.FirstOrDefaultAsync(u => u.Id == created.Id);
		Assert.NotNull(persisted);
	}

	[Fact]
	public async Task UpdateUserAsync_ReturnsNull_WhenUserDoesNotExist()
	{
		await using var context = Fixture.CreateDbContext();
		var service = new UserService(context);

		UpdateUserDto updateDto = new(Name: "new-name", Email: "new@example.com");

		User? updated = await service.UpdateUserAsync(Guid.NewGuid(), updateDto);

		Assert.Null(updated);
	}

	[Fact]
	public async Task UpdateUserAsync_UpdatesFieldsAndPassword_WhenUserExists()
	{
		await using var context = Fixture.CreateDbContext();
		var service = new UserService(context);

		User user = CreateUser("upd", UserRole.Operator);
		user.PasswordHash = BCrypt.Net.BCrypt.HashPassword("oldpass");
		context.User.Add(user);
		await context.SaveChangesAsync();

		UpdateUserDto updateDto = new(
			Name: "updated-name",
			Email: "updated-name@example.com",
			Password: "newpass123",
			JobDescription: "updated-job"
		);

		User? updated = await service.UpdateUserAsync(user.Id, updateDto);

		Assert.NotNull(updated);
		Assert.Equal("updated-name", updated!.Name);
		Assert.Equal("updated-name@example.com", updated.Email);
		Assert.Equal("updated-job", updated.JobDescription);
		Assert.True(BCrypt.Net.BCrypt.Verify("newpass123", updated.PasswordHash));
	}

	[Fact]
	public async Task DeleteUserAsync_ReturnsFalse_WhenUserDoesNotExist()
	{
		await using var context = Fixture.CreateDbContext();
		var service = new UserService(context);

		bool deleted = await service.DeleteUserAsync(Guid.NewGuid());

		Assert.False(deleted);
	}

	[Fact]
	public async Task DeleteUserAsync_DeletesUser_WhenUserExists()
	{
		await using var context = Fixture.CreateDbContext();
		var service = new UserService(context);

		User user = CreateUser("del", UserRole.Operator);
		context.User.Add(user);
		await context.SaveChangesAsync();

		bool deleted = await service.DeleteUserAsync(user.Id);

		Assert.True(deleted);
		bool exists = await context.User.AnyAsync(u => u.Id == user.Id);
		Assert.False(exists);
	}

	[Fact]
	public async Task UpdateSubordinatesAsync_ReturnsNull_WhenManagerDoesNotExist()
	{
		await using var context = Fixture.CreateDbContext();
		var service = new UserService(context);

		User? result = await service.UpdateSubordinatesAsync(Guid.NewGuid(), [Guid.NewGuid()]);

		Assert.Null(result);
	}

	[Fact]
	public async Task UpdateSubordinatesAsync_ReturnsNull_WhenAnySubordinateIdDoesNotExist()
	{
		await using var context = Fixture.CreateDbContext();
		var service = new UserService(context);

		User manager = CreateUser("mgr2", UserRole.Foreman);
		User subordinate = CreateUser("sub1", UserRole.Operator);
		context.User.AddRange(manager, subordinate);
		await context.SaveChangesAsync();

		List<Guid> requestedIds = [subordinate.Id, Guid.NewGuid()];

		User? result = await service.UpdateSubordinatesAsync(manager.Id, requestedIds);

		Assert.Null(result);
	}

	[Fact]
	public async Task UpdateSubordinatesAsync_ReturnsNull_WhenManagerIncludedAsSubordinate()
	{
		await using var context = Fixture.CreateDbContext();
		var service = new UserService(context);

		User manager = CreateUser("mgr3", UserRole.Foreman);
		context.User.Add(manager);
		await context.SaveChangesAsync();

		User? result = await service.UpdateSubordinatesAsync(manager.Id, [manager.Id]);

		Assert.Null(result);
	}

	[Fact]
	public async Task UpdateSubordinatesAsync_ReturnsNull_WhenManagerCannotManageSubordinateRole()
	{
		await using var context = Fixture.CreateDbContext();
		var service = new UserService(context);

		User operatorManager = CreateUser("mgr4", UserRole.Operator);
		User operatorSubordinate = CreateUser("sub2", UserRole.Operator);
		context.User.AddRange(operatorManager, operatorSubordinate);
		await context.SaveChangesAsync();

		User? result = await service.UpdateSubordinatesAsync(
			operatorManager.Id,
			[operatorSubordinate.Id]
		);

		Assert.Null(result);
	}

	[Fact]
	public async Task UpdateSubordinatesAsync_UpdatesSubordinates_WhenInputIsValid()
	{
		await using var context = Fixture.CreateDbContext();
		var service = new UserService(context);

		User manager = CreateUser("mgr5", UserRole.Foreman);
		User subordinateA = CreateUser("sub3", UserRole.Operator);
		User subordinateB = CreateUser("sub4", UserRole.Operator);
		context.User.AddRange(manager, subordinateA, subordinateB);
		await context.SaveChangesAsync();

		User? result = await service.UpdateSubordinatesAsync(
			manager.Id,
			[subordinateA.Id, subordinateB.Id]
		);

		Assert.NotNull(result);
		Assert.Equal(2, result!.Subordinates.Count);
		Assert.Contains(result.Subordinates, u => u.Id == subordinateA.Id);
		Assert.Contains(result.Subordinates, u => u.Id == subordinateB.Id);
	}

	private static string NewSuffix()
	{
		return Guid.NewGuid().ToString("N")[..8];
	}

	private static User CreateUser(string suffix, UserRole role)
	{
		return new User
		{
			Id = Guid.NewGuid(),
			Name = $"usr-{suffix}-{NewSuffix()}",
			Email = $"usr-{suffix}-{NewSuffix()}@example.com",
			PasswordHash = BCrypt.Net.BCrypt.HashPassword("password123"),
			CreatedAt = DateTime.UtcNow,
			Role = role,
			JobDescription = "job",
			LocationId = SeedIds.VerdalLocationId,
		};
	}
}
