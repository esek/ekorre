import prisma from '@/api/prisma';
import { BadRequestError, NotFoundError, ServerError } from '@/errors/request.errors';
import { ElectionAPI } from '@api/election';
import { NominationAnswer } from '@generated/graphql';

const api = new ElectionAPI();

/**
 * Lägger till ett antal dummy elections, markerade som stängda
 * @param creatorUsername Användarnamnet på skaparen av valen
 * @param nominationsHidden Om valet ska ha anonyma nomineringssvar
 * @param n Antalet val att lägga till och stänga
 */
const addDummyElections = async (
  creatorUsername: string,
  nominationsHidden: boolean,
  n: number,
) => {
  const queries = [];
  for (let i = 0; i < n; i -= -1) {
    queries.push(
      prisma.prismaElection.create({
        data: {
          refCreator: creatorUsername,
          nominationsHidden,
          openedAt: new Date(Date.now() + 100),
          closedAt: new Date(Date.now() + 200),
          open: false,
        },
      }),
    );
  }
  // Vi bryr oss inte om ordningen (de är identiska),
  // så vi väntar på alla istället för att göra
  // i loopen
  await Promise.all(queries);
};

beforeAll(async () => {
  await api.clear();
});

afterEach(async () => {
  await api.clear();
});

test('finding latest elections without limit', async () => {
  await addDummyElections('aa0000bb-s', true, 5);
  const elections = await api.getLatestElections();
  expect(elections.length).toEqual(5);
});

test('finding latest elections with limit', async () => {
  await addDummyElections('aa0000bb-s', true, 5);

  // Vi gör senaste valet unikt så vi kan identifiera det
  await prisma.prismaElection.create({
    data: {
      refCreator: 'bb1111cc-s',
      nominationsHidden: false,
    },
  });

  const election = await api.getLatestElections(1);

  expect(election.length).toEqual(1);
  expect(election[0].refCreator).toEqual('bb1111cc-s');
  expect(election[0].nominationsHidden).toBeFalsy();
});

test('getting open election', async () => {
  await addDummyElections('aa0000bb-s', true, 3);
  await expect(api.getOpenElection()).rejects.toThrowError(NotFoundError);

  await prisma.prismaElection.create({
    data: {
      refCreator: 'bb1111cc-s',
      nominationsHidden: false,
      openedAt: new Date(Date.now() + 100),
      open: true,
    },
  });

  const openElection = await api.getOpenElection();

  // Hantera att SQLite sparar bools som 0 och 1
  openElection.nominationsHidden = !!openElection.nominationsHidden;
  openElection.open = !!openElection.open;

  expect(openElection).toMatchObject({
    refCreator: 'bb1111cc-s',
    nominationsHidden: false,
    open: true,
  });
});

test('getting multiple elections', async () => {
  await addDummyElections('aa0000bb-s', true, 3);

  const latestElections = await api.getLatestElections(3);
  const electionIds = latestElections.map((e) => e.id);

  const multipleElections = await api.getMultipleElections(electionIds);
  expect(latestElections.length).toEqual(multipleElections.length);

  // Kolla att intehållet är samma
  expect(multipleElections).toEqual(expect.arrayContaining(latestElections));
});

test('getting multiple meetings when none exists', async () => {
  await expect(api.getMultipleElections([1, 2, 69, 905393])).resolves.toHaveLength(0);
});

test('getting nominations for post', async () => {
  const { id: electionId } = await api.createElection('bb1111cc-s', [1, 2, 3], false);
  await api.openElection(electionId);

  await expect(api.nominate('aa0000bb-s', [1, 3])).resolves.toBeTruthy();
  await expect(api.getNominations(electionId, 1)).resolves.toEqual(
    expect.arrayContaining([
      {
        refElection: electionId,
        refUser: 'aa0000bb-s',
        refPost: 1,
        answer: NominationAnswer.NotAnswered,
      },
    ]),
  );
  await expect(api.getNominations(electionId, 2)).resolves.toHaveLength(0);
});

test('nominations for non-electables are hidden', async () => {
  const { id: electionId } = await api.createElection('bb1111cc-s', [], false);
  await prisma.prismaNomination.create({
    data: {
      refElection: electionId,
      refUser: 'aa0000bb-s',
      refPost: 1, // Valid post, men inte electable
      answer: NominationAnswer.NotAnswered,
    },
  });

  // Denna nominering borde aldrig synas!
  await expect(api.getNumberOfNominations(electionId)).resolves.toEqual(0);
  await expect(api.getNumberOfNominations(electionId, 1)).resolves.toEqual(0);
  await expect(api.getAllNominations(electionId)).resolves.toHaveLength(0);
  await expect(api.getAllNominationsForUser(electionId, 'aa0000bb-s')).resolves.toHaveLength(0);
});

test('getting all nominations with specified answer', async () => {
  const { id: electionId } = await api.createElection('bb1111cc-s', [1, 2, 3], false);
  await api.openElection(electionId);

  // Nominera lite folk
  await expect(api.nominate('aa0000bb-s', [1, 3])).resolves.toBeTruthy();
  await expect(api.nominate('bb1111cc-s', [2])).resolves.toBeTruthy();

  // Svara på nomineringarna
  await expect(
    api.respondToNomination('aa0000bb-s', 1, NominationAnswer.Yes),
  ).resolves.toBeTruthy();
  await expect(api.respondToNomination('aa0000bb-s', 3, NominationAnswer.No)).resolves.toBeTruthy();
  await expect(
    api.respondToNomination('bb1111cc-s', 2, NominationAnswer.Yes),
  ).resolves.toBeTruthy();

  // Kontrollera svaret
  const nominations = await api.getAllNominations(electionId, NominationAnswer.Yes);
  expect(nominations).toHaveLength(2);
  expect(nominations).toEqual(
    expect.arrayContaining([
      {
        refElection: electionId,
        refUser: 'aa0000bb-s',
        refPost: 1,
        answer: NominationAnswer.Yes,
      },
      {
        refElection: electionId,
        refUser: 'bb1111cc-s',
        refPost: 2,
        answer: NominationAnswer.Yes,
      },
    ]),
  );
});

test('getting all nominations without specified answer', async () => {
  const { id: electionId } = await api.createElection('bb1111cc-s', [1, 2, 3], false);
  await api.openElection(electionId);

  // Nominera lite folk
  await expect(api.nominate('aa0000bb-s', [1, 3])).resolves.toBeTruthy();
  await expect(api.nominate('bb1111cc-s', [2])).resolves.toBeTruthy();

  // Svara på några av nomineringarna
  await expect(
    api.respondToNomination('aa0000bb-s', 1, NominationAnswer.Yes),
  ).resolves.toBeTruthy();
  await expect(api.respondToNomination('aa0000bb-s', 3, NominationAnswer.No)).resolves.toBeTruthy();

  // Kontrollera svaret
  const nominations = await api.getAllNominations(electionId);
  expect(nominations).toHaveLength(3);
  expect(nominations).toEqual(
    expect.arrayContaining([
      {
        refElection: electionId,
        refUser: 'aa0000bb-s',
        refPost: 1,
        answer: NominationAnswer.Yes,
      },
      {
        refElection: electionId,
        refUser: 'aa0000bb-s',
        refPost: 3,
        answer: NominationAnswer.No,
      },
      {
        refElection: electionId,
        refUser: 'bb1111cc-s',
        refPost: 2,
        answer: NominationAnswer.NotAnswered,
      },
    ]),
  );
});

test('getting all nominations when none exists', async () => {
  const { id: electionId } = await api.createElection('bb1111cc-s', [1, 2, 3], false);
  await api.openElection(electionId);

  await expect(api.getAllNominations(electionId)).resolves.toHaveLength(0);
  await expect(
    api.getAllNominations(electionId, NominationAnswer.NotAnswered),
  ).resolves.toHaveLength(0);
});

test('getting all nominations for user with specified answer', async () => {
  const { id: electionId } = await api.createElection('bb1111cc-s', [1, 2, 3], false);
  await api.openElection(electionId);

  // Nominera lite folk
  await expect(api.nominate('aa0000bb-s', [1, 3])).resolves.toBeTruthy();
  await expect(api.nominate('bb1111cc-s', [2])).resolves.toBeTruthy();

  // Svara på nomineringarna
  await expect(
    api.respondToNomination('aa0000bb-s', 1, NominationAnswer.Yes),
  ).resolves.toBeTruthy();
  await expect(api.respondToNomination('aa0000bb-s', 3, NominationAnswer.No)).resolves.toBeTruthy();
  await expect(
    api.respondToNomination('bb1111cc-s', 2, NominationAnswer.Yes),
  ).resolves.toBeTruthy();

  // Kontrollera svaret
  const nominations = await api.getAllNominationsForUser(
    electionId,
    'aa0000bb-s',
    NominationAnswer.Yes,
  );
  expect(nominations).toHaveLength(1);
  expect(nominations).toEqual(
    expect.arrayContaining([
      {
        refElection: electionId,
        refUser: 'aa0000bb-s',
        refPost: 1,
        answer: NominationAnswer.Yes,
      },
    ]),
  );
});

test('getting all nominations for user without specified answer', async () => {
  const { id: electionId } = await api.createElection('bb1111cc-s', [1, 2, 3], false);
  await api.openElection(electionId);

  // Nominera lite folk
  await expect(api.nominate('aa0000bb-s', [1, 3])).resolves.toBeTruthy();
  await expect(api.nominate('bb1111cc-s', [2])).resolves.toBeTruthy();

  // Svara på nomineringarna
  await expect(
    api.respondToNomination('aa0000bb-s', 1, NominationAnswer.Yes),
  ).resolves.toBeTruthy();
  await expect(api.respondToNomination('aa0000bb-s', 3, NominationAnswer.No)).resolves.toBeTruthy();
  await expect(
    api.respondToNomination('bb1111cc-s', 2, NominationAnswer.Yes),
  ).resolves.toBeTruthy();

  // Kontrollera svaret
  const nominations = await api.getAllNominationsForUser(electionId, 'aa0000bb-s');
  expect(nominations).toHaveLength(2);
  expect(nominations).toEqual(
    expect.arrayContaining([
      {
        refElection: electionId,
        refUser: 'aa0000bb-s',
        refPost: 1,
        answer: NominationAnswer.Yes,
      },
      {
        refElection: electionId,
        refUser: 'aa0000bb-s',
        refPost: 3,
        answer: NominationAnswer.No,
      },
    ]),
  );
});

test('getting all nominations for user when none exists', async () => {
  const { id: electionId } = await api.createElection('bb1111cc-s', [1, 2, 3], false);
  await api.openElection(electionId);

  await expect(api.getAllNominationsForUser(electionId, 'aa0000bb-s')).resolves.toHaveLength(0);
  await expect(
    api.getAllNominations(electionId, NominationAnswer.NotAnswered),
  ).resolves.toHaveLength(0);
});

test('getting number of nominations', async () => {
  const { id: electionId } = await api.createElection('aa0000bb-s', [1, 2, 3], false);
  await api.openElection(electionId);

  // Nominera lite folk
  await expect(api.nominate('aa0000bb-s', [1, 3])).resolves.toBeTruthy();
  await expect(api.nominate('bb1111cc-s', [2])).resolves.toBeTruthy();

  expect(await api.getNumberOfNominations(electionId)).toEqual(3);
  expect(await api.getNumberOfNominations(electionId, 1)).toEqual(1);
});

test('getting number of proposals', async () => {
  const { id: electionId } = await api.createElection('aa0000bb-s', [1, 2], false);
  await api.openElection(electionId);

  // Nominera lite folk
  await expect(api.propose(electionId, 'aa0000bb-s', 1)).resolves.toBeTruthy();
  await expect(api.propose(electionId, 'bb1111cc-s', 2)).resolves.toBeTruthy();

  expect(await api.getNumberOfProposals(electionId)).toEqual(2);
  expect(await api.getNumberOfProposals(electionId, 1)).toEqual(1);
});

test('getting all proposals', async () => {
  const { id: electionId } = await api.createElection('aa0000bb-s', [1, 2], false);
  await api.openElection(electionId);

  // Nominera lite folk
  await expect(api.propose(electionId, 'aa0000bb-s', 1)).resolves.toBeTruthy();
  await expect(api.propose(electionId, 'bb1111cc-s', 2)).resolves.toBeTruthy();

  const proposals = await api.getAllProposals(electionId);
  expect(proposals).toHaveLength(2);
  expect(proposals).toEqual(
    expect.arrayContaining([
      {
        refElection: electionId,
        refUser: 'aa0000bb-s',
        refPost: 1,
      },
      {
        refElection: electionId,
        refUser: 'bb1111cc-s',
        refPost: 2,
      },
    ]),
  );
});

test('getting all proposals when none exists', async () => {
  const { id: electionId } = await api.createElection('aa0000bb-s', [1, 2], false);
  await api.openElection(electionId);

  await expect(api.getAllProposals(electionId)).resolves.toHaveLength(0);
});

test('getting all electables', async () => {
  const { id: electionId } = await api.createElection('aa0000bb-s', [1, 2], false);
  const electables = await api.getAllElectables(electionId);
  expect(electables).toHaveLength(2);
  expect(electables).toEqual(expect.arrayContaining([1, 2]));
});

test('getting all electables when none exists', async () => {
  const { id: electionId } = await api.createElection('aa0000bb-s', [], false);
  await expect(api.getAllElectables(electionId)).resolves.toHaveLength(0);
});

test('creating election returns its ID', async () => {
  const { id: electionId } = await api.createElection('aa0000bb-s', [], false);
  const expectedElectionId = (await api.getLatestElections(1))[0].id;
  expect(electionId).toEqual(expectedElectionId);
});

test('creating election with created, but never opened, previous election', async () => {
  await api.createElection('aa0000bb-s', [], false);
  await expect(api.createElection('bb1111cc-s', [], false)).rejects.toThrowError(BadRequestError);

  // Vi vill se till att ett nytt val faktiskt inte skapades
  expect((await api.getLatestElections(1))[0]).toMatchObject({
    refCreator: 'aa0000bb-s',
  });
});

test('creating election with previous created, opened, but not closed election', async () => {
  const { id: electionId } = await api.createElection('aa0000bb-s', [], false);
  await api.openElection(electionId);
  await expect(api.createElection('bb1111cc-s', [], false)).rejects.toThrowError(BadRequestError);

  // Vi vill se till att ett nytt val faktiskt inte skapades
  expect((await api.getLatestElections(1))[0]).toMatchObject({
    refCreator: 'aa0000bb-s',
  });
});

test('creating election with previous created, opened and closed election', async () => {
  const { id: electionId } = await api.createElection('aa0000bb-s', [], false);
  await api.openElection(electionId);
  await api.closeElection();

  // Vårt nya val borde ha förra ID:t + 1
  const { id: newId } = await api.createElection('bb1111cc-s', [], false);
  expect(newId).toEqual(electionId + 1);

  // Vi vill se till att ett nytt val faktiskt inte skapades
  expect((await api.getLatestElections(1))[0]).toMatchObject({
    refCreator: 'bb1111cc-s',
  });
});

test('creating election with invalid electables', async () => {
  await expect(api.createElection('aa0000bb-s', [-1, -2], true)).rejects.toThrowError(ServerError);
});

test('adding valid electables to non-existant election', async () => {
  await expect(api.addElectables(-1, [1])).rejects.toThrowError(ServerError);
});

test('adding valid electables to election', async () => {
  const { id: electionId } = await api.createElection('aa0000bb-s', [], false);
  await expect(api.getAllElectables(electionId)).resolves.toHaveLength(0);
  await expect(api.addElectables(electionId, [1])).resolves.toBeTruthy();
  await expect(api.getAllElectables(electionId)).resolves.toEqual([1]);

  // Fungerar också för öppet val
  await expect(api.openElection(electionId)).resolves.toBeTruthy();
  await expect(api.getAllElectables(electionId)).resolves.toEqual([1]);
  await expect(api.addElectables(electionId, [3])).resolves.toBeTruthy();
  await expect(api.getAllElectables(electionId)).resolves.toEqual(expect.arrayContaining([1, 3]));
});

test('adding mixed valid and non-valid electables to election', async () => {
  const { id: electionId } = await api.createElection('aa0000bb-s', [], false);
  await expect(api.getAllElectables(electionId)).resolves.toHaveLength(0);
  await expect(api.addElectables(electionId, [1, -1])).rejects.toThrowError(ServerError);
  await expect(api.getAllElectables(electionId)).resolves.toHaveLength(0);
});

test('adding empty list of electables to election', async () => {
  const { id: electionId } = await api.createElection('aa0000bb-s', [], false);
  await expect(api.addElectables(electionId, [])).rejects.toThrowError(BadRequestError);
});

test('adding duplicate electables', async () => {
  const { id: electionId } = await api.createElection('aa0000bb-s', [], false);

  // I samma anrop
  await expect(api.addElectables(electionId, [1, 1])).rejects.toThrowError(ServerError);
  await expect(api.getAllElectables(electionId)).resolves.toHaveLength(0);

  // I olika anrop
  await expect(api.addElectables(electionId, [1])).resolves.toBeTruthy();
  await expect(api.addElectables(electionId, [1])).rejects.toThrowError(ServerError);
  await expect(api.getAllElectables(electionId)).resolves.toEqual([1]);
});

test('removing valid electables from non-existant election', async () => {
  await expect(api.removeElectables(-1, [1])).rejects.toThrowError(ServerError);
});

test('removing valid electables from election', async () => {
  const { id: electionId } = await api.createElection('aa0000bb-s', [1, 2], false);
  await expect(api.getAllElectables(electionId)).resolves.toEqual(expect.arrayContaining([1, 2]));
  await expect(api.removeElectables(electionId, [1])).resolves.toBeTruthy();
  await expect(api.getAllElectables(electionId)).resolves.toEqual([2]);
});

test('removing mixed valid and non-valid electables from election', async () => {
  const { id: electionId } = await api.createElection('aa0000bb-s', [1, 2, 3], false);

  await expect(api.getAllElectables(electionId)).resolves.toEqual(
    expect.arrayContaining([1, 2, 3]),
  );

  await expect(api.removeElectables(electionId, [1, -1])).rejects.toThrowError(ServerError);

  // Kontrollera att Macapär trots allt togs bort
  const electablesLeft = await api.getAllElectables(electionId);
  expect(electablesLeft).toHaveLength(2);
  expect(electablesLeft).toEqual(expect.arrayContaining([2, 3]));
});

test('removing empty list of electables from election', async () => {
  const { id: electionId } = await api.createElection('aa0000bb-s', [], false);
  await expect(api.getAllElectables(electionId)).resolves.toHaveLength(0);
  await expect(api.removeElectables(electionId, [])).rejects.toThrowError(BadRequestError);
  await expect(api.getAllElectables(electionId)).resolves.toHaveLength(0);
});

test('removing valid electable not in election', async () => {
  const { id: electionId } = await api.createElection('aa0000bb-s', [], false);
  await expect(api.getAllElectables(electionId)).resolves.toHaveLength(0);
  await expect(api.removeElectables(electionId, [1])).rejects.toThrowError(ServerError);
});

test('setting an empty array of electables in an existing election', async () => {
  const { id: electionId } = await api.createElection('aa0000bb-s', [], false);
  await expect(api.setElectables(electionId, [])).resolves.toBeTruthy();
  await expect(api.getAllElectables(electionId)).resolves.toHaveLength(0);
});

test('overriding existing electables', async () => {
  const { id: electionId } = await api.createElection('aa0000bb-s', [], false);
  await expect(api.addElectables(electionId, [1, 2])).resolves.toBeTruthy();
  await expect(api.setElectables(electionId, [3])).resolves.toBeTruthy();
  await expect(api.getAllElectables(electionId)).resolves.toEqual([3]);
});

test('setting hidden nominations', async () => {
  const { id: electionId } = await api.createElection('aa0000bb-s', [], false);
  expect((await api.getLatestElections(1))[0].nominationsHidden).toBeFalsy();

  // Faktiskt byte
  await expect(api.setHiddenNominations(electionId, true)).resolves.toBeTruthy();
  expect((await api.getLatestElections(1))[0].nominationsHidden).toBeTruthy();

  // Kolla att man kan ändra tillbaka
  await expect(api.setHiddenNominations(electionId, false)).resolves.toBeTruthy();
  expect((await api.getLatestElections(1))[0].nominationsHidden).toBeFalsy();
});

test('setting hidden nominations on non-existant election', async () => {
  await expect(api.setHiddenNominations(-1, false)).rejects.toThrowError(BadRequestError);
});

test('opening non-existant election', async () => {
  await expect(api.openElection(-1)).rejects.toThrowError(BadRequestError);
});

test('opening election', async () => {
  const { id: electionId } = await api.createElection('aa0000bb-s', [], false);
  let [election] = await api.getMultipleElections([electionId]);
  expect(election.openedAt).toBeNull();
  expect(election.open).toBeFalsy();

  await expect(api.openElection(electionId)).resolves.toBeTruthy();
  [election] = await api.getMultipleElections([electionId]);

  // Kontrollera att vi faktiskt öppnade valet
  expect(election.openedAt).not.toBeNull();
  expect(election.open).toBeTruthy();
});

test('opening already closed election', async () => {
  const { id: electionId } = await api.createElection('aa0000bb-s', [], false);
  await expect(api.openElection(electionId)).resolves.toBeTruthy();
  let [election] = await api.getMultipleElections([electionId]);
  expect(election.open).toBeTruthy();

  await expect(api.closeElection()).resolves.toBeTruthy();
  [election] = await api.getMultipleElections([electionId]);
  expect(election.open).toBeFalsy();

  // Vi ska inte kunna öppna ett redan stängt val
  await expect(api.openElection(electionId)).rejects.toThrowError(BadRequestError);

  // Kontrollera att det inte öppnades
  [election] = await api.getMultipleElections([electionId]);
  expect(election.open).toBeFalsy();
});

test('opening already opened election', async () => {
  const { id: electionId } = await api.createElection('aa0000bb-s', [], false);
  await expect(api.openElection(electionId)).resolves.toBeTruthy();
  const [election] = await api.getMultipleElections([electionId]);
  expect(election).not.toBeNull();

  // Nu testar vi att stänga igen, borde ej gå igenom
  await expect(api.openElection(electionId)).rejects.toThrowError(BadRequestError);

  // openedAt ska inte ha uppdaterats!
  const [election2] = await api.getMultipleElections([electionId]);
  expect(election2).not.toBeNull();
  expect(election2).toMatchObject(election);
});

test('closing multiple elections', async () => {
  // Vi ska egentligen inte ha flera möten
  // öppna samtidigt, men har någon fuckat med databasen
  // ska man kunna stänga alla och få en varning
  await prisma.prismaElection.createMany({
    data: [
      {
        refCreator: 'aa0000bb-s',
        openedAt: new Date(Date.now() + 100),
        open: true,
      },
      {
        refCreator: 'bb1111cc-s',
        openedAt: new Date(Date.now() + 300),
        open: true,
      },
    ],
  });
  await expect(api.closeElection()).rejects.toThrowError(ServerError);
});

test('nominating already done nomination does not overwrite answer', async () => {
  const { id: electionId } = await api.createElection('aa0000bb-s', [1, 2], false);
  await expect(api.openElection(electionId)).resolves.toBeTruthy();
  await expect(api.nominate('aa0000bb-s', [1, 2])).resolves.toBeTruthy();

  // Kontrollera att nomineringarna lades in rätt
  await expect(api.getAllNominationsForUser(electionId, 'aa0000bb-s')).resolves.toEqual(
    expect.arrayContaining([
      {
        refElection: electionId,
        refUser: 'aa0000bb-s',
        refPost: 1,
        answer: NominationAnswer.NotAnswered,
      },
      {
        refElection: electionId,
        refUser: 'aa0000bb-s',
        refPost: 2,
        answer: NominationAnswer.NotAnswered,
      },
    ]),
  );

  // Svara på nomineringen
  await expect(
    api.respondToNomination('aa0000bb-s', 1, NominationAnswer.Yes),
  ).resolves.toBeTruthy();

  // Försöker nominera igen, borde ignoreras
  await expect(api.nominate('aa0000bb-s', [1, 2])).resolves.toBeTruthy();
  await expect(api.getAllNominationsForUser(electionId, 'aa0000bb-s')).resolves.toEqual(
    expect.arrayContaining([
      {
        refElection: electionId,
        refUser: 'aa0000bb-s',
        refPost: 1,
        answer: NominationAnswer.Yes,
      },
      {
        refElection: electionId,
        refUser: 'aa0000bb-s',
        refPost: 2,
        answer: NominationAnswer.NotAnswered,
      },
    ]),
  );
});

test('nominating non-electable post', async () => {
  const { id: electionId } = await api.createElection('aa0000bb-s', [], false);
  await expect(api.openElection(electionId)).resolves.toBeTruthy();
  await expect(api.nominate('aa0000bb-s', [-1])).rejects.toThrowError(BadRequestError);
  await expect(api.getAllNominations(electionId)).resolves.toHaveLength(0);
});

test('nominating non-existant user', async () => {
  const { id: electionId } = await api.createElection('aa0000bb-s', [1], false);
  await expect(api.openElection(electionId)).resolves.toBeTruthy();
  await expect(api.nominate('Not an user', [1])).rejects.toThrowError(ServerError);
  await expect(api.getAllNominations(electionId)).resolves.toHaveLength(0);
});

test('nominating without postnames', async () => {
  const { id: electionId } = await api.createElection('aa0000bb-s', [1], false);
  await expect(api.openElection(electionId)).resolves.toBeTruthy();
  await expect(api.nominate('aa0000bb-s', [])).rejects.toThrowError(BadRequestError);
  await expect(api.getAllNominations(electionId)).resolves.toHaveLength(0);
});

test('nominating mixed valid and invalid postnames', async () => {
  const { id: electionId } = await api.createElection('aa0000bb-s', [1], false);
  await expect(api.openElection(electionId)).resolves.toBeTruthy();
  await expect(api.nominate('aa0000bb-s', [1, -1])).resolves.toBeTruthy();
  await expect(api.getAllNominations(electionId)).resolves.toEqual([
    {
      refElection: electionId,
      refUser: 'aa0000bb-s',
      refPost: 1,
      answer: NominationAnswer.NotAnswered,
    },
  ]);
});

test('nominating with no open elections', async () => {
  await api.createElection('aa0000bb-s', [1], false);
  await expect(api.nominate('aa0000bb-s', [1])).rejects.toThrowError(NotFoundError);
});

test('respond to nomination', async () => {
  const { id: electionId } = await api.createElection('aa0000bb-s', [1, 2], false);
  await expect(api.openElection(electionId)).resolves.toBeTruthy();
  await expect(api.nominate('aa0000bb-s', [1, 2])).resolves.toBeTruthy();
  await expect(api.nominate('bb1111cc-s', [1])).resolves.toBeTruthy();
  await expect(api.getAllNominations(electionId)).resolves.toEqual(
    expect.arrayContaining([
      {
        refElection: electionId,
        refUser: 'aa0000bb-s',
        refPost: 1,
        answer: NominationAnswer.NotAnswered,
      },
      {
        refElection: electionId,
        refUser: 'aa0000bb-s',
        refPost: 2,
        answer: NominationAnswer.NotAnswered,
      },
      {
        refElection: electionId,
        refUser: 'bb1111cc-s',
        refPost: 1,
        answer: NominationAnswer.NotAnswered,
      },
    ]),
  );

  // Svara
  await expect(
    api.respondToNomination('aa0000bb-s', 1, NominationAnswer.Yes),
  ).resolves.toBeTruthy();

  // Kontrollera att svaret gick igenom och bara påverkade rätt nominering
  await expect(api.getAllNominations(electionId)).resolves.toEqual(
    expect.arrayContaining([
      {
        refElection: electionId,
        refUser: 'aa0000bb-s',
        refPost: 1,
        answer: NominationAnswer.Yes,
      },
      {
        refElection: electionId,
        refUser: 'aa0000bb-s',
        refPost: 2,
        answer: NominationAnswer.NotAnswered,
      },
      {
        refElection: electionId,
        refUser: 'bb1111cc-s',
        refPost: 1,
        answer: NominationAnswer.NotAnswered,
      },
    ]),
  );
});

test('respond to non-existant nomination', async () => {
  const { id: electionId } = await api.createElection('aa0000bb-s', [1, 2], false);
  await expect(api.openElection(electionId)).resolves.toBeTruthy();
  await expect(api.nominate('aa0000bb-s', [1])).resolves.toBeTruthy();
  await expect(api.respondToNomination('aa0000bb-s', 2, NominationAnswer.Yes)).rejects.toThrowError(
    NotFoundError,
  );
});

test('respond to valid nomination after election close', async () => {
  const { id: electionId } = await api.createElection('aa0000bb-s', [1, 2], false);
  await expect(api.openElection(electionId)).resolves.toBeTruthy();
  await expect(api.nominate('aa0000bb-s', [1])).resolves.toBeTruthy();
  await expect(api.getAllNominations(electionId)).resolves.toEqual([
    {
      refElection: electionId,
      refUser: 'aa0000bb-s',
      refPost: 1,
      answer: NominationAnswer.NotAnswered,
    },
  ]);
  await expect(api.closeElection()).resolves.toBeTruthy();
  await expect(api.respondToNomination('aa0000bb-s', 1, NominationAnswer.Yes)).rejects.toThrowError(
    NotFoundError,
  );

  // Kollar så att inget faktiskt ändrades
  await expect(api.getAllNominations(electionId)).resolves.toEqual([
    {
      refElection: electionId,
      refUser: 'aa0000bb-s',
      refPost: 1,
      answer: NominationAnswer.NotAnswered,
    },
  ]);
});

test('proposing', async () => {
  const { id: electionId } = await api.createElection('aa0000bb-s', [1, 2], false);
  await expect(api.getAllProposals(electionId)).resolves.toHaveLength(0);
  await expect(api.propose(electionId, 'bb1111cc-s', 1)).resolves.toBeTruthy();
  await expect(api.getAllProposals(electionId)).resolves.toEqual([
    {
      refElection: electionId,
      refUser: 'bb1111cc-s',
      refPost: 1,
    },
  ]);
});

test('proposing non-existant user', async () => {
  const { id: electionId } = await api.createElection('aa0000bb-s', [1, 2], false);
  await expect(api.getAllProposals(electionId)).resolves.toHaveLength(0);
  await expect(api.propose(electionId, 'Not an user', 1)).rejects.toThrowError(ServerError);
  await expect(api.getAllProposals(electionId)).resolves.toHaveLength(0);
});

test('proposing non-existant post', async () => {
  const { id: electionId } = await api.createElection('aa0000bb-s', [1, 2], false);
  await expect(api.getAllProposals(electionId)).resolves.toHaveLength(0);
  await expect(api.propose(electionId, 'bb1111cc-s', -1)).rejects.toThrowError(ServerError);
  await expect(api.getAllProposals(electionId)).resolves.toHaveLength(0);
});

test('proposing non-existant election', async () => {
  const { id: electionId } = await api.createElection('aa0000bb-s', [1, 2], false);
  await expect(api.getAllProposals(electionId)).resolves.toHaveLength(0);
  await expect(api.propose(-1, 'bb1111cc-s', 1)).rejects.toThrowError(ServerError);
  await expect(api.getAllProposals(electionId)).resolves.toHaveLength(0);
});

test('removing proposal', async () => {
  const { id: electionId } = await api.createElection('aa0000bb-s', [1, 2], false);
  await expect(api.getAllProposals(electionId)).resolves.toHaveLength(0);
  await expect(api.propose(electionId, 'bb1111cc-s', 1)).resolves.toBeTruthy();
  await expect(api.getAllProposals(electionId)).resolves.toEqual([
    {
      refElection: electionId,
      refUser: 'bb1111cc-s',
      refPost: 1,
    },
  ]);
  await expect(api.removeProposal(electionId, 'bb1111cc-s', 1)).resolves.toBeTruthy();

  // Kolla att den faktiskt togs bort
  await expect(api.getAllProposals(electionId)).resolves.toHaveLength(0);
});

test('removing non-existant proposal', async () => {
  const { id: electionId } = await api.createElection('aa0000bb-s', [1, 2], false);
  await expect(api.getAllProposals(electionId)).resolves.toHaveLength(0);
  await expect(api.removeProposal(electionId, 'aa0000bb-s', 1)).rejects.toThrowError(ServerError);
  await expect(api.getAllProposals(electionId)).resolves.toHaveLength(0);
});
