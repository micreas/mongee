import { MainMenuConfig } from "../types.js";
import { addDatabase } from "./options/add-database.js";
import { changeMasterPassword } from "./options/change-master-password.js";
import { copyCollectionsAcrossDatabases } from "./options/copy-dollections-across-databases.js";
import { deleteDatabase } from "./options/delete-database.js";
import { exit } from "./options/exit.js";
import { updateDatabase } from "./options/update-database.js";

export const mainMenu: MainMenuConfig = {
  message: "What do you want to do?",
  actions: {
    addDatabase,
    deleteDatabase,
    updateDatabase,
    copyCollectionsAccrossDatabases: copyCollectionsAcrossDatabases,
    changeMasterPassword,
    exit,
  },
};
