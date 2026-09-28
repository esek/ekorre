import tokenProvider from '@/auth';
import { ElectionAPI } from '@api/election';
import { PrismaPost, PrismaUser } from '@prisma/client';
import { sendEmail } from '@service/email';
import requestWithAuth from '@test/utils/requestWithAuth';
import { genRandomPost, genRandomUser } from '@test/utils/utils';

jest.mock('@service/email', () => ({ sendEmail: jest.fn() }));

const api = new ElectionAPI();
const mockedSendEmail = sendEmail as jest.MockedFunction<typeof sendEmail>;

const NOMINATE_MUTATION = `
  mutation nominate($username: String!, $postIds: [Int!]!) {
    nominate(username: $username, postIds: $postIds)
  }
`;

let nominee: PrismaUser;
let post: PrismaPost;
let removeNominee: () => Promise<void>;
let removePost: () => Promise<void>;

beforeAll(async () => {
  const [createUser, deleteUser] = genRandomUser();
  nominee = await createUser();
  removeNominee = deleteUser;

  const [createPost, deletePost] = genRandomPost();
  post = await createPost();
  removePost = deletePost;
});

afterEach(async () => {
  await api.clear();
  mockedSendEmail.mockClear();
});

afterAll(async () => {
  await removePost();
  await removeNominee();
});

const nominate = (postIds: number[]) =>
  requestWithAuth(
    NOMINATE_MUTATION,
    { username: nominee.username, postIds },
    tokenProvider.issueToken('aa0000bb-s', 'access_token'),
  );

test('nominating for a post in an open election sends one mail', async () => {
  const { id } = await api.createElection('aa0000bb-s', [post.id], false);
  await api.openElection(id);

  const res = await nominate([post.id]);

  expect(res.errors).toBeUndefined();
  expect(res.data?.nominate).toBe(true);
  expect(mockedSendEmail).toHaveBeenCalledTimes(1);
  expect(mockedSendEmail.mock.calls[0][0]).toBe(nominee.email);
});

test('nominating for a post without an open election fails and sends no mail', async () => {
  const res = await nominate([post.id]);

  expect(res.errors).toMatchObject([
    { message: 'Det finns inget öppet val med den angivna posten' },
  ]);
  expect(res.data?.nominate).toBeUndefined();
  expect(mockedSendEmail).not.toHaveBeenCalled();
});

test('nominating with no posts fails and sends no mail', async () => {
  const res = await nominate([]);

  expect(res.errors).toBeDefined();
  expect(mockedSendEmail).not.toHaveBeenCalled();
});
