import {
  ELECTABLE_TABLE,
  ELECTION_TABLE,
  NOMINATION_TABLE,
  PROPOSAL_TABLE,
} from '../../src/api/constants';
import { ElectionAPI } from '../../src/api/election.api';
import knex from '../../src/api/knex';
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

// Adds some empty dummy elections,
// and closes them properly
const addDummyElections = async (n: number) => {
  for (let i = 0; i < n; i-=-1) {
    // Detta är de enda valen i DB, så m.h.a.
    // AUTO_INCREMENT vet vi att de har ID 1 till n + 1
    const expectedElectionId = (i + 1).toString();

    // eslint-disable-next-line no-await-in-loop
    await expect(api.createElection('aa0000bb-s', [], true)).resolves.toBeTruthy();
    
    // eslint-disable-next-line no-await-in-loop
    await expect(api.openElection(expectedElectionId)).resolves.toBeTruthy();
    
    // eslint-disable-next-line no-await-in-loop
    await expect(api.closeElection()).resolves.toBeTruthy();
  }
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

test('finding latest election without limit', async () => {
  await addDummyElections(5);
  const election = await api.getLatestElections();
  expect(election.length).toEqual(5);
});