using Backend.Models;
using Backend.Records;
using Microsoft.EntityFrameworkCore;

public class AppDbContext : DbContext
{
	public AppDbContext(DbContextOptions<AppDbContext> options)
		: base(options) { }

	public DbSet<NoiseData> NoiseData { get; set; }
	public DbSet<DustData> DustData { get; set; }
	public DbSet<VibrationData> VibrationData { get; set; }

	public DbSet<NoteData> NoteData { get; set; }
	public DbSet<User> User { get; set; }
	public DbSet<Location> Location { get; set; }

	protected override void OnModelCreating(ModelBuilder modelBuilder)
	{
		base.OnModelCreating(modelBuilder);
		modelBuilder.ApplyConfiguration(new Backend.Data.Configuration.UserConfiguration());

		modelBuilder
			.Entity<User>()
			.HasMany(user => user.Managers)
			.WithMany(user => user.Subordinates)
			.UsingEntity(typeBuilder => typeBuilder.ToTable("UserManagers"));

		// Store UserRole enum as string
		modelBuilder.Entity<User>().Property(user => user.Role).HasConversion<string>();

		modelBuilder.Entity<VibrationData>(entity =>
		{
			entity
				.HasOne(v => v.User)
				.WithMany(u => u.VibrationData)
				.HasForeignKey(v => v.UserId)
				.OnDelete(DeleteBehavior.Restrict);

			entity.HasIndex(v => new { v.UserId, v.ConnectedOn });
		});

		modelBuilder.Entity<NoiseData>(entity =>
		{
			entity
				.HasOne(n => n.User)
				.WithMany(u => u.NoiseData)
				.HasForeignKey(n => n.UserId)
				.OnDelete(DeleteBehavior.Restrict);

			entity.HasIndex(n => new { n.UserId, n.Time });
		});

		modelBuilder.Entity<DustData>(entity =>
		{
			entity
				.HasOne(d => d.User)
				.WithMany(u => u.DustData)
				.HasForeignKey(d => d.UserId)
				.OnDelete(DeleteBehavior.Restrict);

			entity.HasIndex(d => new { d.UserId, d.Time });
		});
	}
}
