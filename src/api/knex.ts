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
  //
  // Vi ökar även timeout, då våra tester vill göra väldigt mycket
  // parallellt (vilket sqlite INTE gillar). Default är 30000.
  k.raw('PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 1200000;').then();
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
