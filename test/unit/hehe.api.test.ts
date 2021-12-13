import { HEHE_TABLE } from '../../src/api/constants';
import { HeheAPI } from '../../src/api/hehe.api';
import knex from '../../src/api/knex';
import { DatabaseHehe } from '../../src/models/db/hehe';

const api = new HeheAPI();

beforeEach(async () => {
  // Delete all rows
  await knex<DatabaseHehe>(HEHE_TABLE).delete().where('id', '!=', 'null');
});

// Vi sparar databasen före och lägger tillbaka den efter
let dbBefore: DatabaseHehe[];
beforeAll(async () => {
  dbBefore = await knex<DatabaseHehe>(HEHE_TABLE).select('*');
});

afterAll(async () => {
  await knex<DatabaseHehe>(HEHE_TABLE).delete().where('number', '!=', 'null');
  await knex<DatabaseHehe>(HEHE_TABLE).insert(dbBefore);
});
