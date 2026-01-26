using Microsoft.EntityFrameworkCore;
using Backend.Records;
using Backend.Models;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<NoiseData> NoiseData { get; set; }
    public DbSet<DustData> DustData { get; set; }
    public DbSet<VibrationData> VibrationData { get; set; }

    public DbSet<NoteData> NoteData { get; set; }
    public DbSet<User> User { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        modelBuilder.ApplyConfiguration(new Backend.Data.Configuration.UserConfiguration());
    }
}