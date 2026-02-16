using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.Migrations
{
	/// <inheritdoc />
	public partial class AddJobDescriptionToUser : Migration
	{
		/// <inheritdoc />
		protected override void Up(MigrationBuilder migrationBuilder)
		{
			migrationBuilder.AddColumn<string>(
				name: "JobDescription",
				table: "User",
				type: "text",
				nullable: true
			);
		}

		/// <inheritdoc />
		protected override void Down(MigrationBuilder migrationBuilder)
		{
			migrationBuilder.DropColumn(name: "JobDescription", table: "User");
		}
	}
}
