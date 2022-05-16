export const USER_WITH_ACCESS_QUERY = `
	query ($username: String!) {
		user(username: $username) {
			firstName
			lastName
			username
      access {
        features
        doors
      }
	}
}
`;

export const CREATE_USER_MUTATION = `
  mutation ($input: NewUser!) {
    createUser(input: $input)
  }
`;

export const ADD_POST_MUTATION = `
  mutation ($info: NewPost!) {
    addPost(info: $info)
  }
`;

export const ADD_USER_TO_POST = `
  mutation ($usernames: [String!]!, $postname: String!) {
    addUsersToPost(usernames: $usernames, postname: $postname)
  }
`;

export const SET_USER_ACCESS_MUTATION = `
	mutation ($username: String!, $access: AccessInput!) {
		setIndividualAccess(username: $username, access: $access)
	}
`;

export const SET_POST_ACCESS_MUTATION = `
	mutation ($postId: Int!, $access: AccessInput!) {
		setPostAccess(postId: $postId, access: $access)
	}
`;

const ARTICLE_FIELDS = `
{
  id
  slug
  title
  body
  signature
  createdAt
  lastUpdatedAt
  articleType
  tags
  creator {
    username
  }
  lastUpdatedBy {
    username
  }
}
`;

export const ARTICLE_QUERY = `
  query article($id: ID, $markdown: Boolean) {
    article(id: $id, markdown: $markdown) ${ARTICLE_FIELDS}
  }
`;

export const ADD_ARTICLE_MUTATION = `
mutation ($entry: NewArticle!) {
  addArticle(entry: $entry) ${ARTICLE_FIELDS}
}
`;

export const MODIFY_ARTICLE_MUTATION = `
mutation ($articleId: ID!, $entry: ModifyArticle!) {
  modifyArticle(articleId: $articleId, entry: $entry)
}
`;

export const REMOVE_ARTICLE_MUTATION = `
mutation($articleId: ID!) {
  removeArticle(articleId: $articleId)
}
`;
