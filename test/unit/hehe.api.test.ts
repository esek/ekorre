import { HeheAPI } from '@/api/hehe.api';
import prisma from '@/api/prisma';
import { NotFoundError, ServerError } from '@/errors/request.errors';
import { AccessType, FileType } from '@generated/graphql';
import { PrismaFile, PrismaHehe } from '@prisma/client';

const api = new HeheAPI();

// Vi behöver en fejkfil p.g.a. FOREIGN KEY CONSTRAINT
const DUMMY_FILE: PrismaFile = {
  id: 'heheApiTestFile',
  refuploader: 'aa0000bb-s',
  name: 'Årets första och sista nummer',
  type: FileType.Pdf,
  folderLocation: '',
  accessType: AccessType.Public,
  createdAt: Date.now(),
};

const DUMMY_HEHE: PrismaHehe = {
  number: 1,
  year: 1658,
  refUploader: 'aa0000bb-s',
  refFile: 'heheApiTestFile',
  uploadedAt: Date.now(),
};

beforeEach(async () => {
  // Delete all rows
  await prisma.prismaHehe.deleteMany();
});

afterAll(async () => {
  await prisma.prismaHehe.deleteMany();
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
  await prisma.prismaHehe.createMany({ data: [localHehe0, localHehe1, DUMMY_HEHE] });

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
  await db<DatabaseHehe>(HEHE_TABLE).insert([localHehe0, localHehe1, DUMMY_HEHE]);

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
  await db<DatabaseHehe>(HEHE_TABLE).insert([localHehe0, localHehe1, DUMMY_HEHE]);

  await expect(api.getAllHehes(2)).resolves.toHaveLength(2);
});

test('getting all HeHEs when none exists', async () => {
  await expect(api.getAllHehes()).resolves.toHaveLength(0);
});

test('getting single HeHE', async () => {
  await db<DatabaseHehe>(HEHE_TABLE).insert(DUMMY_HEHE);
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
  await db<DatabaseHehe>(HEHE_TABLE).insert([localHehe0, localHehe1, DUMMY_HEHE]);

  const res = await api.getHehesByYear(DUMMY_HEHE.year);

  expect(res).toHaveLength(2);
  expect(res).toEqual(expect.arrayContaining([DUMMY_HEHE, localHehe0]));
});

test('getting multiple HeHEs by year when none exists', async () => {
  await expect(api.getHehesByYear(1999)).resolves.toHaveLength(0);
});

test('adding HeHE', async () => {
  await expect(api.getAllHehes()).resolves.toHaveLength(0);
  await expect(
    api.addHehe(DUMMY_HEHE.refuploader, DUMMY_HEHE.reffile, DUMMY_HEHE.number, DUMMY_HEHE.year),
  ).resolves.toBeTruthy();
  await expect(api.getAllHehes()).resolves.toEqual([DUMMY_HEHE]);
});

test('adding duplicate HeHE', async () => {
  await expect(api.getAllHehes()).resolves.toHaveLength(0);
  await expect(
    api.addHehe(DUMMY_HEHE.refuploader, DUMMY_HEHE.reffile, DUMMY_HEHE.number, DUMMY_HEHE.year),
  ).resolves.toBeTruthy();
  await expect(
    api.addHehe(DUMMY_HEHE.refuploader, DUMMY_HEHE.reffile, DUMMY_HEHE.number, DUMMY_HEHE.year),
  ).rejects.toThrowError(ServerError);
  await expect(api.getAllHehes()).resolves.toEqual([DUMMY_HEHE]);
});

test('removing HeHE', async () => {
  await expect(api.getAllHehes()).resolves.toHaveLength(0);
  await db<DatabaseHehe>(HEHE_TABLE).insert(DUMMY_HEHE);
  await expect(api.getAllHehes()).resolves.toHaveLength(1);
  await expect(api.removeHehe(DUMMY_HEHE.number, DUMMY_HEHE.year)).resolves.toBeTruthy();
});

test('removing non-existant HeHE', async () => {
  await expect(api.removeHehe(0, 1999)).rejects.toThrowError(ServerError);
});
