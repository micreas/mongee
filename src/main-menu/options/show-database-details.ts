import { select } from "@inquirer/prompts";

import { MainMenuAction } from "../../types.js";
import { knex } from "../../db.js";
import { bottomBar } from "../../utils/inquirer.js";
import { DatabaseRecord } from "../../schemas/index.js";

export const showDatabaseDetails: MainMenuAction = {
  label: "Show database details",
  handler: async () => {
    const rows = await knex
      .select<DatabaseRecord[]>("*")
      .from("databases")
      .from("databases")
      .orderBy("alias", "asc");

    if (!rows.length) {
      bottomBar.log.write("No database records to update.");
      return;
    }

    const databaseToInspect = await select({
      message: "Which database record do you want to update?",
      choices: rows.map((row) => ({
        name: `${row.name} (${row.host}:${row.port})`,
        value: row,
      })),
    });

    const { password, ...dbWithoutPassword } = databaseToInspect;

    bottomBar.log.write(JSON.stringify(dbWithoutPassword, null, 2));
  },
};
