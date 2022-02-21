import { ELECTABLE_TABLE, ELECTION_TABLE, NOMINATION_TABLE, PROPOSAL_TABLE } from '@/api/constants';
import db from '@/api/knex';
import { ElectionAPI } from '@api/election';
import {
  DatabaseElectable,
  DatabaseElection,
  DatabaseNomination,
  DatabaseProposal,
} from '@db/election';
import { Election, NominationResponse } from '@generated/graphql';
import { ApiRequest, GraphqlResponse } from '@test/models/test';
import { AXIOS_CONFIG } from '@test/utils/axiosConfig';
import axios from 'axios';

const api = new ElectionAPI();
interface ElectionResponse {
  openElection: Partial<Election>;
}

const ELECTION_QUERY = `
{
  openElection {
    id
    acceptedNominations {
      user {
        username
      }
      post {
        postname
      }
      accepted
    }
  }
}
`;

let preTestElectionTable: DatabaseElection[];
let preTestElectableTable: DatabaseElectable[];
let preTestProposalTable: DatabaseProposal[];
let preTestNominationTable: DatabaseNomination[];

const clearDatabase = async () => {
  // Vi sätter `where` till något som alltid är sant
  await db<DatabaseElectable>(ELECTABLE_TABLE).delete().whereNotNull('refelection');
  await db<DatabaseProposal>(PROPOSAL_TABLE).delete().whereNotNull('refelection');
  await db<DatabaseNomination>(NOMINATION_TABLE).delete().whereNotNull('refelection');
  await db<DatabaseElection>(ELECTION_TABLE).delete().whereNotNull('id');
};

beforeAll(async () => {
  preTestElectionTable = await db<DatabaseElection>(ELECTION_TABLE).select('*');
  preTestElectableTable = await db<DatabaseElectable>(ELECTABLE_TABLE).select('*');
  preTestProposalTable = await db<DatabaseProposal>(PROPOSAL_TABLE).select('*');
  preTestNominationTable = await db<DatabaseNomination>(NOMINATION_TABLE).select('*');
  await clearDatabase();
});

afterEach(async () => {
  await clearDatabase();
});

afterAll(async () => {
  // Sätt in cachade värden igen
  await db<DatabaseElection>(ELECTION_TABLE).insert(preTestElectionTable);
  await db<DatabaseElectable>(ELECTABLE_TABLE).insert(preTestElectableTable);
  await db<DatabaseProposal>(PROPOSAL_TABLE).insert(preTestProposalTable);
  await db<DatabaseNomination>(NOMINATION_TABLE).insert(preTestNominationTable);
});

test('getting nominations when nominations are hidden', async () => {
  const electionId = await api.createElection('aa0000bb-s', ['Macapär', 'Teknokrat'], true);
  await expect(api.openElection(electionId)).resolves.toBeTruthy();
  await expect(api.nominate('aa0000bb-s', ['Macapär'])).resolves.toBeTruthy();
  await expect(api.nominate('bb1111cc-s', ['Macapär', 'Teknokrat'])).resolves.toBeTruthy();
  await expect(
    api.respondToNomination('aa0000bb-s', 'Macapär', NominationResponse.Yes),
  ).resolves.toBeTruthy();
  expect((await api.getAllNominations(electionId, NominationResponse.Yes)).length).toBeGreaterThan(0);

  const electionData = {
    query: ELECTION_QUERY,
  };

  // Nu kollar vi om vi kan se dessa nomineringar
  const axiosInstance = axios.create(AXIOS_CONFIG);
  await axiosInstance
    .post<ApiRequest, GraphqlResponse<ElectionResponse>>('/', electionData)
    .then((res) => {
      expect(res.data.data.openElection.id).toEqual(electionId.toString());

      // Nomineringar är dolda, så man ska inte kunna
      // få ut accepterade nomineringar om man inte
      // är valadmin och använder `hiddenNominations`-querien
      expect(res.data.data.openElection.acceptedNominations).toBeNull();
    });

  // Om nomineringar görs öppna kan man hitta dem!
  await expect(api.setHiddenNominations(electionId, false)).resolves.toBeTruthy();
  await axiosInstance
    .post<ApiRequest, GraphqlResponse<ElectionResponse>>('/', electionData)
    .then((res) => {
      expect(res.data.data.openElection.id).toEqual(electionId.toString());

      const { acceptedNominations } = res.data.data.openElection;

      // För att göra typescript glad
      if (acceptedNominations == null) throw new Error('Should no longer be null');
      if (acceptedNominations[0] == null) throw new Error('Should no longer be null');

      // Borde bara se accepterade nomineringen
      expect(acceptedNominations).toHaveLength(1);
      expect(acceptedNominations[0].accepted).toEqual(NominationResponse.Yes);
    });
});
