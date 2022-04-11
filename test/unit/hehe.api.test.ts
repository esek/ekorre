import { HeheAPI } from '@/api/hehe.api';
import prisma from '@/api/prisma';
import { NotFoundError, ServerError } from '@/errors/request.errors';
import { UserAPI } from '@api/user';
import { PrismaHehe } from '@prisma/client';

const api = new HeheAPI();
const userApi = new UserAPI();

let ctr = 1;

const USERNAME0 = 'aa0000bb-s';

const DUMMY_HEHE: PrismaHehe = {
  number: 1,
  year: 1658,
  refUploader: USERNAME0,
  refFile: '',
  uploadedAt: new Date(),
};

const generateDummyHehe = async (overrides: Partial<PrismaHehe> = {}): Promise<PrismaHehe> => {
  ctr += 1;
  const { id } = await prisma.prismaFile.create({
    data: {
      refUploader: USERNAME0,
      name: `heheApiTestFile${ctr}`,
      folderLocation: 'heheApiTestFile',
      type: 'dummy',
      accessType: 'PUBLIC'
    }
  });

  return {
    ...DUMMY_HEHE,
    number: ctr,
    refFile: id,
    uploadedAt: new Date(),
    ...overrides,
  };
};

const generateDummyHehes = () => {
  const localHehe0 = generateDummyHehe({ year: 2021, number: 3 });
  const localHehe1 = generateDummyHehe({ number: 1 });
  const localHehe2 = generateDummyHehe({ number: 2 });

  return Promise.all([localHehe0, localHehe1, localHehe2]);
};

beforeAll(async () => {
  await userApi.clear();
  await userApi.createUser({
    firstName: 'Test',
    lastName: 'Testsson',
    class: 'EXX',
    password: 'test',
    email: 'test@esek.se',
    username: USERNAME0,
  });
});

beforeEach(async () => {
  // Delete all rows
  await api.clear();
});

afterAll(async () => {
  await api.clear();
  await userApi.clear();
  await prisma.prismaFile.deleteMany({
    where: {
      name: {
        contains: 'heheApiTestFile',
      }
    }
  });
});

test('getting all HeHEs without limit, ascending order', async () => {
  const hehes = await generateDummyHehes();

  // Lägg till våra HeHE
  await prisma.prismaHehe.createMany({ data: hehes });

  const [localHehe0, localHehe1, localHehe2] = hehes;

  // Kontrollerar att de kommer i exakt rätt ordning
  // i.e. sortera först efter år och sen efter nummer
  await expect(api.getAllHehes(undefined, 'asc')).resolves.toEqual([
    localHehe1,
    localHehe2,
    localHehe0,
  ]);
});

test('getting all HeHEs without limit, descending order', async () => {
  const hehes = await generateDummyHehes();

  // Lägg till våra HeHE
  await prisma.prismaHehe.createMany({ data: hehes });

  const [localHehe0, localHehe1, localHehe2] = hehes;
  // Kontrollerar att de kommer i exakt rätt ordning
  // i.e. sortera först efter år och sen efter nummer
  await expect(api.getAllHehes(undefined, 'desc')).resolves.toEqual([
    localHehe0,
    localHehe2,
    localHehe1,
  ]);
});

test('getting all HeHEs with limit', async () => {
  const hehes = await generateDummyHehes();

  // Lägg till våra HeHE
  await prisma.prismaHehe.createMany({ data: hehes });

  await expect(api.getAllHehes(2)).resolves.toHaveLength(2);
});

test('getting all HeHEs when none exists', async () => {
  await expect(api.getAllHehes()).resolves.toHaveLength(0);
});

test('getting single HeHE', async () => {
  const dummy = await generateDummyHehe();
  await prisma.prismaHehe.create({ data: dummy });
  await expect(api.getHehe(dummy.number, dummy.year)).resolves.toMatchObject(dummy);
});

test('getting non-existant single HeHE', async () => {
  await expect(api.getHehe(0, 1999)).rejects.toThrowError(NotFoundError);
});

test('getting multiple HeHEs by year', async () => {
  const hehes = await generateDummyHehes();

  const [, localHehe0, localHehe1] = hehes;

  // Lägg till våra HeHE
  await prisma.prismaHehe.createMany({ data: hehes});

  const res = await api.getHehesByYear(DUMMY_HEHE.year);

  expect(res).toHaveLength(2);
  expect(res).toEqual(expect.arrayContaining([localHehe1, localHehe0]));
});

test('getting multiple HeHEs by year when none exists', async () => {
  await expect(api.getHehesByYear(1999)).resolves.toHaveLength(0);
});

test('adding HeHE', async () => {
  const dummy = await generateDummyHehe();

  await expect(api.getAllHehes()).resolves.toHaveLength(0);
  await expect(
    api.addHehe(dummy.refUploader, dummy.refFile, dummy.number, dummy.year),
  ).resolves.toBeTruthy();

  // Skippa datum
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { uploadedAt, ...rest } = dummy;
  await expect(api.getAllHehes()).resolves.toMatchObject([rest]);
});

test('adding duplicate HeHE', async () => {
  const dummy = await generateDummyHehe();
  await expect(api.getAllHehes()).resolves.toHaveLength(0);
  await expect(
    api.addHehe(dummy.refUploader, dummy.refFile, dummy.number, dummy.year),
  ).resolves.toBeTruthy();
  await expect(
    api.addHehe(dummy.refUploader, dummy.refFile, dummy.number, dummy.year),
  ).rejects.toThrowError(ServerError);
  // Skippa datum
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { uploadedAt, ...rest } = dummy;
  await expect(api.getAllHehes()).resolves.toMatchObject([rest]);
});

test('removing HeHE', async () => {
  await expect(api.getAllHehes()).resolves.toHaveLength(0);
  const dummy = await generateDummyHehe();
  await prisma.prismaHehe.create({ data: dummy });
  await expect(api.getAllHehes()).resolves.toHaveLength(1);
  await expect(api.removeHehe(dummy.number, dummy.year)).resolves.toBeTruthy();
  await expect(api.getAllHehes()).resolves.toHaveLength(0);
});

test('removing non-existant HeHE', async () => {
  await expect(api.removeHehe(0, 1999)).rejects.toThrowError(ServerError);
});
