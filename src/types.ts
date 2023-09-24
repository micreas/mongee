export type MenuAction<T = any> = {
  label: string;
  handler: (globals: T) => void | Promise<void>;
};

export type MenuConfig<T extends MenuAction> = {
  message: string;
  actions: { [label: string]: T };
};

export type MainMenuGlobals = {
  getMasterPassword: () => string;
  setMasterPassword: (password: string) => void;
};

export type MainMenuAction = MenuAction<MainMenuGlobals>;

export type MainMenuConfig = MenuConfig<MainMenuAction>;
