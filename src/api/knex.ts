import Knex from 'knex';

let k: Knex;

if (process.env.DB_CLIENT === 'sqlite') {
  k = Knex({
    client: 'sqlite',
    connection: {
      filename: process.env.DB_FILE ?? '',
    },
  });
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
