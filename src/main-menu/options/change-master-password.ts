import { password } from "@inquirer/prompts";
import bcrypt from "bcrypt";

import { MainMenuAction } from "../../types.js";
import { knex } from "../../db.js";
import { DatabaseRecord, MasterPasswordRecord } from "../../schemas/index.js";
import { bottomBar } from "../../utils/inquirer.js";
import { decrypt, encrypt } from "../../utils/encryption.js";
import { passwordIsValid } from "../../utils/passwords.js";

export const changeMasterPassword: MainMenuAction = {
  label: "Change master password",
  handler: async ({ setMasterPassword }) => {
    const [masterPasswordRecord] = await knex
      .table<MasterPasswordRecord>("master_passwords")
      .select("*")
      .limit(1);

    if (!masterPasswordRecord) {
      throw new Error("Expected master password to exist in the database.");
    }

    const masterPasswordHash = masterPasswordRecord.password;

    let masterPassword: string | undefined;

    while (!masterPassword) {
      const inputVal = await password({
        message: "Enter your master password:",
      });
      const passwordCorrect = bcrypt.compareSync(inputVal, masterPasswordHash);
      if (!passwordCorrect) {
        bottomBar.log.write("Incorrect master password.");
      } else {
        masterPassword = inputVal;
      }
    }

    let newMasterPassword: string | undefined;

    while (!newMasterPassword) {
      const inputVal = await password({
        message: "Enter a new master password:",
      });
      if (passwordIsValid(inputVal)) {
        newMasterPassword = inputVal;
      } else {
        bottomBar.log.write(
          "Password does not meet the requirements. (min. length: 8)"
        );
      }
    }

    const dbRecords = await knex
      .table<Omit<DatabaseRecord, "password"> & { password: string }>(
        "databases"
      )
      .select("*")
      .whereNotNull("password");

    for (const dbRecord of dbRecords) {
      const decryptedPassword = decrypt(dbRecord.password, masterPassword);
      await knex
        .table("databases")
        .update({ password: encrypt(decryptedPassword, newMasterPassword) })
        .where({ id: dbRecord.id });
    }

    setMasterPassword(newMasterPassword);

    const newPasswordHash = bcrypt.hashSync(newMasterPassword, 10);
    await knex
      .table("master_passwords")
      .update({ password: newPasswordHash })
      .where({ id: masterPasswordRecord.id });

    bottomBar.log.write("Master password changed successfully.");
  },
};
