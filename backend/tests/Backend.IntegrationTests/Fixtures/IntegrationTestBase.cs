using Backend.IntegrationTests.Fixtures;

public abstract class IntegrationTestBase : IAsyncLifetime
{
	protected readonly PostgresTestDbFixture Fixture;

	protected IntegrationTestBase(PostgresTestDbFixture fixture)
	{
		Fixture = fixture;
	}

	public Task InitializeAsync()
	{
		return Fixture.ResetDatabaseAsync();
	}

	public Task DisposeAsync()
	{
		return Task.CompletedTask;
	}
}
