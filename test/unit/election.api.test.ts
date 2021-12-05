import {
  ELECTABLE_TABLE,
  ELECTION_TABLE,
  NOMINATION_TABLE,
  PROPOSAL_TABLE,
} from '../../src/api/constants';
import { ElectionAPI } from '../../src/api/election.api';
import knex from '../../src/api/knex';
import { NotFoundError } from '../../src/errors/RequestErrors';
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
 * Lägger till ett antal dummy elections och stänger
 * dem igen. Undvik höga n för att inte sakta ner
 * tester för mycket.
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
    openedAt: Date.now() + 1000,
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

test.todo('get multiple elections');

test.todo('get multiple meetings when none exists');

test.todo('get nominations');

test.todo('get nominations when none exists');

test.todo('get all nominations with specified answer');

test.todo('get all nominations without specified answer');

test.todo('get all nominations when none exists');

test.todo('get all nominations for user with specified answer');

test.todo('get all nominations for user without specified answer');

test.todo('get all nominations for user when none exists');

test.todo('get number of nominations without postname');

test.todo('get number of nominations with existing postname');

test.todo('get number of nominations with nonexistant postname');

test.todo('get number of proposals without postname');

test.todo('get number of proposals with existing postname');

test.todo('get number of proposals with nonexistant postname');