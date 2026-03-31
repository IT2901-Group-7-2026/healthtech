using Backend.IntegrationTests.Fixtures;
using Backend.Models;
using Backend.Services;
using Microsoft.EntityFrameworkCore;

namespace Backend.IntegrationTests.ServiceTests;

[Collection(PostgresTestDbCollection.Name)]
public sealed class UserStatusServiceIntegrationTests(PostgresTestDbFixture fixture)
	: IntegrationTestBase(fixture)
{
	[Fact]
	public async Task GetStatusForUsersInRange_ReturnsUserStatuses()
	{
		await using var context = Fixture.CreateDbContext();
		var service = new UserStatusService(context, Fixture.CreateOperatorContext());
		Guid userId = SeedIds.KariId;

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
		await using var context = Fixture.CreateDbContext();
		var service = new UserStatusService(context, Fixture.CreateOperatorContext());

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
