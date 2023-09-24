import { MainMenuAction } from "../../types.js";

export const exit: MainMenuAction = {
  label: "Exit",
  handler: () => {
    process.exit(0);
  },
};
