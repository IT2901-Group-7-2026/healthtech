using Backend.Models;
using Backend.Services;

namespace Backend.Middleware;

/// <summary>
/// Extracts signedInUserId from query parameters and loads the corresponding User into the SignedInUserContext for use in the request pipeline.
/// NOTE: This is a make-shift implementation of an authentication middleware for the prototype and should be replaced with proper auth and authz providers in the future.
/// </summary>
/// <param name="next"></param>
public class SignedInUserMiddleware(RequestDelegate next)
{
	public async Task InvokeAsync(
		HttpContext context,
		SignedInUserContext signedInUser,
		IUserService userService
	)
	{
		if (
			context.Request.Query.TryGetValue("signedInUserId", out var rawUserId)
			&& Guid.TryParse(rawUserId, out var userId)
		)
		{
			User? user = await userService.GetUserByIdAsync(userId);
			signedInUser.User = user;
		}

		await next(context);
	}
}

public class SignedInUserContext
{
	public User? User { get; set; }
}
