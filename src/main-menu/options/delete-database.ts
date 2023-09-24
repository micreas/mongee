import { select } from "@inquirer/prompts";

import { knex } from "../../db.js";
import { MainMenuAction } from "../../types.js";
import { bottomBar } from "../../utils/inquirer.js";

export const deleteDatabase: MainMenuAction = {
  label: "Delete a database record",
  handler: async () => {
    const rows = await knex.select("*").from("databases");

    if (!rows.length) {
      bottomBar.log.write("No database records to delete.");
      return;
    }

    const choice = await select({
      message: "Which database record do you want to delete?",
      choices: [
        ...rows.map((row) => ({
          name: row.name,
          value: row.id,
        })),
        { name: "Cancel", value: "cancel" },
      ],
    });

    if (choice === "cancel") return;

    await knex.delete().from("databases").where("id", choice);
  },
};
