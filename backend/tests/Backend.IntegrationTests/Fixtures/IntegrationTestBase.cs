using Backend.IntegrationTests.Fixtures;

/// <summary>
/// XUnit does not support BeforeEach/AfterEach, so we use this as a base class for each integration test, which ensures the database is reset before each test
/// </summary>
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
