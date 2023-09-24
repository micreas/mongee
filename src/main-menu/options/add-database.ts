import { input, password, select } from "@inquirer/prompts";

import { MainMenuAction } from "../../types.js";
import { encrypt } from "../../utils/encryption.js";
import { bottomBar } from "../../utils/inquirer.js";
import { knex } from "../../db.js";
import { DatabaseRecord } from "../../schemas/index.js";
import {
  isValidMongoDbConnectionString,
  parseUrl,
} from "../../utils/db-urls.js";

const storeDbRecord = async (dbRecord: Omit<DatabaseRecord, "id">) => {
  await knex.insert(dbRecord).into("databases");
};

export const addDatabase: MainMenuAction = {
  label: "Add a database record",
  handler: async ({ getMasterPassword }) => {
    const connectionString = await input({
      message: "Enter the database connection string:",
    });

    if (!isValidMongoDbConnectionString(connectionString)) {
      bottomBar.log.write("Invalid connection string");
      return;
    }

    const parsedUrl = parseUrl(connectionString);

    const dbNameDefault = parsedUrl.path.startsWith("/")
      ? parsedUrl.path.split("/")[1]
      : undefined;

    const dbName = await input({
      message: "Enter the database name (server DB name):",
      default: dbNameDefault,
    });

    const dbAlias = await input({
      message: "Enter a database alias (what you'll see in list views):",
      default: `[${parsedUrl.host}] ${dbName}`,
    });

    let encryptedPassword: string | undefined;

    if (parsedUrl.password) {
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
        encryptedPassword = encrypt(parsedUrl.password, getMasterPassword());
      }
    }

    const dbRecord: Omit<DatabaseRecord, "id"> = {
      alias: dbAlias,
      name: dbName,
      ...parsedUrl,
      password: encryptedPassword || null,
    };

    await storeDbRecord(dbRecord);

    bottomBar.log.write(`Database '${dbRecord.alias}' added successfully!`);
  },
};
