import { AccessAPI } from '@api/access';
import { AccessMapping, AccessResource, AvailableResolver, ResolverType } from '@generated/graphql';
import { getApolloServer } from '@test/utils/apollo';

const apolloServer = getApolloServer();

const accessApi = new AccessAPI();

const ME_RESOLVER: AvailableResolver = { name: 'me', type: ResolverType.Query };
const LOGIN_RESOLVER: AvailableResolver = { name: 'login', type: ResolverType.Mutation };

describe('resolvers', () => {
  const RESOLVERS_QUERY = `
		query ($type: ResolverType) {
			resolvers(type: $type) {
				name
				type
			}
		}
	`;

  const RESOLVER_EXISTS_QUERY = `
		query ($type: ResolverType!, $name: String!) {
			resolverExists(type: $type, name: $name)
		}
	`;

  it('can fetch all resolvers', async () => {
    const resp = await apolloServer.executeOperation({
      query: RESOLVERS_QUERY,
      variables: {},
    });

    expect(resp.errors).toBeUndefined();
    expect(resp.data).toBeDefined();
    expect(resp.data?.resolvers).toEqual(expect.arrayContaining([ME_RESOLVER, LOGIN_RESOLVER]));
  });

  it('can filter by query', async () => {
    const resp = await apolloServer.executeOperation({
      query: RESOLVERS_QUERY,
      variables: { type: ResolverType.Query },
    });

    expect(resp.errors).toBeUndefined();
    expect(resp.data).toBeDefined();
    expect(resp.data?.resolvers).toEqual(expect.arrayContaining([ME_RESOLVER]));
    expect(resp.data?.resolvers).toEqual(
      expect.not.arrayContaining([
        expect.objectContaining({
          type: ResolverType.Mutation,
        }),
      ]),
    ); // should not have any mutation
  });

  it('can filter by mutation', async () => {
    const resp = await apolloServer.executeOperation({
      query: RESOLVERS_QUERY,
      variables: { type: ResolverType.Mutation },
    });

    expect(resp.errors).toBeUndefined();
    expect(resp.data).toBeDefined();
    expect(resp.data?.resolvers).toEqual(expect.arrayContaining([LOGIN_RESOLVER]));
    expect(resp.data?.resolvers).toEqual(
      expect.not.arrayContaining([expect.objectContaining({ type: ResolverType.Query })]),
    ); // should not have any mutation
  });

  it('checks if resolver exists', async () => {
    const queryExists = await apolloServer.executeOperation({
      query: RESOLVER_EXISTS_QUERY,
      variables: ME_RESOLVER,
    });

    expect(queryExists.errors).toBeUndefined();
    expect(queryExists.data).toBeDefined();
    expect(queryExists.data?.resolverExists).toBe(true);

    const queryDoesNotExist = await apolloServer.executeOperation({
      query: RESOLVER_EXISTS_QUERY,
      variables: { type: ResolverType.Query, name: 'jag' },
    });

    expect(queryDoesNotExist.errors).toBeUndefined();
    expect(queryDoesNotExist.data).toBeDefined();
    expect(queryDoesNotExist.data?.resolverExists).toBe(false);

    const mutationExists = await apolloServer.executeOperation({
      query: RESOLVER_EXISTS_QUERY,
      variables: LOGIN_RESOLVER,
    });

    expect(mutationExists.errors).toBeUndefined();
    expect(mutationExists.data).toBeDefined();
    expect(mutationExists.data?.resolverExists).toBe(true);

    const mutationDoesNotExist = await apolloServer.executeOperation({
      query: RESOLVER_EXISTS_QUERY,
      variables: { type: ResolverType.Mutation, name: 'loggaUt' },
    });

    expect(mutationDoesNotExist.errors).toBeUndefined();
    expect(mutationDoesNotExist.data).toBeDefined();
    expect(mutationDoesNotExist.data?.resolverExists).toBe(false);
  });
});

describe('mappings', () => {
  const checkExisting = async () => {
    const existing = await apolloServer.executeOperation({
      query: ACCESS_MAPPINGS_QUERY,
      variables: ME_RESOLVER,
    });

    return existing.data?.accessMappings as AccessMapping[];
  };

  beforeAll(() => {
    accessApi.setAccessMappings('logout', ResolverType.Mutation, ['super-admin']);
  });

  afterAll(() => {
    accessApi.setAccessMappings('logout', ResolverType.Mutation);
  });

  const ACCESS_MAPPINGS_QUERY = `
		query ($name: String, $type: ResolverType) {
			accessMappings(name: $name, type: $type) {
				id
				resolver {
					name
					type
				}
				resources {
					slug
				}
			}
		}
	`;

  const SET_RESOLVER_MAPPINGS_MUTATION = `
		mutation ($name: String!, $type: ResolverType!, $slugs: [String!]) {
			setResolverMappings(name: $name, type: $type, slugs: $slugs) 
		}
	`;

  it('can get access mappings', async () => {
    const resp = await apolloServer.executeOperation({
      query: ACCESS_MAPPINGS_QUERY,
      variables: {},
    });

    expect(resp.errors).toBeUndefined();
    expect(resp.data).toBeDefined();
    expect(resp.data?.accessMappings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          resolver: {
            name: 'logout',
            type: ResolverType.Mutation,
          },
        }),
      ]),
    );
  });

  it('can set resolver mappings', async () => {
    const before = await checkExisting();
    expect(before.length).toEqual(0);

    const resp = await apolloServer.executeOperation({
      query: SET_RESOLVER_MAPPINGS_MUTATION,
      variables: {
        ...ME_RESOLVER,
        slugs: ['super-admin'],
      },
    });

    expect(resp.errors).toBeUndefined();
    expect(resp.data).toBeDefined();
    expect(resp.data?.setResolverMappings).toBe(true);

    const after = await checkExisting();
    expect(after.length).toEqual(1);
    expect(after).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          resolver: ME_RESOLVER,
          resources: expect.arrayContaining([
            {
              slug: 'super-admin',
            },
          ]) as AccessResource[],
        }),
      ]),
    );
  });

  it('can remove access mappings', async () => {
    const before = await checkExisting();
    expect(before.length).toEqual(1);

    const resp = await apolloServer.executeOperation({
      query: SET_RESOLVER_MAPPINGS_MUTATION,
      variables: ME_RESOLVER,
    });

    expect(resp.errors).toBeUndefined();
    expect(resp.data).toBeDefined();
    expect(resp.data?.setResolverMappings).toBe(true);

    const after = await checkExisting();
    expect(after.length).toEqual(0);
  });
});
