import { AccessAPI } from '@api/access';
import { UserAPI } from '@api/user';
import { AccessInput } from '@generated/graphql';

const userApi = new UserAPI();
const accessApi = new AccessAPI();
export const userWithAccess = async (username: string, access: AccessInput) => {
  await userApi.createUser({
    username,
    password: 'test',
    firstName: 'Test',
    lastName: 'Testsson',
    class: 'EXX',
  });

  await accessApi.setIndividualAccess(username, access);
};