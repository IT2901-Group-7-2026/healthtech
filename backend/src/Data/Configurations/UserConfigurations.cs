using Backend.Models;
using BCrypt.Net;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Backend.Data.Configuration;

public class UserConfiguration : IEntityTypeConfiguration<User>
{
	public void Configure(EntityTypeBuilder<User> builder)
	{
		builder.HasKey(u => u.Id);

		builder.Property(u => u.Username).IsRequired().HasMaxLength(50);

		builder.Property(u => u.Email).IsRequired().HasMaxLength(100);

		builder.HasIndex(u => u.Email).IsUnique();

		builder.HasIndex(u => u.Username).IsUnique();
	}
}
