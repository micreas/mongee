import { MainMenuConfig } from "../types.js";
import { addDatabase } from "./options/add-database.js";
import { changeMasterPassword } from "./options/change-master-password.js";
import { copyCollectionsBetweenDatabases } from "./options/copy-dollections-between-databases.js";
import { deleteDatabase } from "./options/delete-database.js";
import { exit } from "./options/exit.js";
import { showDatabaseDetails } from "./options/show-database-details.js";
import { updateDatabase } from "./options/update-database.js";

export const mainMenu: MainMenuConfig = {
  message: "What do you want to do?",
  actions: {
    addDatabase,
    deleteDatabase,
    updateDatabase,
    copyCollectionsBetweenDatabases,
    showDatabaseDetails,
    changeMasterPassword,
    exit,
  },
};
