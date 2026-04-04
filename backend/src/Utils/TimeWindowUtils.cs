namespace Backend.Utils
{
	public static class TimeWindowUtils
	{
		public static DateTime ClampRequestEndDateToCurrentDateTime(DateTime end)
		{
			DateTime now = DateTime.UtcNow;

			return end > now ? now : end;
		}
	}
}
