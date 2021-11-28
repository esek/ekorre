import Knex from 'knex';

let k: Knex;

if (process.env.DB_CLIENT === 'sqlite') {
  k = Knex({
    client: 'sqlite',
    connection: {
      filename: process.env.DB_FILE ?? '',
    },
    useNullAsDefault: true,
  });
  // Gör att vi får foreign keys i sqlite. Eftersom detta
  // Promise kommer lösas före alla queries på `knex`-objektet
  // är det lugnt att vi inte använder top-level `await` här
  k.raw('PRAGMA foreign_keys = ON;').then();
} else {
  k = Knex({
    client: process.env.DB_CLIENT ?? 'mysql2',
    connection: {
      host: process.env.DB_HOST ?? 'localhost',
    },
  });
}

const knex = k;

export default knex;
