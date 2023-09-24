import inquirer from "inquirer";
import { select } from "@inquirer/prompts";

import { MenuAction, MenuConfig } from "../types.js";

export const showChoicesAndExecute = async (
  { message, actions }: MenuConfig<any>,
  globals: any
) => {
  const choice = await select({
    message,
    choices: Object.entries(actions).map(([key, value]) => ({
      name: value.label,
      value: key,
    })),
  });

  const action = actions[choice];
  await action.handler(globals);

  return { executedAction: { name: choice, action } };
};

export const bottomBar = new inquirer.ui.BottomBar();
