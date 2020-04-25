using System;
using Microsoft.EntityFrameworkCore.Migrations;

namespace ekorre.Migrations
{
    public partial class IntialCreate : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Users",
                columns: table => new
                {
                    StilID = table.Column<string>(nullable: false),
                    Name = table.Column<string>(nullable: true),
                    Programme = table.Column<string>(nullable: true),
                    Email = table.Column<string>(nullable: true),
                    PhoneNumber = table.Column<string>(nullable: true),
                    DateJoined = table.Column<DateTime>(nullable: false),
                    Roles = table.Column<string[]>(nullable: true),
                    PasswordHash = table.Column<byte[]>(nullable: true),
                    Salt = table.Column<byte[]>(nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Users", x => x.StilID);
                });
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Users");
        }
    }
}
