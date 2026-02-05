using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "DustData",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Time = table.Column<DateTime>(
                        type: "timestamp with time zone",
                        nullable: false
                    ),
                    PM1S = table.Column<double>(type: "double precision", nullable: false),
                    PM25S = table.Column<double>(type: "double precision", nullable: false),
                    PM4S = table.Column<double>(type: "double precision", nullable: false),
                    PM10S = table.Column<double>(type: "double precision", nullable: false),
                    PM1T = table.Column<double>(type: "double precision", nullable: false),
                    PM25T = table.Column<double>(type: "double precision", nullable: false),
                    PM4T = table.Column<double>(type: "double precision", nullable: false),
                    PM10T = table.Column<double>(type: "double precision", nullable: false),
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DustData", x => new { x.Id, x.Time });
                }
            );

            migrationBuilder.CreateTable(
                name: "NoiseData",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Time = table.Column<DateTime>(
                        type: "timestamp with time zone",
                        nullable: false
                    ),
                    LavgQ3 = table.Column<double>(type: "double precision", nullable: false),
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_NoiseData", x => new { x.Id, x.Time });
                }
            );

            migrationBuilder.CreateTable(
                name: "VibrationData",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ConnectedOn = table.Column<DateTime>(
                        type: "timestamp with time zone",
                        nullable: false
                    ),
                    Exposure = table.Column<double>(type: "double precision", nullable: false),
                    DisconnectedOn = table.Column<DateTime>(
                        type: "timestamp with time zone",
                        nullable: false
                    ),
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_VibrationData", x => new { x.Id, x.ConnectedOn });
                }
            );

            migrationBuilder.Sql(
                "SELECT create_hypertable('\"DustData\"', by_range('Time', INTERVAL '1 day'));"
            );
            migrationBuilder.Sql(
                "SELECT create_hypertable('\"NoiseData\"', by_range('Time', INTERVAL '1 day'));"
            );
            migrationBuilder.Sql(
                "SELECT create_hypertable('\"VibrationData\"', by_range('ConnectedOn', INTERVAL '1 day'));"
            );
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(name: "DustData");

            migrationBuilder.DropTable(name: "NoiseData");

            migrationBuilder.DropTable(name: "VibrationData");
        }
    }
}
