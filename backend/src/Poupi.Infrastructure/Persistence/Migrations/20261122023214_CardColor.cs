using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Poupi.Infrastructure.Persistence.Migrations
{
    public partial class CardColor : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Color",
                table: "Cards",
                type: "character varying(9)",
                maxLength: 9,
                nullable: true);

            migrationBuilder.Sql("""
                UPDATE "Cards" AS c
                SET "Color" = (ARRAY['#3987e5', '#199e70', '#d55181', '#c98500', '#9085e9', '#d95926', '#008300', '#e66767'])[((ranked.position - 1) % 8) + 1]
                FROM (
                    SELECT "Id", ROW_NUMBER() OVER (PARTITION BY "HouseholdId" ORDER BY "CreatedAt", "Id") AS position
                    FROM "Cards"
                ) AS ranked
                WHERE c."Id" = ranked."Id";
                """);

            migrationBuilder.AlterColumn<string>(
                name: "Color",
                table: "Cards",
                type: "character varying(9)",
                maxLength: 9,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(9)",
                oldMaxLength: 9,
                oldNullable: true);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Color",
                table: "Cards");
        }
    }
}
