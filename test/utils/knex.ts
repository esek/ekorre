import Knex from 'knex';

import { dbFileName } from '../testvariables';

const knex = Knex({
  client: 'sqlite',
  connection: {
    filename: dbFileName,
  },
});

export default knex;
