// These values should be ordered such that higher values represent higher privileges (who can manage who).
public enum UserRole
{
	/// <summary>
	/// An operator is a regular worker/employee.
	/// </summary>
	Operator = 0,

	/// <summary>
	/// A foreman is a supervisor.
	/// </summary>
	Foreman = 10,
}
