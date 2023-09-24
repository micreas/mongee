import { confirm, select } from "@inquirer/prompts";

import { knex } from "../../db.js";
import { MainMenuAction } from "../../types.js";
import { bottomBar } from "../../utils/inquirer.js";
import { DatabaseRecord } from "../../schemas/index.js";

export const deleteDatabase: MainMenuAction = {
  label: "Delete a database record",
  handler: async () => {
    const rows = await knex.select("*").from<DatabaseRecord>("databases");

    if (!rows.length) {
      bottomBar.log.write("No database records to delete.");
      return;
    }

    const choice = await select({
      message: "Which database record do you want to delete?",
      choices: rows.map((row) => ({
        name: row.alias,
        value: row,
      })),
    });

    const deletionConfirmed = await confirm({
      message: `Are you sure you want to delete the "${choice.alias}" database record?`,
    });

    if (!deletionConfirmed) return;
    await knex.delete().from("databases").where("id", choice.id);
    bottomBar.log.write(`Database record "${choice.alias}" deleted.`);
  },
};
