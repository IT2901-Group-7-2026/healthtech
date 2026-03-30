using Backend.IntegrationTests.Fixtures;
using Backend.Services;

namespace Backend.IntegrationTests.ServiceTests;

[Collection(PostgresTestDbCollection.Name)]
public sealed class UserStatusServiceIntegrationTests(PostgresTestDbFixture fixture)
{
	[Fact]
	public async Task GetStatusForUsersInRange_ReturnsUserStatuses()
	{
		await using var context = fixture.CreateDbContext();
		var service = new UserStatusService(context, fixture.CreateOperatorContext());

		DateTime start = new(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc);
		DateTime end = new(2026, 1, 2, 0, 0, 0, DateTimeKind.Utc);

		IEnumerable<DTOs.UserStatusDto> result = await service.GetStatusForUsersInRange(
			[PostgresTestDbFixture.KariId],
			start,
			end
		);

		DTOs.UserStatusDto status = Assert.Single(result);

		Assert.Equal(PostgresTestDbFixture.KariId, status.UserId);
	}

	[Fact]
	public async Task GetStatusForUsersInRange_EmptyUserIds_ReturnsEmpty()
	{
		await using var context = fixture.CreateDbContext();
		var service = new UserStatusService(context, fixture.CreateOperatorContext());

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
