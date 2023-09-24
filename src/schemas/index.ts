export type DatabaseRecord = {
  id: number;
  alias: string;
  name: string;
  host: string;
  port: number;
  protocol: string;
  path: string | null;
  query: string | null;
  username: string | null;
  password: string | null;
};

export type MasterPasswordRecord = { id: number; password: string };
