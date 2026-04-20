using Backend.Models;
using Microsoft.EntityFrameworkCore;

namespace Backend.Services;

public class DatabaseSeeder
{
	private static readonly Guid TrondId = Guid.Parse("bbb3801e-f3ff-4b0c-9692-56e7505e9c31");
	private static readonly Guid GjertrudId = Guid.Parse("ccc3801e-f3ff-4b0c-9692-56e7505e9c32");
	private static readonly Guid KlaraId = Guid.Parse("ccc3801e-f3ff-4b0c-9692-56e7505e9c33");
	private static readonly Guid BirgirId = Guid.Parse("ddd3801e-f3ff-4b0c-9692-56e7505e9c31");
	private static readonly Guid TorleifId = Guid.Parse("eee3801e-f3ff-4b0c-9692-56e7505e9c31");
	private static readonly Guid BjornulfId = Guid.Parse("fff3801e-f3ff-4b0c-9692-56e7505e9c31");

	// password123
	private const string DefaultPasswordHash =
		"$2a$11$QXVHkr6TQC8gJvh5P4GFzOYc.HyZA3FxDC3/BghAM3hODQVAoWwwi";

	public async Task SeedDataAsync(DbContext dbContext, CancellationToken ct)
	{
		DateTime now = DateTime.UtcNow;

		List<Location> seedLocations =
		[
			new Location
			{
				Id = SeedIds.VerdalLocationId,
				Site = "Aker Solutions Verdal",
				Building = "M-hallen",
				Country = "Norway",
				Region = "Trøndelag",
				Latitude = 63.78788207165566f,
				Longitude = 11.440749156413084f,
				City = "Verdal",
				Users = [],
			},
			new Location
			{
				Id = SeedIds.SandsliLocationId,
				Site = "Aker Solutions Sandsli",
				Building = "Bygg 1",
				Country = "Norway",
				Region = "Bergen",
				Latitude = 60.29278334510331f,
				Longitude = 5.279473042646057f,
				City = "Bergen",
				Users = [],
			},
		];

		List<User> seedUsers =
		[
			new User
			{
				Id = SeedIds.OlaId,
				Name = "Ola Nordmann",
				Email = "ola.nordmann@aker.com",
				PasswordHash = DefaultPasswordHash,
				CreatedAt = now,
				JobDescription = "Formann for bygg 1",
				LocationId = SeedIds.VerdalLocationId,
				Role = UserRole.Foreman,
			},
			new User
			{
				Id = SeedIds.KariId,
				Name = "Kari Nordmann",
				Email = "kari.nordmann@aker.com",
				PasswordHash = DefaultPasswordHash,
				CreatedAt = now,
				JobDescription = "Sveiser",
				LocationId = SeedIds.VerdalLocationId,
				Role = UserRole.Operator,
			},
			new User
			{
				Id = SeedIds.PerId,
				Name = "Per Hansen",
				Email = "per.hansen@aker.com",
				PasswordHash = DefaultPasswordHash,
				CreatedAt = now,
				JobDescription = "Technician",
				LocationId = SeedIds.VerdalLocationId,
				Role = UserRole.Operator,
			},
			new User
			{
				Id = TrondId,
				Name = "Trond Pedersen",
				Email = "trond.pedersen@aker.com",
				PasswordHash = DefaultPasswordHash,
				CreatedAt = now,
				JobDescription = "Technician",
				LocationId = SeedIds.VerdalLocationId,
				Role = UserRole.Operator,
			},
			new User
			{
				Id = GjertrudId,
				Name = "Gjertrud Olsen",
				Email = "gjertrud.olsen@aker.com",
				PasswordHash = DefaultPasswordHash,
				CreatedAt = now,
				JobDescription = "Technician",
				LocationId = SeedIds.VerdalLocationId,
				Role = UserRole.Operator,
			},
			new User
			{
				Id = KlaraId,
				Name = "Klara Johansen",
				Email = "klara.johansen@aker.com",
				PasswordHash = DefaultPasswordHash,
				CreatedAt = now,
				JobDescription = "Technician",
				LocationId = SeedIds.VerdalLocationId,
				Role = UserRole.Operator,
			},
			new User
			{
				Id = BirgirId,
				Name = "Birgir Sigurdsson",
				Email = "birgir.sigurdsson@aker.com",
				PasswordHash = DefaultPasswordHash,
				CreatedAt = now,
				JobDescription = "Technician",
				LocationId = SeedIds.VerdalLocationId,
				Role = UserRole.Operator,
			},
			new User
			{
				Id = TorleifId,
				Name = "Torleif Eriksen",
				Email = "torleif.eriksen@aker.com",
				PasswordHash = DefaultPasswordHash,
				CreatedAt = now,
				JobDescription = "Technician",
				LocationId = SeedIds.VerdalLocationId,
				Role = UserRole.Operator,
			},
			new User
			{
				Id = BjornulfId,
				Name = "Bjørnulf Knutsen",
				Email = "bjornul.knutsen@aker.com",
				PasswordHash = DefaultPasswordHash,
				CreatedAt = now,
				JobDescription = "Technician",
				LocationId = SeedIds.VerdalLocationId,
				Role = UserRole.Operator,
			},
		];

		List<(Guid ManagerId, Guid SubordinateId)> seedUserManagers =
		[
			(SeedIds.OlaId, SeedIds.KariId),
			(SeedIds.OlaId, SeedIds.PerId),
			(SeedIds.OlaId, TrondId),
			(SeedIds.OlaId, GjertrudId),
			(SeedIds.OlaId, KlaraId),
			(SeedIds.OlaId, BirgirId),
			(SeedIds.OlaId, TorleifId),
			(SeedIds.OlaId, BjornulfId),
		];

		HashSet<Guid> existingLocationIds = await dbContext
			.Set<Location>()
			.Select(location => location.Id)
			.ToHashSetAsync(ct);

		HashSet<Guid> existingUserIds = await dbContext
			.Set<User>()
			.Select(user => user.Id)
			.ToHashSetAsync(ct);

		List<Location> locationsToAdd = [];
		List<User> usersToAdd = [];

		foreach (Location location in seedLocations)
		{
			if (!existingLocationIds.Contains(location.Id))
			{
				locationsToAdd.Add(location);
			}
		}

		foreach (User user in seedUsers)
		{
			if (!existingUserIds.Contains(user.Id))
			{
				usersToAdd.Add(user);
			}
		}

		dbContext.Set<Location>().AddRange(locationsToAdd);
		dbContext.Set<User>().AddRange(usersToAdd);
		await dbContext.SaveChangesAsync(ct);

		HashSet<Guid> managerIds = seedUserManagers
			.Select(seedUserManager => seedUserManager.ManagerId)
			.ToHashSet();

		Dictionary<Guid, User> managers = await dbContext
			.Set<User>()
			.Where(user => managerIds.Contains(user.Id))
			.Include(user => user.Subordinates)
			.ToDictionaryAsync(user => user.Id, ct);

		HashSet<Guid> subordinateIds = seedUserManagers
			.Select(seedUserManager => seedUserManager.SubordinateId)
			.ToHashSet();

		Dictionary<Guid, User> subordinates = await dbContext
			.Set<User>()
			.Where(user => subordinateIds.Contains(user.Id))
			.ToDictionaryAsync(user => user.Id, ct);

		bool addedManagerLinks = false;

		foreach ((Guid managerId, Guid subordinateId) in seedUserManagers)
		{
			if (!managers.TryGetValue(managerId, out User? manager))
			{
				continue;
			}

			if (!subordinates.TryGetValue(subordinateId, out User? subordinate))
			{
				continue;
			}

			if (manager.Subordinates.Any(existing => existing.Id == subordinateId))
			{
				continue;
			}

			manager.Subordinates.Add(subordinate);
			addedManagerLinks = true;
		}

		if (!addedManagerLinks)
		{
			return;
		}

		await dbContext.SaveChangesAsync(ct);
	}
}
