import tokenProvider from '@/auth';
import { ElectionAPI } from '@api/election';
import { Election, NominationAnswer } from '@generated/graphql';
import { PrismaClient } from '@prisma/client';
import requestWithAuth from '@test/utils/requestWithAuth';
import { genRandomPost } from '@test/utils/utils';

const [createPost0, deletePost0] = genRandomPost();
const [createPost1, deletePost1] = genRandomPost();

const prisma = new PrismaClient();

const api = new ElectionAPI();

type ElectionResponse = Pick<Election, 'id' | 'acceptedNominations'>;

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
      answer
    }
  }
}
`;

let postId0: number;
let postId1: number;

const clearDatabase = async () => {
  // Vi sätter `where` till något som alltid är sant
  await prisma.prismaElectable.deleteMany();
  await prisma.prismaProposal.deleteMany();
  await prisma.prismaNomination.deleteMany();
  await prisma.prismaElection.deleteMany();
};

beforeAll(async () => {
  [postId0, postId1] = (await Promise.all([createPost0(), createPost1()])).map((p) => p.id);
});

afterAll(async () => {
  await clearDatabase();
  await Promise.all([deletePost0(), deletePost1()]);
});

test('getting nominations when nominations are hidden', async () => {
  const { id: electionId } = await api.createElection('aa0000bb-s', [postId0, postId1], true);

  await expect(api.openElection(electionId)).resolves.toBeTruthy();
  await expect(api.nominate('aa0000bb-s', [postId0])).resolves.toBeTruthy();
  await expect(api.nominate('bb1111cc-s', [postId0, postId0])).resolves.toBeTruthy();

  await expect(
    api.respondToNomination('aa0000bb-s', postId0, NominationAnswer.Yes),
  ).resolves.toBeTruthy();

  expect((await api.getAllNominations(electionId, NominationAnswer.Yes)).length).toBeGreaterThan(0);

  // Use more seeded users
  const token = tokenProvider.issueToken('nn0000oh-s', 'access_token');
  let data = await requestWithAuth(ELECTION_QUERY, {}, token);

  // Nomineringar är dolda,clear så man ska inte kunna
  // få ut accepterade nomineringar om man inte
  // är valadmin och använder `hiddenNominations`-querien
  expect(data?.data?.openElection).toMatchObject({
    id: electionId,
    acceptedNominations: [],
  });

  // Om nomineringar görs öppna kan man hitta dem!
  await expect(api.setHiddenNominations(electionId, false)).resolves.toBeTruthy();

  data = await requestWithAuth(ELECTION_QUERY, {}, token);
  expect(data?.data?.openElection).toMatchObject({
    id: electionId,
  });

  const { acceptedNominations } = data?.data.openElection as ElectionResponse;

  // För att göra typescript glad
  if (acceptedNominations == null) throw new Error('Should no longer be null');
  if (acceptedNominations[0] == null) throw new Error('Should no longer be null');

  // Borde bara se accepterade nomineringen
  expect(acceptedNominations).toHaveLength(1);
  expect(acceptedNominations[0].answer).toEqual(NominationAnswer.Yes);
});
