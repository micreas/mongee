import { password } from "@inquirer/prompts";
import bcrypt from "bcrypt";

import { mainMenu } from "./main-menu/index.js";

import { bottomBar, showChoicesAndExecute } from "./utils/inquirer.js";
import { initDatabase, knex } from "./db.js";
import { MasterPasswordRecord } from "./schemas/index.js";
import { MainMenuGlobals } from "./types.js";
import { passwordIsValid } from "./utils/passwords.js";

(async () => {
  try {
    await initDatabase();

    let masterPassword: string;

    const [masterPasswordRecord] = await knex
      .table<MasterPasswordRecord>("master_passwords")
      .select("*")
      .limit(1);

    if (!masterPasswordRecord) {
      let masterPass: string | undefined;
      while (!masterPass) {
        const inputVal = await password({
          message: "Choose a master password (min. length: 8):",
        });
        if (passwordIsValid(inputVal)) {
          masterPass = inputVal;
        }
      }

      await knex("master_passwords").insert({
        password: bcrypt.hashSync(masterPass, 10).toString(),
      });

      masterPassword = masterPass;

      bottomBar.log.write("Master password set successfully!");
    } else {
      while (!masterPassword) {
        const inputVal = await password({
          message: "Enter your master password:",
        });

        const correct = bcrypt.compareSync(
          inputVal,
          masterPasswordRecord.password
        );
        if (correct) {
          masterPassword = inputVal;
        } else {
          bottomBar.log.write("Incorrect master password.");
        }
      }
    }

    const mainMenuGlobals: MainMenuGlobals = {
      getMasterPassword: () => masterPassword,
      setMasterPassword: (password) => {
        masterPassword = password;
      },
    };

    while (true) await showChoicesAndExecute(mainMenu, mainMenuGlobals);
  } catch (e) {
    // inquirer usually just dies and does not show the errors
    console.error(e);
    throw e;
  }
})();
