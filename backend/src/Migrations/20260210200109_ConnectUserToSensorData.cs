using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.Migrations
{
    /// <inheritdoc />
    public partial class ConnectUserToSensorData : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "UserId",
                table: "VibrationData",
                type: "uuid",
                nullable: false
            );

            migrationBuilder.AddColumn<Guid>(
                name: "UserId",
                table: "NoiseData",
                type: "uuid",
                nullable: false
            );

            migrationBuilder.AddColumn<Guid>(
                name: "UserId",
                table: "DustData",
                type: "uuid",
                nullable: false
            );

            migrationBuilder.CreateIndex(
                name: "IX_VibrationData_UserId_ConnectedOn",
                table: "VibrationData",
                columns: new[] { "UserId", "ConnectedOn" }
            );

            migrationBuilder.CreateIndex(
                name: "IX_NoiseData_UserId_Time",
                table: "NoiseData",
                columns: new[] { "UserId", "Time" }
            );

            migrationBuilder.CreateIndex(
                name: "IX_DustData_UserId_Time",
                table: "DustData",
                columns: new[] { "UserId", "Time" }
            );

            migrationBuilder.AddForeignKey(
                name: "FK_DustData_User_UserId",
                table: "DustData",
                column: "UserId",
                principalTable: "User",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict
            );

            migrationBuilder.AddForeignKey(
                name: "FK_NoiseData_User_UserId",
                table: "NoiseData",
                column: "UserId",
                principalTable: "User",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict
            );

            migrationBuilder.AddForeignKey(
                name: "FK_VibrationData_User_UserId",
                table: "VibrationData",
                column: "UserId",
                principalTable: "User",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict
            );
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(name: "FK_DustData_User_UserId", table: "DustData");

            migrationBuilder.DropForeignKey(name: "FK_NoiseData_User_UserId", table: "NoiseData");

            migrationBuilder.DropForeignKey(
                name: "FK_VibrationData_User_UserId",
                table: "VibrationData"
            );

            migrationBuilder.DropIndex(
                name: "IX_VibrationData_UserId_ConnectedOn",
                table: "VibrationData"
            );

            migrationBuilder.DropIndex(name: "IX_NoiseData_UserId_Time", table: "NoiseData");

            migrationBuilder.DropIndex(name: "IX_DustData_UserId_Time", table: "DustData");

            migrationBuilder.DropColumn(name: "UserId", table: "VibrationData");

            migrationBuilder.DropColumn(name: "UserId", table: "NoiseData");

            migrationBuilder.DropColumn(name: "UserId", table: "DustData");
        }
    }
}
