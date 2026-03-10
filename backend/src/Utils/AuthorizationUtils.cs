namespace Backend.Utils
{
	public static class AuthorizationUtils
	{
		public static DateTime ClampRequestStartDateForRole(DateTime start, UserRole? role)
		{
			// Foremen can only see data for the past 7 days
			if (role == UserRole.Foreman)
			{
				DateTime sevenDaysAgo = DateTime.UtcNow.AddDays(-7);
				if (start < sevenDaysAgo)
				{
					return sevenDaysAgo;
				}
			}

			return start;
		}
	}
}
