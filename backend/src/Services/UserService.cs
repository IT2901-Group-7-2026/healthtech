using Backend.DTOs;
using Backend.Models;
using Microsoft.EntityFrameworkCore;

namespace Backend.Services;

public interface IUserService
{
    Task<User?> GetUserByIdAsync(Guid id);
    Task<User?> GetUserByUsernameAsync(string username);
    Task<User?> GetUserByEmailAsync(string email);
    Task<List<User>> GetAllUsersAsync();
    Task<User> CreateUserAsync(CreateUserDto createUserDto);
    Task<User?> UpdateUserAsync(Guid id, UpdateUserDto updateUserDto);
    Task<bool> DeleteUserAsync(Guid id);
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

    public async Task<User?> GetUserByUsernameAsync(string username)
    {
        return await _context.User.Include(u => u.Location).FirstOrDefaultAsync(u => u.Username == username);
    }

    public async Task<User?> GetUserByEmailAsync(string email)
    {
        return await _context.User.Include(u => u.Location).FirstOrDefaultAsync(u => u.Email == email);
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
            Username = createUserDto.Username,
            Email = createUserDto.Email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(createUserDto.Password),
            JobDescription = createUserDto.JobDescription,
            CreatedAt = DateTime.UtcNow,
            Role = createUserDto.Role,
            LocationId = createUserDto.LocationId
        };

        _context.User.Add(user);
        await _context.SaveChangesAsync();

        var createdUser = await GetUserByIdAsync(user.Id);
        return createdUser!;
    }

    public async Task<User?> UpdateUserAsync(Guid id, UpdateUserDto updateUserDto)
    {
        User? user = await GetUserByIdAsync(id);
        if (user == null) return null;

        user.Username = updateUserDto.Username ?? user.Username;
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
        if (user == null) return false;

        _context.User.Remove(user);
        await _context.SaveChangesAsync();
        return true;
    }
}