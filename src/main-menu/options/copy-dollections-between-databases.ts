import { checkbox, confirm, password, select } from "@inquirer/prompts";
import { MongoClient } from "mongodb";

import { knex } from "../../db.js";
import { MainMenuAction } from "../../types.js";
import { bottomBar } from "../../utils/inquirer.js";
import { DatabaseRecord } from "../../schemas/index.js";
import { dbRecordToUrl } from "../../utils/db-urls.js";
import { decrypt } from "../../utils/encryption.js";

const roundToDecimals = (number: number, decimals: number) => {
  if (decimals < 0)
    throw new Error("'Decimals' parameter must not be a negative number.");
  const decimalMultiplier = 10 ** decimals;
  return (
    Math.round((number + Number.EPSILON) * decimalMultiplier) /
    decimalMultiplier
  );
};

const toHHMMSS = function (sec: number) {
  if (!Number.isFinite(sec)) return "--:--:--.--";

  const hours = Math.floor(sec / 3600);
  const minutes = Math.floor((sec - hours * 3600) / 60);
  const seconds = sec - hours * 3600 - minutes * 60;
  return `${hours.toString().padStart(2, "0")}:${minutes
    .toString()
    .padStart(2, "0")}:${seconds.toFixed(2).padStart(5, "0")}`;
};

const emptyLocalizedDate = Date().replace(/[^ ]/g, "-");

export const copyCollectionsBetweenDatabases: MainMenuAction = {
  label: "Copy collections between databases",
  handler: async ({ getMasterPassword }) => {
    const rows = await knex
      .select<DatabaseRecord[]>("*")
      .from("databases")
      .orderBy("alias", "asc");

    if (!rows.length) {
      bottomBar.log.write("No databases to work with.");
      return;
    }

    const dbFromRecord = await select({
      message: "Source database server:",
      choices: rows.map((row) => ({
        name: row.alias,
        value: { ...row },
      })),
    });

    dbFromRecord.password =
      dbFromRecord.password &&
      decrypt(dbFromRecord.password, getMasterPassword());

    if (dbFromRecord.username && !dbFromRecord.password) {
      dbFromRecord.password = await password({
        message: `Enter the source database password (${dbFromRecord.alias}):`,
      });
    }

    const dbToRecord = await select({
      message: "Target database server:",
      choices: rows.map((row) => ({
        name: row.alias,
        value: { ...row },
      })),
    });

    dbToRecord.password =
      dbToRecord.password && decrypt(dbToRecord.password, getMasterPassword());

    if (dbToRecord.username && !dbToRecord.password) {
      dbToRecord.password = await password({
        message: `Enter the target database password (${dbToRecord.alias}):`,
      });
    }

    const dbFrom = new MongoClient(dbRecordToUrl(dbFromRecord));
    const dbTo = new MongoClient(dbRecordToUrl(dbToRecord));

    await dbFrom.connect();
    await dbTo.connect();

    const collections = await dbFrom.db().listCollections().toArray();

    const collectionsToCopy = await checkbox({
      message: "Which collections do you want to copy?",
      choices: collections.map((collection) => ({
        name: collection.name,
        value: collection.name,
      })),
    });

    if (!collectionsToCopy) {
      bottomBar.log.write("No collections to copy.");
      return;
    }

    const copyingConfirmed = await confirm({
      message: `Are you sure you want to copy the following collections: ${collectionsToCopy.join(
        ", "
      )} from "${dbFromRecord.alias}" to "${dbToRecord.alias}"?`,
    });

    if (!copyingConfirmed) return;

    for (let index = 0; index < collectionsToCopy.length; index++) {
      const collection = collectionsToCopy[index];

      let completed = 0;
      const sourceCursor = dbFrom
        .db()
        .collection(collection)
        .find({})
        .addCursorFlag("noCursorTimeout", true);

      const count = await dbFrom
        .db()
        .collection(collection)
        .estimatedDocumentCount();

      const start = new Date();

      while (await sourceCursor.hasNext()) {
        const sourceDoc = await sourceCursor.next();

        if (!sourceDoc) continue;

        await dbTo.db().collection(collection).updateOne(
          { _id: sourceDoc._id },
          {
            $set: sourceDoc,
          },
          { upsert: true }
        );
        completed++;

        const elapsed = new Date().getTime() - start.getTime();

        const elapsedSeconds = Math.floor(elapsed / 1000);

        const completePercents =
          Math.round((completed / count) * 100 * 100) / 100;

        const remainingSeconds =
          roundToDecimals((elapsedSeconds / completePercents) * 100, 3) -
          elapsedSeconds;

        const estimatedFinishDate = !Number.isFinite(remainingSeconds)
          ? emptyLocalizedDate
          : new Date(new Date().getTime() + remainingSeconds * 1000);

        const lines = [
          `[${index + 1}/${
            collectionsToCopy.length
          }] Copying collection "${collection}"`,
          `Completed: ${completed} / ${count}`,
          `Complete percentage: ${completePercents}%`,
          `Elapsed: ${toHHMMSS(elapsedSeconds)}`,
          `Remaining: ${toHHMMSS(remainingSeconds)}`,
          `Estimated finish time: ${estimatedFinishDate}`,
        ];

        bottomBar.updateBottomBar(lines.join("\n"));
      }
    }

    await dbFrom.close();
    await dbTo.close();
  },
};
