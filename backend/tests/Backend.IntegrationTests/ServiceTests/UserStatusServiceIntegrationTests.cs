using Backend.IntegrationTests.Fixtures;
using Backend.Models;
using Backend.Services;
using Microsoft.EntityFrameworkCore;

namespace Backend.IntegrationTests.ServiceTests;

[Collection(PostgresTestDbCollection.Name)]
public sealed class UserStatusServiceIntegrationTests(PostgresTestDbFixture fixture)
{
	private static async Task<Guid> InsertTestUserAsync(AppDbContext context)
	{
		bool hasLocation = await context.Location.AnyAsync(l =>
			l.Id == PostgresTestDbFixture.VerdalLocationId
		);

		if (!hasLocation)
		{
			context.Location.Add(
				new Location
				{
					Id = PostgresTestDbFixture.VerdalLocationId,
					Latitude = 63.787882f,
					Longitude = 11.440749f,
					Country = "Norway",
					Region = "Trondelag",
					City = "Verdal",
					Site = "Test Site",
					Building = "Test Building",
					Users = [],
				}
			);
		}

		Guid userId = Guid.NewGuid();
		context.User.Add(
			new User
			{
				Id = userId,
				Username = $"status-test-{userId:N}",
				Email = $"status-test-{userId:N}@example.com",
				PasswordHash = "testpassword",
				CreatedAt = DateTime.UtcNow,
				Role = UserRole.Operator,
				LocationId = PostgresTestDbFixture.VerdalLocationId,
			}
		);

		await context.SaveChangesAsync();
		return userId;
	}

	[Fact]
	public async Task GetStatusForUsersInRange_ReturnsUserStatuses()
	{
		await using var context = fixture.CreateDbContext();
		var service = new UserStatusService(context, fixture.CreateOperatorContext());
		Guid userId = await InsertTestUserAsync(context);

		DateTime start = new(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc);
		DateTime end = new(2026, 1, 2, 0, 0, 0, DateTimeKind.Utc);

		IEnumerable<DTOs.UserStatusDto> result = await service.GetStatusForUsersInRange(
			[userId],
			start,
			end
		);

		DTOs.UserStatusDto status = Assert.Single(result);

		Assert.Equal(userId, status.UserId);
	}

	[Fact]
	public async Task GetStatusForUsersInRange_EmptyUserIds_ReturnsEmpty()
	{
		await using var context = fixture.CreateDbContext();
		var service = new UserStatusService(context, fixture.CreateOperatorContext());
		_ = await InsertTestUserAsync(context);

		DateTime start = new(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc);
		DateTime end = new(2026, 1, 2, 0, 0, 0, DateTimeKind.Utc);

		IEnumerable<DTOs.UserStatusDto> result = await service.GetStatusForUsersInRange(
			[],
			start,
			end
		);

		Assert.Empty(result);
	}
}
