import axios from 'axios';
import { graphql } from 'graphql';
import { parseStringPromise } from 'xml2js';

import { UserAPI } from '../api/user.api';
import { schema } from '../app';
import { invalidateToken, issueToken, verifyToken } from '../auth';
import config from '../config';
import type { NewUser, Resolvers, User } from '../graphql.generated';
import { reduce } from '../reducers';
import { userReduce } from '../reducers/user.reducer';

const api = new UserAPI();

const getUser = (username: string) => {
  // Detta är sinnessjukt osnyggt... dock nyttjar vi den modulära
  // struktruren och gör att import av en beroende modul krävs
  const query = `{
    user(username: "${username}") {
      username
      name
      lastname
      class
      access {
        web
        doors
      }
      posts {
        postname
        utskott
      }
    }
  }`;
  return graphql(schema, query);
};

const userResolver: Resolvers = {
  Query: {
    user: async (_, { username }) => {
      // ctx.getUser();
      const u = await api.getSingleUser(username);
      if (u != null) return reduce(u, userReduce);
      return null;
    },
  },
  Mutation: {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    login: async (_, { username, password }) => {
      const partialUser = await api.loginUser(username, password);
      if (partialUser == null) return null;

      const data = await getUser(username);

      const token = issueToken(data.data?.user);
      return token;
    },
    createUser: (_, { input }) => api.createUser(input),
    logout: (_, { token }) => invalidateToken(token),
    refreshToken: async (_, { token }) => {
      const obj = verifyToken<User>(token);

      const user = await getUser(obj.username);
      return issueToken(user.data?.user);
    },
    casRegister: async (_, { ticket }) => {
      const CB_URL = `${config.EKOLLON}/register`;
      const LU_URL = `https://idpv3.lu.se/idp/profile/cas/serviceValidate?renew=false&service=${encodeURI(
        CB_URL,
      )}&ticket=${ticket}`;

      const xml = await axios.get(LU_URL).then((res) => res.data);

      const response = await parseStringPromise(xml);

      const error = response['cas:serviceResponse']['cas:authenticationFailure'];

      // Cas validering failed
      if (error) {
        console.log(error);
        return null;
      }

      // TODO: Get correct fields from response

      const input: NewUser = {
        password: '',
        username: '',
        class: '',
        name: '',
        lastname: '',
      };

      const user = await api.createUser(input);

      return user;
    },
  },
};

export default userResolver;
