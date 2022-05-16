import { ElectionAPI } from '@api/election';
import { Election, NominationAnswer } from '@generated/graphql';
import { PrismaClient } from '@prisma/client';
import { ApiRequest, GraphqlResponse } from '@test/models/test';
import { AXIOS_CONFIG } from '@test/utils/axiosConfig';
import axios from 'axios';

const prisma = new PrismaClient();

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

const clearDatabase = async () => {
  // Vi sätter `where` till något som alltid är sant
  await prisma.prismaElectable.deleteMany();
  await prisma.prismaProposal.deleteMany();
  await prisma.prismaNomination.deleteMany();
  await prisma.prismaElection.deleteMany();
};

afterEach(async () => {
  await clearDatabase();
});

test('getting nominations when nominations are hidden', async () => {
  const electionId = await api.createElection('aa0000bb-s', ['macapar', 'teknokrat'], true);

  await expect(api.openElection(electionId)).resolves.toBeTruthy();
  await expect(api.nominate('aa0000bb-s', ['macapar'])).resolves.toBeTruthy();
  await expect(api.nominate('bb1111cc-s', ['macapar', 'macapar'])).resolves.toBeTruthy();

  await expect(
    api.respondToNomination('aa0000bb-s', 'macapar', NominationAnswer.Yes),
  ).resolves.toBeTruthy();

  expect((await api.getAllNominations(electionId, NominationAnswer.Yes)).length).toBeGreaterThan(0);

  const electionData = {
    query: ELECTION_QUERY,
  };

  // Nu kollar vi om vi kan se dessa nomineringar
  const axiosInstance = axios.create(AXIOS_CONFIG);
  await axiosInstance
    .post<ApiRequest, GraphqlResponse<ElectionResponse>>('/', electionData)
    .then((res) => {
      expect(res.data.data.openElection.id).toEqual(electionId);

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
      expect(res.data.data.openElection.id).toEqual(electionId);

      const { acceptedNominations } = res.data.data.openElection;

      // För att göra typescript glad
      if (acceptedNominations == null) throw new Error('Should no longer be null');
      if (acceptedNominations[0] == null) throw new Error('Should no longer be null');

      // Borde bara se accepterade nomineringen
      expect(acceptedNominations).toHaveLength(1);
      expect(acceptedNominations[0].accepted).toEqual(NominationAnswer.Yes);
    });
});
