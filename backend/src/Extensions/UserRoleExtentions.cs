namespace Backend.Extensions;

public static class UserRoleExtensions
{
	public static bool CanManage(this UserRole managerRole, UserRole subordinateRole)
	{
		return managerRole > subordinateRole;
	}
}
