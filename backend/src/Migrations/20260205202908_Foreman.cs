using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.Migrations
{
	/// <inheritdoc />
	public partial class Foreman : Migration
	{
		/// <inheritdoc />
		protected override void Up(MigrationBuilder migrationBuilder)
		{
			migrationBuilder.AddColumn<Guid>(
				name: "LocationId",
				table: "User",
				type: "uuid",
				nullable: false
			);

			migrationBuilder.AddColumn<string>(
				name: "Role",
				table: "User",
				type: "text",
				nullable: false
			);

			migrationBuilder.AddColumn<Guid>(
				name: "UserId",
				table: "NoteData",
				type: "uuid",
				nullable: false
			);

			migrationBuilder.CreateTable(
				name: "Location",
				columns: table => new
				{
					Id = table.Column<Guid>(type: "uuid", nullable: false),
					Latitude = table.Column<float>(type: "real", nullable: false),
					Longitude = table.Column<float>(type: "real", nullable: false),
					Country = table.Column<string>(type: "text", nullable: false),
					Region = table.Column<string>(type: "text", nullable: false),
					City = table.Column<string>(type: "text", nullable: false),
					Site = table.Column<string>(type: "text", nullable: false),
					Building = table.Column<string>(type: "text", nullable: true),
				},
				constraints: table =>
				{
					table.PrimaryKey("PK_Location", x => x.Id);
				}
			);

			migrationBuilder.CreateTable(
				name: "UserManagers",
				columns: table => new
				{
					ManagersId = table.Column<Guid>(type: "uuid", nullable: false),
					SubordinatesId = table.Column<Guid>(type: "uuid", nullable: false),
				},
				constraints: table =>
				{
					table.PrimaryKey(
						"PK_UserManagers",
						x => new { x.ManagersId, x.SubordinatesId }
					);
					table.ForeignKey(
						name: "FK_UserManagers_User_ManagersId",
						column: x => x.ManagersId,
						principalTable: "User",
						principalColumn: "Id",
						onDelete: ReferentialAction.Cascade
					);
					table.ForeignKey(
						name: "FK_UserManagers_User_SubordinatesId",
						column: x => x.SubordinatesId,
						principalTable: "User",
						principalColumn: "Id",
						onDelete: ReferentialAction.Cascade
					);
				}
			);

			migrationBuilder.CreateIndex(
				name: "IX_User_LocationId",
				table: "User",
				column: "LocationId"
			);

			migrationBuilder.CreateIndex(
				name: "IX_NoteData_UserId",
				table: "NoteData",
				column: "UserId"
			);

			migrationBuilder.CreateIndex(
				name: "IX_UserManagers_SubordinatesId",
				table: "UserManagers",
				column: "SubordinatesId"
			);

			migrationBuilder.AddForeignKey(
				name: "FK_NoteData_User_UserId",
				table: "NoteData",
				column: "UserId",
				principalTable: "User",
				principalColumn: "Id",
				onDelete: ReferentialAction.Cascade
			);

			migrationBuilder.AddForeignKey(
				name: "FK_User_Location_LocationId",
				table: "User",
				column: "LocationId",
				principalTable: "Location",
				principalColumn: "Id",
				onDelete: ReferentialAction.Cascade
			);
		}

		/// <inheritdoc />
		protected override void Down(MigrationBuilder migrationBuilder)
		{
			migrationBuilder.DropForeignKey(name: "FK_NoteData_User_UserId", table: "NoteData");

			migrationBuilder.DropForeignKey(name: "FK_User_Location_LocationId", table: "User");

			migrationBuilder.DropTable(name: "Location");

			migrationBuilder.DropTable(name: "UserManagers");

			migrationBuilder.DropIndex(name: "IX_User_LocationId", table: "User");

			migrationBuilder.DropIndex(name: "IX_NoteData_UserId", table: "NoteData");

			migrationBuilder.DropColumn(name: "LocationId", table: "User");

			migrationBuilder.DropColumn(name: "Role", table: "User");

			migrationBuilder.DropColumn(name: "UserId", table: "NoteData");
		}
	}
}
