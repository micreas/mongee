import knexPkg from "knex";
import path from "path";
import * as url from "url";

const __dirname = url.fileURLToPath(new URL(".", import.meta.url));

export const knex = knexPkg.knex({
  client: "sqlite3",

  connection: {
    filename: path.join(__dirname, "../db.sqlite"),
  },

  useNullAsDefault: true,
});

export const initDatabase = async () => {
  if (!(await knex.schema.hasTable("databases"))) {
    await knex.schema.createTable("databases", (table) => {
      table.increments("id").notNullable();
      table.string("alias").notNullable();
      table.string("name").notNullable();
      table.string("host").notNullable();
      table.integer("port").notNullable();
      table.string("protocol").notNullable();
      table.string("path");
      table.string("query");
      table.string("username");
      table.string("password");
      table.timestamps(true, true);
    });
  }
  if (!(await knex.schema.hasTable("master_passwords"))) {
    await knex.schema.createTable("master_passwords", (table) => {
      table.increments("id").notNullable();
      table.string("password").notNullable();
    });
  }
};
