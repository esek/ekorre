import { FILE_TABLE, HEHE_TABLE } from '../../src/api/constants';
import { HeheAPI } from '../../src/api/hehe.api';
import knex from '../../src/api/knex';
import { NotFoundError, ServerError } from '../../src/errors/RequestErrors';
import { AccessType, FileType } from '../../src/graphql.generated';
import { DatabaseFile } from '../../src/models/db/file';
import { DatabaseHehe } from '../../src/models/db/hehe';

const api = new HeheAPI();

// Vi behöver en fejkfil p.g.a. FOREIGN KEY CONSTRAINT
const DUMMY_FILE: DatabaseFile = {
  id: 'heheApiTestFile',
  refuploader: 'aa0000bb-s',
  name: 'Årets första och sista nummer',
  type: FileType.Pdf,
  folderLocation: '',
  accessType: AccessType.Public,
  createdAt: Date.now(),
};

const DUMMY_HEHE: DatabaseHehe = {
  number: 1,
  year: 1658,
  refuploader: 'aa0000bb-s',
  reffile: 'heheApiTestFile',
};

beforeEach(async () => {
  // Delete all rows
  await knex<DatabaseHehe>(HEHE_TABLE).delete().whereNotNull('number');
});

// Vi sparar databasen före och lägger tillbaka den efter
let dbBefore: DatabaseHehe[];
beforeAll(async () => {
  dbBefore = await knex<DatabaseHehe>(HEHE_TABLE).select('*');
  await knex<DatabaseFile>(FILE_TABLE).insert(DUMMY_FILE);
});

afterAll(async () => {
  await knex<DatabaseHehe>(HEHE_TABLE).delete().whereNotNull('number');
  await knex<DatabaseFile>(FILE_TABLE).delete().where('id', DUMMY_FILE.id);
  if (dbBefore != null && dbBefore.length > 0) {
    await knex<DatabaseHehe>(HEHE_TABLE).insert(dbBefore);
  }
});

test('getting all HeHEs without limit, ascending order', async () => {
  const localHehe0 = {
    ...DUMMY_HEHE,
    number: 2,
  };
  const localHehe1 = {
    ...DUMMY_HEHE,
    year: 2021,
  };

  // Lägg till våra HeHE
  await knex<DatabaseHehe>(HEHE_TABLE).insert([localHehe0, localHehe1, DUMMY_HEHE]);

  // Kontrollerar att de kommer i exakt rätt ordning
  await expect(api.getAllHehes(undefined, 'asc')).resolves.toEqual([
    DUMMY_HEHE,
    localHehe0,
    localHehe1,
  ]);
});

test('getting all HeHEs without limit, descending order', async () => {
  const localHehe0 = {
    ...DUMMY_HEHE,
    number: 2,
  };
  const localHehe1 = {
    ...DUMMY_HEHE,
    year: 2021,
  };

  // Lägg till våra HeHE
  await knex<DatabaseHehe>(HEHE_TABLE).insert([localHehe0, localHehe1, DUMMY_HEHE]);

  // Kontrollerar att de kommer i exakt rätt ordning
  await expect(api.getAllHehes(undefined, 'desc')).resolves.toEqual([
    localHehe1,
    localHehe0,
    DUMMY_HEHE,
  ]);
});

test('getting all HeHEs with limit', async () => {
  const localHehe0 = {
    ...DUMMY_HEHE,
    number: 2,
  };
  const localHehe1 = {
    ...DUMMY_HEHE,
    year: 2021,
  };

  // Lägg till våra HeHE
  await knex<DatabaseHehe>(HEHE_TABLE).insert([localHehe0, localHehe1, DUMMY_HEHE]);

  await expect(api.getAllHehes(2)).resolves.toHaveLength(2);
});

test('getting all HeHEs when none exists', async () => {
  await expect(api.getAllHehes()).rejects.toThrowError(NotFoundError);
});

test('getting single HeHE', async () => {
  await knex<DatabaseHehe>(HEHE_TABLE).insert(DUMMY_HEHE);
  await expect(api.getHehe(DUMMY_HEHE.number, DUMMY_HEHE.year)).resolves.toMatchObject(DUMMY_HEHE);
});

test('getting non-existant single HeHE', async () => {
  await expect(api.getHehe(0, 1999)).rejects.toThrowError(NotFoundError);
});

test('getting multiple HeHEs by year', async () => {
  const localHehe0 = {
    ...DUMMY_HEHE,
    number: 2,
  };
  const localHehe1 = {
    ...DUMMY_HEHE,
    year: 2021,
  };

  // Lägg till våra HeHE
  await knex<DatabaseHehe>(HEHE_TABLE).insert([localHehe0, localHehe1, DUMMY_HEHE]);

  const res = await api.getHehesByYear(DUMMY_HEHE.year);

  expect(res).toHaveLength(2);
  expect(res).toEqual(expect.arrayContaining([DUMMY_HEHE, localHehe0]));
});

test('getting multiple HeHEs by year when none exists', async () => {
  await expect(api.getHehesByYear(1999)).rejects.toThrowError(NotFoundError);
});

test('adding HeHE', async () => {
  await expect(api.getAllHehes()).rejects.toThrowError(NotFoundError);
  await expect(
    api.addHehe(DUMMY_HEHE.refuploader, DUMMY_HEHE.reffile, DUMMY_HEHE.number, DUMMY_HEHE.year),
  ).resolves.toBeTruthy();
  await expect(api.getAllHehes()).resolves.toEqual([DUMMY_HEHE]);
});

test('adding duplicate HeHE', async () => {
  await expect(api.getAllHehes()).rejects.toThrowError(NotFoundError);
  await expect(
    api.addHehe(DUMMY_HEHE.refuploader, DUMMY_HEHE.reffile, DUMMY_HEHE.number, DUMMY_HEHE.year),
  ).resolves.toBeTruthy();
  await expect(
    api.addHehe(DUMMY_HEHE.refuploader, DUMMY_HEHE.reffile, DUMMY_HEHE.number, DUMMY_HEHE.year),
  ).rejects.toThrowError(ServerError);
  await expect(api.getAllHehes()).resolves.toEqual([DUMMY_HEHE]);
});

test('removing HeHE', async () => {
  await expect(api.getAllHehes()).rejects.toThrowError(NotFoundError);
  await knex<DatabaseHehe>(HEHE_TABLE).insert(DUMMY_HEHE);
  await expect(api.getAllHehes()).resolves.toHaveLength(1);
  await expect(api.removeHehe(DUMMY_HEHE.number, DUMMY_HEHE.year)).resolves.toBeTruthy();
});

test('removing non-existant HeHE', async () => {
  await expect(api.removeHehe(0, 1999)).rejects.toThrowError(ServerError);
});
