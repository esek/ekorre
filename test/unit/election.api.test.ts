import {
  ELECTABLE_TABLE,
  ELECTION_TABLE,
  NOMINATION_TABLE,
  PROPOSAL_TABLE,
} from '../../src/api/constants';
import { ElectionAPI } from '../../src/api/election.api';
import knex from '../../src/api/knex';
import { NotFoundError, ServerError } from '../../src/errors/RequestErrors';
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
  await knex<DatabaseElectable>(ELECTABLE_TABLE).delete().whereNotNull('refelection');
  await knex<DatabaseProposal>(PROPOSAL_TABLE).delete().whereNotNull('refelection');
  await knex<DatabaseNomination>(NOMINATION_TABLE).delete().whereNotNull('refelection');
  await knex<DatabaseElection>(ELECTION_TABLE).delete().whereNotNull('id');
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
      knex<DatabaseElection>(ELECTION_TABLE).insert({
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
  preTestElectionTable = await knex<DatabaseElection>(ELECTION_TABLE).select('*');
  preTestElectableTable = await knex<DatabaseElectable>(ELECTABLE_TABLE).select('*');
  preTestProposalTable = await knex<DatabaseProposal>(PROPOSAL_TABLE).select('*');
  preTestNominationTable = await knex<DatabaseNomination>(NOMINATION_TABLE).select('*');
  await clearDatabase();
});

afterEach(async () => {
  await clearDatabase();
});

afterAll(async () => {
  // Sätt in cachade värden igen
  await knex<DatabaseElection>(ELECTION_TABLE).insert(preTestElectionTable);
  await knex<DatabaseElectable>(ELECTABLE_TABLE).insert(preTestElectableTable);
  await knex<DatabaseProposal>(PROPOSAL_TABLE).insert(preTestProposalTable);
  await knex<DatabaseNomination>(NOMINATION_TABLE).insert(preTestNominationTable);
});

test('finding latest elections without limit', async () => {
  await addDummyElections('aa0000bb-s', true, 5);
  const elections = await api.getLatestElections();
  expect(elections.length).toEqual(5);
});

test('finding latest elections with limit', async () => {
  await addDummyElections('aa0000bb-s', true, 5);

  // Vi gör senaste valet unikt så vi kan identifiera det
  await knex<DatabaseElection>(ELECTION_TABLE).insert({
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

  await knex<DatabaseElection>(ELECTION_TABLE).insert({
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
  await expect(api.getMultipleElections(['1', '2', '69', '905393'])).rejects.toThrowError(
    NotFoundError,
  );
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
  await expect(api.getNominations(electionId, 'Teknokrat')).rejects.toThrowError(NotFoundError);
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

  await expect(api.getAllNominations(electionId)).rejects.toThrowError(NotFoundError);
  await expect(api.getAllNominations(electionId, NominationAnswer.NoAnswer)).rejects.toThrowError(
    NotFoundError,
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

  await expect(api.getAllNominationsForUser(electionId, 'aa0000bb-s')).rejects.toThrowError(
    NotFoundError,
  );
  await expect(api.getAllNominations(electionId, NominationAnswer.NoAnswer)).rejects.toThrowError(
    NotFoundError,
  );
});

test('getting number of nominations', async () => {
  const electionId = await api.createElection('aa0000bb-s', ['Macapär', 'Teknokrat'], false);
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

  await expect(api.getAllProposals(electionId)).rejects.toThrowError(NotFoundError);
});

test('getting all electables', async () => {
  const electionId = await api.createElection('aa0000bb-s', ['Macapär', 'Teknokrat'], false);
  const electables = await api.getAllElectables(electionId);
  expect(electables).toHaveLength(2);
  expect(electables).toEqual(expect.arrayContaining(['Macapär', 'Teknokrat']));
});

test('getting all electables when none exists', async () => {
  const electionId = await api.createElection('aa0000bb-s', [], false);
  await expect(api.getAllElectables(electionId)).rejects.toThrowError(NotFoundError);
});

test('creating election returns its ID', async () => {
  const electionId = await api.createElection('aa0000bb-s', [], false);
  const expectedElectionId = (await api.getLatestElections(1))[0]?.id;
  expect(electionId).toEqual(expectedElectionId);
});

test.todo('creating election with no previous elections');

test.todo('creating election with created, but never opened, previous election');

test.todo('creating election with previous created, opened, but not closed election');

test.todo('creating election with previous created, opened and closed election');

test.todo('creating election with no electables and hidden nominations');

test.todo('creating election with valid electables and not hidden nominations');

test.todo('creating election with invalid electables');

test.todo('creating election with mixed valid and invalid electables');

test.todo('adding valid electables to non-existant election');

test.todo('adding valid electables to election');

test.todo('adding mixed valid and non-valid electables to election');

test.todo('adding empty list of electables to election');

test.todo('removing valid electables from non-existant election');

test.todo('removing valid electables from election');

test.todo('removing mixed valid and non-valid electables from election');

test.todo('removing empty list of electables from election');

test.todo('setting hidden nominations');

test.todo('setting hidden nominations on non-existant election');

test.todo('opening non-existant election');

test.todo('opening election');

test.todo('opening already open election');

test.todo('opening already closed election');

test.todo('closing open election');

test.todo('closing multiple elections');

test.todo('nominating');

test.todo('nominating already done nomination');

test.todo('nominating non-electable post');

test.todo('nominating non-existant user');

test.todo('nominating without postnames');

test.todo('nominating mixed valid and invalid postnames');

test.todo('nominating with no open elections');

test.todo('respond to nomination');

test.todo('respond to non-existant nomination');

test.todo('respond to valid nomination after election close');

test.todo('proposing');

test.todo('proposing non-electable post');

test.todo('proposing non-existant user');

test.todo('proposing non-existant post');

test.todo('proposing non-existant election');
