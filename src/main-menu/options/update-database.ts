import { select, checkbox, input, password } from "@inquirer/prompts";

import { knex } from "../../db.js";
import { MainMenuAction } from "../../types.js";
import { bottomBar } from "../../utils/inquirer.js";
import { DatabaseRecord } from "../../schemas/index.js";
import {
  dbRecordToUrl,
  isValidMongoDbConnectionString,
  parseUrl,
} from "../../utils/db-urls.js";
import { encrypt } from "../../utils/encryption.js";

export const updateDatabase: MainMenuAction = {
  label: "Update a database record",
  handler: async ({ getMasterPassword }) => {
    const rows = await knex
      .select<DatabaseRecord[]>("*")
      .from("databases")
      .from("databases")
      .orderBy("alias", "asc");

    if (!rows.length) {
      bottomBar.log.write("No database records to update.");
      return;
    }

    const databaseToEdit = await select({
      message: "Which database record do you want to update?",
      choices: rows.map((row) => ({
        name: `${row.name} (${row.host}:${row.port})`,
        value: row,
      })),
    });

    const fieldsToEdit = await checkbox({
      message: "What do you want to edit?",
      choices: [
        {
          name: "Alias",
          value: "alias",
        },
        {
          name: "Name",
          value: "name",
        },
        {
          name: "Username",
          value: "username",
        },
        {
          name: "Url",
          value: "url",
        },
        {
          name: "Password",
          value: "password",
        },
      ],
    });

    let updatedFields: Partial<DatabaseRecord> = {};

    if (fieldsToEdit.includes("username")) {
      updatedFields.username =
        (await input({
          message: "Enter the new username:",
        })) || null;
    }

    if (fieldsToEdit.includes("alias")) {
      updatedFields.name = await input({
        message: "Enter the new alias:",
        default: databaseToEdit.alias,
      });
    }

    if (fieldsToEdit.includes("name")) {
      updatedFields.name = await input({
        message: "Enter the new name:",
        default: databaseToEdit.name,
      });
    }

    if (fieldsToEdit.includes("url")) {
      const url = await input({
        message: "Enter the new url:",
        default: dbRecordToUrl(databaseToEdit),
      });

      if (!isValidMongoDbConnectionString(url)) {
        bottomBar.log.write("Invalid connection string");
        return;
      }

      const { password: parsedPassword, ...parsedUrl } = parseUrl(url);

      updatedFields = {
        ...updatedFields,
        ...parsedUrl,
      };

      if (parsedPassword) {
        const choice = await select({
          message: "Password detected... How do you want to handle it?",
          choices: [
            {
              name: "Encrypt with the master password and store",
              value: "encrypt_with_master_password",
            },
            {
              name: "Do not store",
              value: "do_not_store",
            },
          ],
        });

        if (choice === "encrypt_with_master_password") {
          updatedFields.password = encrypt(parsedPassword, getMasterPassword());
        } else if (choice === "do_not_store") {
          updatedFields.password = null;
        }
      }
    }

    if (fieldsToEdit.includes("password")) {
      const pass = await password({
        message: "Enter the new password:",
      });

      if (pass) {
        updatedFields.password = encrypt(pass, getMasterPassword());
      } else {
        updatedFields.password = null;
      }
    }

    if (Object.keys(updatedFields).length) {
      await knex
        .table("databases")
        .update(updatedFields)
        .where("id", databaseToEdit.id);
      bottomBar.log.write("Database record updated.");
    }
  },
};
