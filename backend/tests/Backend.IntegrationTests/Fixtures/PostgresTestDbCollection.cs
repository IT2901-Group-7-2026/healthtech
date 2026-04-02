namespace Backend.IntegrationTests.Fixtures;

/// <summary>
/// Ensures all tests using this collection share the same `PostgresTestDbFixture` instance and reuse the same PostgreSQL container
/// </summary>
[CollectionDefinition(Name)]
public sealed class PostgresTestDbCollection : ICollectionFixture<PostgresTestDbFixture>
{
	public const string Name = "postgres-integration";
}
