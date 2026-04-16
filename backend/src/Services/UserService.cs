using Backend.DTOs;
using Backend.Extensions;
using Backend.Models;
using Microsoft.EntityFrameworkCore;

namespace Backend.Services;

public interface IUserService
{
	Task<User?> GetUserByIdAsync(Guid id);
	Task<List<User>> GetSubordinatesAsync(Guid managerId);
	Task<User?> GetUserByNameAsync(string name);
	Task<User?> GetUserByEmailAsync(string email);
	Task<List<User>> GetAllUsersAsync();
	Task<User> CreateUserAsync(CreateUserDto createUserDto);
	Task<User?> UpdateUserAsync(Guid id, UpdateUserDto updateUserDto);
	Task<bool> DeleteUserAsync(Guid id);
	Task<User?> UpdateSubordinatesAsync(Guid managerId, List<Guid> subordinateIds);
}

public class UserService : IUserService
{
	private readonly AppDbContext _context;

	public UserService(AppDbContext context)
	{
		_context = context;
	}

	public async Task<User?> GetUserByIdAsync(Guid id)
	{
		return await _context.User.Include(u => u.Location).FirstOrDefaultAsync(u => u.Id == id);
	}

	public async Task<List<User>> GetSubordinatesAsync(Guid managerId)
	{
		return await _context
			.User.Where(u => u.Managers.Any(m => m.Id == managerId))
			.Include(u => u.Location)
			.OrderBy(u => u.Name)
			.ToListAsync();
	}

	public async Task<User?> GetUserByNameAsync(string name)
	{
		return await _context
			.User.Include(u => u.Location)
			.FirstOrDefaultAsync(u => u.Name == name);
	}

	public async Task<User?> GetUserByEmailAsync(string email)
	{
		return await _context
			.User.Include(u => u.Location)
			.FirstOrDefaultAsync(u => u.Email == email);
	}

	public async Task<List<User>> GetAllUsersAsync()
	{
		return await _context.User.Include(u => u.Location).ToListAsync();
	}

	public async Task<User> CreateUserAsync(CreateUserDto createUserDto)
	{
		User user = new User
		{
			Id = Guid.NewGuid(),
			Name = createUserDto.Name,
			Email = createUserDto.Email,
			PasswordHash = BCrypt.Net.BCrypt.HashPassword(createUserDto.Password),
			JobDescription = createUserDto.JobDescription,
			CreatedAt = DateTime.UtcNow,
			Role = createUserDto.Role,
			LocationId = createUserDto.LocationId,
		};

		_context.User.Add(user);
		await _context.SaveChangesAsync();

		var createdUser = await GetUserByIdAsync(user.Id);
		return createdUser!;
	}

	public async Task<User?> UpdateUserAsync(Guid id, UpdateUserDto updateUserDto)
	{
		User? user = await GetUserByIdAsync(id);
		if (user == null)
			return null;

		user.Name = updateUserDto.Name ?? user.Name;
		user.Email = updateUserDto.Email ?? user.Email;
		user.JobDescription = updateUserDto.JobDescription ?? user.JobDescription;

		if (!string.IsNullOrEmpty(updateUserDto.Password))
		{
			user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(updateUserDto.Password);
		}

		_context.User.Update(user);
		await _context.SaveChangesAsync();
		return user;
	}

	public async Task<bool> DeleteUserAsync(Guid id)
	{
		var user = await GetUserByIdAsync(id);
		if (user == null)
			return false;

		_context.User.Remove(user);
		await _context.SaveChangesAsync();
		return true;
	}

	public async Task<User?> UpdateSubordinatesAsync(Guid managerId, List<Guid> subordinateIds)
	{
		User? manager = await _context
			.User.Include(u => u.Subordinates)
			.FirstOrDefaultAsync(u => u.Id == managerId);

		if (manager == null)
			return null;

		List<User> newSubordinates = await _context
			.User.Where(u => subordinateIds.Contains(u.Id))
			.ToListAsync();

		if (subordinateIds.Count > 0)
		{
			if (newSubordinates.Count != subordinateIds.Distinct().Count())
				return null;

			if (newSubordinates.Any(u => u.Id == managerId))
				return null;

			if (!newSubordinates.All(u => manager.Role.CanManage(u.Role)))
				return null;
		}

		manager.Subordinates = newSubordinates;
		await _context.SaveChangesAsync();

		return manager;
	}
}
