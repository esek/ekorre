import ResourcesAPI from '@api/accessresources';
import { AccessResource, AccessResourceType } from '@generated/graphql';
import { getApolloServer } from '@test/utils/apollo';

const apolloServer = getApolloServer();
const accessResourceApi = new ResourcesAPI();

const TEST_RESOURCE_1: AccessResource = {
  name: 'Supermegaawesome användare',
  slug: 'axel-froborg',
  description: 'Bäst på allt och får göra vad den vill',
  resourceType: AccessResourceType.Web,
};

const TEST_RESOURCE_2: AccessResource = {
  name: 'Röda dörren',
  slug: 'emil-eriksson',
  description: 'En röd dörr',
  resourceType: AccessResourceType.Door,
};

const TEST_RESOURCE_3: AccessResource = {
  name: 'Emil',
  slug: 'emil',
  description: 'Alla som heter Emil',
  resourceType: AccessResourceType.Web,
};

const RESOURCES = [TEST_RESOURCE_1, TEST_RESOURCE_2];

describe('access resources', () => {
  beforeAll(async () => {
    await Promise.all(
      RESOURCES.map(async ({ name, description, slug, resourceType }) =>
        accessResourceApi.addResource(name, slug, description, resourceType),
      ),
    );
  });

  afterAll(async () => {
    await Promise.all(RESOURCES.map(async ({ slug }) => accessResourceApi.removeResouce(slug)));
  });

  const ACCESS_RESOURCES_QUERY = `
		query($type: AccessResourceType) {
			accessResources(type: $type) {
				name
				slug
				description
				resourceType
			}
		}
	`;

  const ACCESS_RESOURCE_QUERY = `
		query($slug: String!) {
			accessResource(slug: $slug) {
				name
				slug
				description
				resourceType
			}
		}
	`;

  const ADD_ACCESS_RESOURCE_MUTATION = `
		mutation($name: String!, $slug: String!, $description: String!, $resourceType: AccessResourceType!) {
			addAccessResource(name: $name, slug: $slug, description: $description, resourceType: $resourceType)
		}
	`;

  const REMOVE_ACCESS_RESOURCE_MUTATION = `
		mutation($slug: String!) {
			removeAccessResource(slug: $slug)
		}
	`;

  it('can fetch all resources', async () => {
    const resp = await apolloServer.executeOperation({
      query: ACCESS_RESOURCES_QUERY,
      variables: {},
    });

    expect(resp.errors).toBeUndefined();
    expect(resp.data).toBeDefined();
    expect(resp.data?.accessResources).toEqual(expect.arrayContaining(RESOURCES));
  });

  it('can filter resources by type', async () => {
    const resp = await apolloServer.executeOperation({
      query: ACCESS_RESOURCES_QUERY,
      variables: { type: AccessResourceType.Web },
    });

    expect(resp.errors).toBeUndefined();
    expect(resp.data).toBeDefined();
    expect(resp.data?.accessResources).toEqual(expect.arrayContaining([TEST_RESOURCE_1]));
    expect(resp.data?.accessResources).toEqual(expect.not.arrayContaining([TEST_RESOURCE_2])); // should not have any door
  });

  it('can fetch a specific resource', async () => {
    const resp = await apolloServer.executeOperation({
      query: ACCESS_RESOURCE_QUERY,
      variables: { slug: TEST_RESOURCE_1.slug },
    });

    expect(resp.errors).toBeUndefined();
    expect(resp.data).toBeDefined();
    expect(resp.data?.accessResource).toEqual(TEST_RESOURCE_1);
  });

  it('can add a resource', async () => {
    const resp = await apolloServer.executeOperation({
      query: ADD_ACCESS_RESOURCE_MUTATION,
      variables: TEST_RESOURCE_3,
    });

    expect(resp.errors).toBeUndefined();
    expect(resp.data).toBeDefined();
    expect(resp.data?.addAccessResource).toEqual(true);
  });

  it('can remove a resource', async () => {
    const resp = await apolloServer.executeOperation({
      query: REMOVE_ACCESS_RESOURCE_MUTATION,
      variables: { slug: TEST_RESOURCE_3.slug },
    });

    expect(resp.errors).toBeUndefined();
    expect(resp.data).toBeDefined();
    expect(resp.data?.removeAccessResource).toEqual(true);
  });
});
