import {
  ELECTABLE_TABLE,
  ELECTION_TABLE,
  NOMINATION_TABLE,
  PROPOSAL_TABLE,
} from '../../src/api/constants';
import { ElectionAPI } from '../../src/api/election.api';
import knexInstance from '../../src/api/knex';
import { BadRequestError, NotFoundError, ServerError } from '../../src/errors/RequestErrors';
import { NominationAnswer } from '../../src/graphql.generated';
import {
  DatabaseElectable,
  DatabaseElection,
  DatabaseNomination,
  DatabaseProposal,
} from '../../src/models/db/election';

const api = new ElectionAPI();

let preTestElectionTable: DatabaseElection[];
let preTestElectableTable: DatabaseElectable[];
let preTestProposalTable: DatabaseProposal[];
let preTestNominationTable: DatabaseNomination[];

const clearDatabase = async () => {
  // Vi sätter `where` till något som alltid är sant
  await knexInstance<DatabaseElectable>(ELECTABLE_TABLE).delete().whereNotNull('refelection');
  await knexInstance<DatabaseProposal>(PROPOSAL_TABLE).delete().whereNotNull('refelection');
  await knexInstance<DatabaseNomination>(NOMINATION_TABLE).delete().whereNotNull('refelection');
  await knexInstance<DatabaseElection>(ELECTION_TABLE).delete().whereNotNull('id');
};

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
      knexInstance<DatabaseElection>(ELECTION_TABLE).insert({
        refcreator: creatorUsername,
        nominationsHidden,
        openedAt: Date.now() + 100,
        closedAt: Date.now() + 200,
        open: false,
      }),
    );
  }
  // Vi bryr oss inte om ordningen (de är identiska),
  // så vi väntar på alla istället för att göra
  // i loopen
  await Promise.all(queries);
};

beforeAll(async () => {
  preTestElectionTable = await knexInstance<DatabaseElection>(ELECTION_TABLE).select('*');
  preTestElectableTable = await knexInstance<DatabaseElectable>(ELECTABLE_TABLE).select('*');
  preTestProposalTable = await knexInstance<DatabaseProposal>(PROPOSAL_TABLE).select('*');
  preTestNominationTable = await knexInstance<DatabaseNomination>(NOMINATION_TABLE).select('*');
  await clearDatabase();
});

afterEach(async () => {
  await clearDatabase();
});

afterAll(async () => {
  // Sätt in cachade värden igen
  await knexInstance<DatabaseElection>(ELECTION_TABLE).insert(preTestElectionTable);
  await knexInstance<DatabaseElectable>(ELECTABLE_TABLE).insert(preTestElectableTable);
  await knexInstance<DatabaseProposal>(PROPOSAL_TABLE).insert(preTestProposalTable);
  await knexInstance<DatabaseNomination>(NOMINATION_TABLE).insert(preTestNominationTable);
});

test('finding latest elections without limit', async () => {
  await addDummyElections('aa0000bb-s', true, 5);
  const elections = await api.getLatestElections();
  expect(elections.length).toEqual(5);
});

test('finding latest elections with limit', async () => {
  await addDummyElections('aa0000bb-s', true, 5);

  // Vi gör senaste valet unikt så vi kan identifiera det
  await knexInstance<DatabaseElection>(ELECTION_TABLE).insert({
    refcreator: 'bb1111cc-s',
    nominationsHidden: false,
  });

  const election = await api.getLatestElections(1);

  expect(election.length).toEqual(1);
  expect(election[0].refcreator).toEqual('bb1111cc-s');
  expect(election[0].nominationsHidden).toBeFalsy();
});

test('getting open election', async () => {
  await addDummyElections('aa0000bb-s', true, 3);
  await expect(api.getOpenElection()).rejects.toThrowError(NotFoundError);

  await knexInstance<DatabaseElection>(ELECTION_TABLE).insert({
    refcreator: 'bb1111cc-s',
    nominationsHidden: false,
    openedAt: Date.now() + 100,
    open: true,
  });

  const openElection = await api.getOpenElection();

  // Hantera att SQLite sparar bools som 0 och 1
  openElection.nominationsHidden = !!openElection.nominationsHidden;
  openElection.open = !!openElection.open;

  expect(openElection).toMatchObject({
    refcreator: 'bb1111cc-s',
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
  await expect(api.getMultipleElections(['1', '2', '69', '905393'])).resolves.toHaveLength(0);
});

test('getting nominations for post', async () => {
  const electionId = await api.createElection(
    'bb1111cc-s',
    ['Macapär', 'Teknokrat', 'Cophös'],
    false,
  );
  await api.openElection(electionId);

  await expect(api.nominate('aa0000bb-s', ['Macapär', 'Cophös'])).resolves.toBeTruthy();
  await expect(api.getNominations(electionId, 'Macapär')).resolves.toEqual(
    expect.arrayContaining([
      {
        refelection: electionId,
        refuser: 'aa0000bb-s',
        refpost: 'Macapär',
        accepted: NominationAnswer.NoAnswer,
      },
    ]),
  );
  await expect(api.getNominations(electionId, 'Teknokrat')).resolves.toHaveLength(0);
});

test('nominations for non-electables are hidden', async () => {
  const electionId = await api.createElection('bb1111cc-s', [], false);
  await knexInstance<DatabaseNomination>(NOMINATION_TABLE).insert({
    refelection: electionId,
    refuser: 'aa0000bb-s',
    refpost: 'Macapär', // Valid post, men inte electable
    accepted: NominationAnswer.NoAnswer,
  });

  // Denna nominering borde aldrig synas!
  await expect(api.getNumberOfNominations(electionId)).resolves.toEqual(0);
  await expect(api.getNumberOfNominations(electionId, 'Macapär')).resolves.toEqual(0);
  await expect(api.getAllNominations(electionId)).resolves.toHaveLength(0);
  await expect(api.getAllNominationsForUser(electionId, 'aa0000bb-s')).resolves.toHaveLength(0);
});

test('getting all nominations with specified answer', async () => {
  const electionId = await api.createElection(
    'bb1111cc-s',
    ['Macapär', 'Teknokrat', 'Cophös'],
    false,
  );
  await api.openElection(electionId);

  // Nominera lite folk
  await expect(api.nominate('aa0000bb-s', ['Macapär', 'Cophös'])).resolves.toBeTruthy();
  await expect(api.nominate('bb1111cc-s', ['Teknokrat'])).resolves.toBeTruthy();

  // Svara på nomineringarna
  await expect(
    api.respondToNomination('aa0000bb-s', 'Macapär', NominationAnswer.Yes),
  ).resolves.toBeTruthy();
  await expect(
    api.respondToNomination('aa0000bb-s', 'Cophös', NominationAnswer.No),
  ).resolves.toBeTruthy();
  await expect(
    api.respondToNomination('bb1111cc-s', 'Teknokrat', NominationAnswer.Yes),
  ).resolves.toBeTruthy();

  // Kontrollera svaret
  const nominations = await api.getAllNominations(electionId, NominationAnswer.Yes);
  expect(nominations).toHaveLength(2);
  expect(nominations).toEqual(
    expect.arrayContaining([
      {
        refelection: electionId,
        refuser: 'aa0000bb-s',
        refpost: 'Macapär',
        accepted: NominationAnswer.Yes,
      },
      {
        refelection: electionId,
        refuser: 'bb1111cc-s',
        refpost: 'Teknokrat',
        accepted: NominationAnswer.Yes,
      },
    ]),
  );
});

test('getting all nominations without specified answer', async () => {
  const electionId = await api.createElection(
    'bb1111cc-s',
    ['Macapär', 'Teknokrat', 'Cophös'],
    false,
  );
  await api.openElection(electionId);

  // Nominera lite folk
  await expect(api.nominate('aa0000bb-s', ['Macapär', 'Cophös'])).resolves.toBeTruthy();
  await expect(api.nominate('bb1111cc-s', ['Teknokrat'])).resolves.toBeTruthy();

  // Svara på några av nomineringarna
  await expect(
    api.respondToNomination('aa0000bb-s', 'Macapär', NominationAnswer.Yes),
  ).resolves.toBeTruthy();
  await expect(
    api.respondToNomination('aa0000bb-s', 'Cophös', NominationAnswer.No),
  ).resolves.toBeTruthy();

  // Kontrollera svaret
  const nominations = await api.getAllNominations(electionId);
  expect(nominations).toHaveLength(3);
  expect(nominations).toEqual(
    expect.arrayContaining([
      {
        refelection: electionId,
        refuser: 'aa0000bb-s',
        refpost: 'Macapär',
        accepted: NominationAnswer.Yes,
      },
      {
        refelection: electionId,
        refuser: 'aa0000bb-s',
        refpost: 'Cophös',
        accepted: NominationAnswer.No,
      },
      {
        refelection: electionId,
        refuser: 'bb1111cc-s',
        refpost: 'Teknokrat',
        accepted: NominationAnswer.NoAnswer,
      },
    ]),
  );
});

test('getting all nominations when none exists', async () => {
  const electionId = await api.createElection(
    'bb1111cc-s',
    ['Macapär', 'Teknokrat', 'Cophös'],
    false,
  );
  await api.openElection(electionId);

  await expect(api.getAllNominations(electionId)).resolves.toHaveLength(0);
  await expect(api.getAllNominations(electionId, NominationAnswer.NoAnswer)).resolves.toHaveLength(
    0,
  );
});

test('getting all nominations for user with specified answer', async () => {
  const electionId = await api.createElection(
    'bb1111cc-s',
    ['Macapär', 'Teknokrat', 'Cophös'],
    false,
  );
  await api.openElection(electionId);

  // Nominera lite folk
  await expect(api.nominate('aa0000bb-s', ['Macapär', 'Cophös'])).resolves.toBeTruthy();
  await expect(api.nominate('bb1111cc-s', ['Teknokrat'])).resolves.toBeTruthy();

  // Svara på nomineringarna
  await expect(
    api.respondToNomination('aa0000bb-s', 'Macapär', NominationAnswer.Yes),
  ).resolves.toBeTruthy();
  await expect(
    api.respondToNomination('aa0000bb-s', 'Cophös', NominationAnswer.No),
  ).resolves.toBeTruthy();
  await expect(
    api.respondToNomination('bb1111cc-s', 'Teknokrat', NominationAnswer.Yes),
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
        refelection: electionId,
        refuser: 'aa0000bb-s',
        refpost: 'Macapär',
        accepted: NominationAnswer.Yes,
      },
    ]),
  );
});

test('getting all nominations for user without specified answer', async () => {
  const electionId = await api.createElection(
    'bb1111cc-s',
    ['Macapär', 'Teknokrat', 'Cophös'],
    false,
  );
  await api.openElection(electionId);

  // Nominera lite folk
  await expect(api.nominate('aa0000bb-s', ['Macapär', 'Cophös'])).resolves.toBeTruthy();
  await expect(api.nominate('bb1111cc-s', ['Teknokrat'])).resolves.toBeTruthy();

  // Svara på nomineringarna
  await expect(
    api.respondToNomination('aa0000bb-s', 'Macapär', NominationAnswer.Yes),
  ).resolves.toBeTruthy();
  await expect(
    api.respondToNomination('aa0000bb-s', 'Cophös', NominationAnswer.No),
  ).resolves.toBeTruthy();
  await expect(
    api.respondToNomination('bb1111cc-s', 'Teknokrat', NominationAnswer.Yes),
  ).resolves.toBeTruthy();

  // Kontrollera svaret
  const nominations = await api.getAllNominationsForUser(electionId, 'aa0000bb-s');
  expect(nominations).toHaveLength(2);
  expect(nominations).toEqual(
    expect.arrayContaining([
      {
        refelection: electionId,
        refuser: 'aa0000bb-s',
        refpost: 'Macapär',
        accepted: NominationAnswer.Yes,
      },
      {
        refelection: electionId,
        refuser: 'aa0000bb-s',
        refpost: 'Cophös',
        accepted: NominationAnswer.No,
      },
    ]),
  );
});

test('getting all nominations for user when none exists', async () => {
  const electionId = await api.createElection(
    'bb1111cc-s',
    ['Macapär', 'Teknokrat', 'Cophös'],
    false,
  );
  await api.openElection(electionId);

  await expect(api.getAllNominationsForUser(electionId, 'aa0000bb-s')).resolves.toHaveLength(0);
  await expect(api.getAllNominations(electionId, NominationAnswer.NoAnswer)).resolves.toHaveLength(
    0,
  );
});

test('getting number of nominations', async () => {
  const electionId = await api.createElection(
    'aa0000bb-s',
    ['Macapär', 'Teknokrat', 'Cophös'],
    false,
  );
  await api.openElection(electionId);

  // Nominera lite folk
  await expect(api.nominate('aa0000bb-s', ['Macapär', 'Cophös'])).resolves.toBeTruthy();
  await expect(api.nominate('bb1111cc-s', ['Teknokrat'])).resolves.toBeTruthy();

  expect(await api.getNumberOfNominations(electionId)).toEqual(3);
  expect(await api.getNumberOfNominations(electionId, 'Macapär')).toEqual(1);
});

test('getting number of proposals', async () => {
  const electionId = await api.createElection('aa0000bb-s', ['Macapär', 'Teknokrat'], false);
  await api.openElection(electionId);

  // Nominera lite folk
  await expect(api.propose(electionId, 'aa0000bb-s', 'Macapär')).resolves.toBeTruthy();
  await expect(api.propose(electionId, 'bb1111cc-s', 'Teknokrat')).resolves.toBeTruthy();

  expect(await api.getNumberOfProposals(electionId)).toEqual(2);
  expect(await api.getNumberOfProposals(electionId, 'Macapär')).toEqual(1);
});

test('getting all proposals', async () => {
  const electionId = await api.createElection('aa0000bb-s', ['Macapär', 'Teknokrat'], false);
  await api.openElection(electionId);

  // Nominera lite folk
  await expect(api.propose(electionId, 'aa0000bb-s', 'Macapär')).resolves.toBeTruthy();
  await expect(api.propose(electionId, 'bb1111cc-s', 'Teknokrat')).resolves.toBeTruthy();

  const proposals = await api.getAllProposals(electionId);
  expect(proposals).toHaveLength(2);
  expect(proposals).toEqual(
    expect.arrayContaining([
      {
        refelection: electionId,
        refuser: 'aa0000bb-s',
        refpost: 'Macapär',
      },
      {
        refelection: electionId,
        refuser: 'bb1111cc-s',
        refpost: 'Teknokrat',
      },
    ]),
  );
});

test('getting all proposals when none exists', async () => {
  const electionId = await api.createElection('aa0000bb-s', ['Macapär', 'Teknokrat'], false);
  await api.openElection(electionId);

  await expect(api.getAllProposals(electionId)).resolves.toHaveLength(0);
});

test('getting all electables', async () => {
  const electionId = await api.createElection('aa0000bb-s', ['Macapär', 'Teknokrat'], false);
  const electables = await api.getAllElectables(electionId);
  expect(electables).toHaveLength(2);
  expect(electables).toEqual(expect.arrayContaining(['Macapär', 'Teknokrat']));
});

test('getting all electables when none exists', async () => {
  const electionId = await api.createElection('aa0000bb-s', [], false);
  await expect(api.getAllElectables(electionId)).resolves.toHaveLength(0);
});

test('creating election returns its ID', async () => {
  const electionId = await api.createElection('aa0000bb-s', [], false);
  const expectedElectionId = (await api.getLatestElections(1))[0].id;
  expect(electionId).toEqual(expectedElectionId);
});

test('creating election with created, but never opened, previous election', async () => {
  await api.createElection('aa0000bb-s', [], false);
  await expect(api.createElection('bb1111cc-s', [], false)).rejects.toThrowError(BadRequestError);

  // Vi vill se till att ett nytt val faktiskt inte skapades
  expect((await api.getLatestElections(1))[0]).toMatchObject({
    refcreator: 'aa0000bb-s',
  });
});

test('creating election with previous created, opened, but not closed election', async () => {
  const electionId = await api.createElection('aa0000bb-s', [], false);
  await api.openElection(electionId);
  await expect(api.createElection('bb1111cc-s', [], false)).rejects.toThrowError(BadRequestError);

  // Vi vill se till att ett nytt val faktiskt inte skapades
  expect((await api.getLatestElections(1))[0]).toMatchObject({
    refcreator: 'aa0000bb-s',
  });
});

test('creating election with previous created, opened and closed election', async () => {
  const electionId = await api.createElection('aa0000bb-s', [], false);
  await api.openElection(electionId);
  await api.closeElection();

  // Vårt nya val borde ha förra ID:t + 1
  await expect(api.createElection('bb1111cc-s', [], false)).resolves.toEqual(
    (Number.parseInt(electionId, 10) ?? -20) + 1,
  );

  // Vi vill se till att ett nytt val faktiskt inte skapades
  expect((await api.getLatestElections(1))[0]).toMatchObject({
    refcreator: 'bb1111cc-s',
  });
});

test('creating election with invalid electables', async () => {
  await expect(
    api.createElection('aa0000bb-s', ['Not a post', 'Neither is this'], true),
  ).rejects.toThrowError(ServerError);

  // Om valet inte skapades är detta `undefined`
  const election = (await api.getLatestElections(1))[0];

  // Vi försäkrar oss om att valet skapades, men att
  // electables inte lades till
  expect(election).toMatchObject({
    refcreator: 'aa0000bb-s',
  });
  await expect(api.getAllElectables(election.id)).resolves.toHaveLength(0);
});

test('creating election with mixed valid and invalid electables', async () => {
  await expect(
    api.createElection('aa0000bb-s', ['Not a post', 'Macapär'], true),
  ).rejects.toThrowError(ServerError);

  // Om valet inte skapades är detta `undefined`
  const election = (await api.getLatestElections(1))[0];

  // Vi försäkrar oss om att valet skapades, men att
  // bara giltiga electables lades till
  expect(election).toMatchObject({
    refcreator: 'aa0000bb-s',
  });
  await expect(api.getAllElectables(election.id)).resolves.toHaveLength(0);
});

test('adding valid electables to non-existant election', async () => {
  await expect(api.addElectables('Not an election Id', ['Macapär'])).rejects.toThrowError(
    ServerError,
  );
});

test('adding valid electables to election', async () => {
  const electionId = await api.createElection('aa0000bb-s', [], false);
  await expect(api.getAllElectables(electionId)).resolves.toHaveLength(0);
  await expect(api.addElectables(electionId, ['Macapär'])).resolves.toBeTruthy();
  await expect(api.getAllElectables(electionId)).resolves.toEqual(['Macapär']);

  // Fungerar också för öppet val
  await expect(api.openElection(electionId)).resolves.toBeTruthy();
  await expect(api.getAllElectables(electionId)).resolves.toEqual(['Macapär']);
  await expect(api.addElectables(electionId, ['Cophös'])).resolves.toBeTruthy();
  await expect(api.getAllElectables(electionId)).resolves.toEqual(
    expect.arrayContaining(['Macapär', 'Cophös']),
  );
});

test('adding mixed valid and non-valid electables to election', async () => {
  const electionId = await api.createElection('aa0000bb-s', [], false);
  await expect(api.getAllElectables(electionId)).resolves.toHaveLength(0);
  await expect(api.addElectables(electionId, ['Macapär', 'Not a post'])).rejects.toThrowError(
    ServerError,
  );
  await expect(api.getAllElectables(electionId)).resolves.toHaveLength(0);
});

test('adding empty list of electables to election', async () => {
  const electionId = await api.createElection('aa0000bb-s', [], false);
  await expect(api.addElectables(electionId, [])).rejects.toThrowError(BadRequestError);
});

test('adding duplicate electables', async () => {
  const electionId = await api.createElection('aa0000bb-s', [], false);

  // I samma anrop
  await expect(api.addElectables(electionId, ['Macapär', 'Macapär'])).rejects.toThrowError(
    ServerError,
  );
  await expect(api.getAllElectables(electionId)).resolves.toHaveLength(0);

  // I olika anrop
  await expect(api.addElectables(electionId, ['Macapär'])).resolves.toBeTruthy();
  await expect(api.addElectables(electionId, ['Macapär'])).rejects.toThrowError(ServerError);
  await expect(api.getAllElectables(electionId)).resolves.toEqual(['Macapär']);
});

test('removing valid electables from non-existant election', async () => {
  await expect(api.removeElectables('Not an election ID', ['Macapär'])).rejects.toThrowError(
    ServerError,
  );
});

test('removing valid electables from election', async () => {
  const electionId = await api.createElection('aa0000bb-s', ['Macapär', 'Teknokrat'], false);
  await expect(api.getAllElectables(electionId)).resolves.toEqual(
    expect.arrayContaining(['Macapär', 'Teknokrat']),
  );
  await expect(api.removeElectables(electionId, ['Macapär'])).resolves.toBeTruthy();
  await expect(api.getAllElectables(electionId)).resolves.toEqual(['Teknokrat']);
});

test('removing mixed valid and non-valid electables from election', async () => {
  const electionId = await api.createElection(
    'aa0000bb-s',
    ['Macapär', 'Teknokrat', 'Cophös'],
    false,
  );

  await expect(api.getAllElectables(electionId)).resolves.toEqual(
    expect.arrayContaining(['Macapär', 'Teknokrat', 'Cophös']),
  );

  await expect(
    api.removeElectables(electionId, ['Macapär', 'Not an electable']),
  ).rejects.toThrowError(ServerError);

  // Kontrollera att Macapär trots allt togs bort
  const electablesLeft = await api.getAllElectables(electionId);
  expect(electablesLeft).toHaveLength(2);
  expect(electablesLeft).toEqual(expect.arrayContaining(['Teknokrat', 'Cophös']));
});

test('removing empty list of electables from election', async () => {
  const electionId = await api.createElection('aa0000bb-s', [], false);
  await expect(api.getAllElectables(electionId)).resolves.toHaveLength(0);
  await expect(api.removeElectables(electionId, [])).rejects.toThrowError(BadRequestError);
  await expect(api.getAllElectables(electionId)).resolves.toHaveLength(0);
});

test('removing valid electable not in election', async () => {
  const electionId = await api.createElection('aa0000bb-s', [], false);
  await expect(api.getAllElectables(electionId)).resolves.toHaveLength(0);
  await expect(api.removeElectables(electionId, ['Macapär'])).rejects.toThrowError(ServerError);
});

test('setting an empty array of electables in an existing election', async () => {
  const electionId = await api.createElection('aa0000bb-s', [], false);
  await expect(api.setElectables(electionId, [])).resolves.toBeTruthy();
  await expect(api.getAllElectables(electionId)).resolves.toHaveLength(0);
});

test('overriding existing electables', async () => {
  const electionId = await api.createElection('aa0000bb-s', [], false);
  await expect(api.addElectables(electionId, ['Macapär', 'Teknokrat'])).resolves.toBeTruthy();
  await expect(api.setElectables(electionId, ['Cophös'])).resolves.toBeTruthy();
  await expect(api.getAllElectables(electionId)).resolves.toEqual(['Cophös']);
});

test('setting hidden nominations', async () => {
  const electionId = await api.createElection('aa0000bb-s', [], false);
  expect((await api.getLatestElections(1))[0].nominationsHidden).toBeFalsy();

  // Faktiskt byte
  await expect(api.setHiddenNominations(electionId, true)).resolves.toBeTruthy();
  expect((await api.getLatestElections(1))[0].nominationsHidden).toBeTruthy();

  // Kolla att man kan ändra tillbaka
  await expect(api.setHiddenNominations(electionId, false)).resolves.toBeTruthy();
  expect((await api.getLatestElections(1))[0].nominationsHidden).toBeFalsy();
});

test('setting hidden nominations on non-existant election', async () => {
  await expect(api.setHiddenNominations('Not an election ID', false)).resolves.toBeFalsy();
});

test('opening non-existant election', async () => {
  await expect(api.openElection('Not an election ID')).rejects.toThrowError(BadRequestError);
});

test('opening election', async () => {
  const electionId = await api.createElection('aa0000bb-s', [], false);
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
  const electionId = await api.createElection('aa0000bb-s', [], false);
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
  const electionId = await api.createElection('aa0000bb-s', [], false);
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
  await knexInstance<DatabaseElection>(ELECTION_TABLE).insert([
    {
      refcreator: 'aa0000bb-s',
      openedAt: Date.now() + 100,
      open: true,
    },
    {
      refcreator: 'bb1111cc-s',
      openedAt: Date.now() + 300,
      open: true,
    },
  ]);
  await expect(api.closeElection()).rejects.toThrowError(ServerError);
});

test('nominating already done nomination does not overwrite answer', async () => {
  const electionId = await api.createElection('aa0000bb-s', ['Macapär', 'Teknokrat'], false);
  await expect(api.openElection(electionId)).resolves.toBeTruthy();
  await expect(api.nominate('aa0000bb-s', ['Macapär', 'Teknokrat'])).resolves.toBeTruthy();

  // Kontrollera att nomineringarna lades in rätt
  await expect(api.getAllNominationsForUser(electionId, 'aa0000bb-s')).resolves.toEqual(
    expect.arrayContaining([
      {
        refelection: electionId,
        refuser: 'aa0000bb-s',
        refpost: 'Macapär',
        accepted: NominationAnswer.NoAnswer,
      },
      {
        refelection: electionId,
        refuser: 'aa0000bb-s',
        refpost: 'Teknokrat',
        accepted: NominationAnswer.NoAnswer,
      },
    ]),
  );

  // Svara på nomineringen
  await expect(
    api.respondToNomination('aa0000bb-s', 'Macapär', NominationAnswer.Yes),
  ).resolves.toBeTruthy();

  // Försöker nominera igen, borde ignoreras
  await expect(api.nominate('aa0000bb-s', ['Macapär', 'Teknokrat'])).resolves.toBeTruthy();
  await expect(api.getAllNominationsForUser(electionId, 'aa0000bb-s')).resolves.toEqual(
    expect.arrayContaining([
      {
        refelection: electionId,
        refuser: 'aa0000bb-s',
        refpost: 'Macapär',
        accepted: NominationAnswer.Yes,
      },
      {
        refelection: electionId,
        refuser: 'aa0000bb-s',
        refpost: 'Teknokrat',
        accepted: NominationAnswer.NoAnswer,
      },
    ]),
  );
});

test('nominating non-electable post', async () => {
  const electionId = await api.createElection('aa0000bb-s', [], false);
  await expect(api.openElection(electionId)).resolves.toBeTruthy();
  await expect(api.nominate('aa0000bb-s', ['Not a postname'])).rejects.toThrowError(
    BadRequestError,
  );
  await expect(api.getAllNominations(electionId)).resolves.toHaveLength(0);
});

test('nominating non-existant user', async () => {
  const electionId = await api.createElection('aa0000bb-s', ['Macapär'], false);
  await expect(api.openElection(electionId)).resolves.toBeTruthy();
  await expect(api.nominate('Not an user', ['Macapär'])).rejects.toThrowError(ServerError);
  await expect(api.getAllNominations(electionId)).resolves.toHaveLength(0);
});

test('nominating without postnames', async () => {
  const electionId = await api.createElection('aa0000bb-s', ['Macapär'], false);
  await expect(api.openElection(electionId)).resolves.toBeTruthy();
  await expect(api.nominate('aa0000bb-s', [])).rejects.toThrowError(BadRequestError);
  await expect(api.getAllNominations(electionId)).resolves.toHaveLength(0);
});

test('nominating mixed valid and invalid postnames', async () => {
  const electionId = await api.createElection('aa0000bb-s', ['Macapär'], false);
  await expect(api.openElection(electionId)).resolves.toBeTruthy();
  await expect(api.nominate('aa0000bb-s', ['Macapär', 'Not a post'])).resolves.toBeTruthy();
  await expect(api.getAllNominations(electionId)).resolves.toEqual([
    {
      refelection: electionId,
      refuser: 'aa0000bb-s',
      refpost: 'Macapär',
      accepted: NominationAnswer.NoAnswer,
    },
  ]);
});

test('nominating with no open elections', async () => {
  await api.createElection('aa0000bb-s', ['Macapär'], false);
  await expect(api.nominate('aa0000bb-s', ['Macapär'])).rejects.toThrowError(NotFoundError);
});

test('respond to nomination', async () => {
  const electionId = await api.createElection('aa0000bb-s', ['Macapär', 'Teknokrat'], false);
  await expect(api.openElection(electionId)).resolves.toBeTruthy();
  await expect(api.nominate('aa0000bb-s', ['Macapär', 'Teknokrat'])).resolves.toBeTruthy();
  await expect(api.nominate('bb1111cc-s', ['Macapär'])).resolves.toBeTruthy();
  await expect(api.getAllNominations(electionId)).resolves.toEqual(
    expect.arrayContaining([
      {
        refelection: electionId,
        refuser: 'aa0000bb-s',
        refpost: 'Macapär',
        accepted: NominationAnswer.NoAnswer,
      },
      {
        refelection: electionId,
        refuser: 'aa0000bb-s',
        refpost: 'Teknokrat',
        accepted: NominationAnswer.NoAnswer,
      },
      {
        refelection: electionId,
        refuser: 'bb1111cc-s',
        refpost: 'Macapär',
        accepted: NominationAnswer.NoAnswer,
      },
    ]),
  );

  // Svara
  await expect(
    api.respondToNomination('aa0000bb-s', 'Macapär', NominationAnswer.Yes),
  ).resolves.toBeTruthy();

  // Kontrollera att svaret gick igenom och bara påverkade rätt nominering
  await expect(api.getAllNominations(electionId)).resolves.toEqual(
    expect.arrayContaining([
      {
        refelection: electionId,
        refuser: 'aa0000bb-s',
        refpost: 'Macapär',
        accepted: NominationAnswer.Yes,
      },
      {
        refelection: electionId,
        refuser: 'aa0000bb-s',
        refpost: 'Teknokrat',
        accepted: NominationAnswer.NoAnswer,
      },
      {
        refelection: electionId,
        refuser: 'bb1111cc-s',
        refpost: 'Macapär',
        accepted: NominationAnswer.NoAnswer,
      },
    ]),
  );
});

test('respond to non-existant nomination', async () => {
  const electionId = await api.createElection('aa0000bb-s', ['Macapär', 'Teknokrat'], false);
  await expect(api.openElection(electionId)).resolves.toBeTruthy();
  await expect(api.nominate('aa0000bb-s', ['Macapär'])).resolves.toBeTruthy();
  await expect(
    api.respondToNomination('aa0000bb-s', 'Teknokrat', NominationAnswer.Yes),
  ).rejects.toThrowError(NotFoundError);
});

test('respond to valid nomination after election close', async () => {
  const electionId = await api.createElection('aa0000bb-s', ['Macapär', 'Teknokrat'], false);
  await expect(api.openElection(electionId)).resolves.toBeTruthy();
  await expect(api.nominate('aa0000bb-s', ['Macapär'])).resolves.toBeTruthy();
  await expect(api.getAllNominations(electionId)).resolves.toEqual([
    {
      refelection: electionId,
      refuser: 'aa0000bb-s',
      refpost: 'Macapär',
      accepted: NominationAnswer.NoAnswer,
    },
  ]);
  await expect(api.closeElection()).resolves.toBeTruthy();
  await expect(
    api.respondToNomination('aa0000bb-s', 'Macapär', NominationAnswer.Yes),
  ).rejects.toThrowError(NotFoundError);

  // Kollar så att inget faktiskt ändrades
  await expect(api.getAllNominations(electionId)).resolves.toEqual([
    {
      refelection: electionId,
      refuser: 'aa0000bb-s',
      refpost: 'Macapär',
      accepted: NominationAnswer.NoAnswer,
    },
  ]);
});

test('proposing', async () => {
  const electionId = await api.createElection('aa0000bb-s', ['Macapär', 'Teknokrat'], false);
  await expect(api.getAllProposals(electionId)).resolves.toHaveLength(0);
  await expect(api.propose(electionId, 'bb1111cc-s', 'Macapär')).resolves.toBeTruthy();
  await expect(api.getAllProposals(electionId)).resolves.toEqual([
    {
      refelection: electionId,
      refuser: 'bb1111cc-s',
      refpost: 'Macapär',
    },
  ]);
});

test('proposing non-existant user', async () => {
  const electionId = await api.createElection('aa0000bb-s', ['Macapär', 'Teknokrat'], false);
  await expect(api.getAllProposals(electionId)).resolves.toHaveLength(0);
  await expect(api.propose(electionId, 'Not an user', 'Macapär')).rejects.toThrowError(ServerError);
  await expect(api.getAllProposals(electionId)).resolves.toHaveLength(0);
});

test('proposing non-existant post', async () => {
  const electionId = await api.createElection('aa0000bb-s', ['Macapär', 'Teknokrat'], false);
  await expect(api.getAllProposals(electionId)).resolves.toHaveLength(0);
  await expect(api.propose(electionId, 'bb1111cc-s', 'Not a post')).rejects.toThrowError(
    ServerError,
  );
  await expect(api.getAllProposals(electionId)).resolves.toHaveLength(0);
});

test('proposing non-existant election', async () => {
  const electionId = await api.createElection('aa0000bb-s', ['Macapär', 'Teknokrat'], false);
  await expect(api.getAllProposals(electionId)).resolves.toHaveLength(0);
  await expect(api.propose('Not an electio', 'bb1111cc-s', 'Macapär')).rejects.toThrowError(
    ServerError,
  );
  await expect(api.getAllProposals(electionId)).resolves.toHaveLength(0);
});

test('removing proposal', async () => {
  const electionId = await api.createElection('aa0000bb-s', ['Macapär', 'Teknokrat'], false);
  await expect(api.getAllProposals(electionId)).resolves.toHaveLength(0);
  await expect(api.propose(electionId, 'bb1111cc-s', 'Macapär')).resolves.toBeTruthy();
  await expect(api.getAllProposals(electionId)).resolves.toEqual([
    {
      refelection: electionId,
      refuser: 'bb1111cc-s',
      refpost: 'Macapär',
    },
  ]);
  await expect(api.removeProposal(electionId, 'bb1111cc-s', 'Macapär')).resolves.toBeTruthy();

  // Kolla att den faktiskt togs bort
  await expect(api.getAllProposals(electionId)).resolves.toHaveLength(0);
});

test('removing non-existant proposal', async () => {
  const electionId = await api.createElection('aa0000bb-s', ['Macapär', 'Teknokrat'], false);
  await expect(api.getAllProposals(electionId)).resolves.toHaveLength(0);
  await expect(api.removeProposal(electionId, 'aa0000bb-s', 'Macapär')).rejects.toThrowError(
    ServerError,
  );
  await expect(api.getAllProposals(electionId)).resolves.toHaveLength(0);
});
