using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.Migrations
{
	/// <inheritdoc />
	public partial class AddCorrectNoiseFields : Migration
	{
		/// <inheritdoc />
		protected override void Up(MigrationBuilder migrationBuilder)
		{
			migrationBuilder.RenameColumn(name: "LavgQ3", table: "NoiseData", newName: "LCPK");

			migrationBuilder.AddColumn<double>(
				name: "LAEQ",
				table: "NoiseData",
				type: "double precision",
				nullable: false
			);
		}

		/// <inheritdoc />
		protected override void Down(MigrationBuilder migrationBuilder)
		{
			migrationBuilder.DropColumn(name: "LAEQ", table: "NoiseData");

			migrationBuilder.RenameColumn(name: "LCPK", table: "NoiseData", newName: "LavgQ3");
		}
	}
}
