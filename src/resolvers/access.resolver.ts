import AccessAPI from '../api/access.api';
import { Resolvers } from '../graphql.generated';
import { dependecyGuard } from '../util';

dependecyGuard('access', ['user']);

const api = new AccessAPI();

const access: Resolvers = {
  Query: {
    individualAccess: (_, { username }) => api.getIndividualAccess(username),
    postAccess: (_, { postname }) => api.getPostAccess(postname),
  },
};

export default access;
