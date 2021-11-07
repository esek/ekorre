import { UserAPI } from '../../src/api/user.api';
import { useDataLoader, createDataLoader } from '../../src/dataloaders';
import { batchUsersFunction } from '../../src/dataloaders/user.dataloader';

const userApi = new UserAPI();

// Vi kontrollerar antal anrop till API:n
const apiSpy = jest.spyOn(userApi, 'getMultipleUsers');

beforeEach(() => {
  // För att vi ska återställa räkningen
  // av anrop
  jest.clearAllMocks();
});

test('loading non-existant user', async () => {
  const fakeUsername = 'This is not a valid username.com!';
  const dl = createDataLoader(batchUsersFunction);
  const result = await dl.load(fakeUsername);
  expect(result).toStrictEqual(new Error(`No result for username ${fakeUsername}`));
  expect(apiSpy).toHaveBeenCalledTimes(1);
});
