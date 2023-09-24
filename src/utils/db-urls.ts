import { DatabaseRecord } from "../schemas/index.js";

export const isValidMongoDbConnectionString = (str: string) => {
  const regex =
    /^mongodb(\+srv)?:\/\/([a-zA-Z0-9-_%]+:([a-zA-Z0-9-_%]+)?@)?[a-zA-Z0-9-_%.]+(:\d+)?\/?([a-zA-Z0-9-_%.]+)?(\?(&?[a-zA-Z0-9-_|%.]+=[a-zA-Z0-9-_|%.]+)+)?$/;
  return regex.test(str);
};

export const isValidDbAlias = (str: string) => {
  return str.length > 0 && str.length < 256;
};

export const parseCredentialsFromConnectionString = (
  str: string
): { username?: string; password?: string } => {
  if (!str.includes("@")) return {};

  const [username, password] = str
    .split("@")[0]
    .replace(/^mongodb(\+srv)?:\/\//, "")
    .split(":");

  return {
    username,
    password,
  };
};

type ParsedUrl = {
  host: string;
  port: number;
  protocol: string;
  path: string | null;
  query: string | null;
  password: string | null;
  username: string | null;
};

export const parseUrl = (str: string): ParsedUrl => {
  const matchUpToPathRegex =
    /^mongodb(\+srv)?:\/\/([a-zA-Z0-9-_%]+:([a-zA-Z0-9-_%]+)?@)?[a-zA-Z0-9-_%.]+(:\d+)?/;

  const matchUpToPath = str.match(matchUpToPathRegex)?.[0];

  if (!matchUpToPath) throw Error("Unable to parse url.");

  const protocol = str.match(/^mongodb(\+srv)?/)?.[0];

  if (!protocol) throw Error("Unable to parse protocol.");

  const port = str.match(/^:(\d+)/)?.[0].replace(":", "");

  const host = matchUpToPath
    .replace(/^mongodb(\+srv)?:\/\/([a-zA-Z0-9-_%]+:([a-zA-Z0-9-_%]+)?@)?/, "")
    .replace(/:\d+$/, "");

  const [path, query] = str.replace(matchUpToPathRegex, "").split("?");

  const credentials = parseCredentialsFromConnectionString(str);

  return {
    host,
    port: port ? Number(port) : 27017,
    protocol,
    path: path || null,
    query: query || null,
    password: credentials.password || null,
    username: credentials.username || null,
  };
};

export const dbRecordToUrl = (dbRecord: DatabaseRecord) => {
  const parts = [
    `${dbRecord.protocol}://`,
    dbRecord.username && dbRecord.password
      ? `${dbRecord.username}:${dbRecord.password}@`
      : "",
    dbRecord.host,
    dbRecord.protocol !== "mongodb+srv" ? `:${dbRecord.port}` : "",
    `/${dbRecord.name}`,
    (dbRecord.query && `?${dbRecord.query}`) || "",
  ];

  return parts.join("");
};
