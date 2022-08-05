// Använt av userLoader
// userLoader är ett sätt att cacha User, då dessa
// används på flera olika ställen i API:n. Jag har utgått
// från detta projekt: https://github.com/benawad/graphql-n-plus-one-example
import { useDataLoader } from '@/dataloaders';
import { Context } from '@/models/context';
import { ArticleResponse } from '@/models/mappers';
import { reduce } from '@/reducers';
import { hasAccess, hasAuthenticated } from '@/util';
import { ArticleAPI } from '@api/article';
import { ArticleType, Feature, Resolvers } from '@generated/graphql';
import { PrismaArticleType } from '@prisma/client';
import { articleReducer } from '@reducer/article';

const articleApi = new ArticleAPI();

const checkEditAccess = async (ctx: Context, articleType: PrismaArticleType) => {
  await hasAccess(
    ctx,
    articleType === PrismaArticleType.INFORMATION ? Feature.ArticleEditor : Feature.NewsEditor,
  );
};

/**
 * Maps an `DatabaseArticle` i.e. a partial of `Article` to an ArticleResponse object
 * @param partial DatabaseArticle to be mapped
 * @returns ArticleResponse object with references to `author` and
 * `lastUpdatedBy`
 */
const articleResolver: Resolvers = {
  Article: {
    // Load author & lastUpdateBy using dataloader for performace reasons
    author: useDataLoader((model, ctx) => ({
      key: model.author.username,
      dataLoader: ctx.userDataLoader,
    })),
    lastUpdatedBy: useDataLoader((model, ctx) => ({
      key: model.lastUpdatedBy.username,
      dataLoader: ctx.userDataLoader,
    })),
    tags: (article, { includeSpecial }, _) => {
      const safeTags = article.tags ?? [];

      if (!includeSpecial) {
        return safeTags.filter((tag) => !tag.startsWith('special:'));
      }

      return safeTags;
    },
  },
  Query: {
    newsentries: async (_, { author, after, before }, ctx) => {
      await hasAuthenticated(ctx);
      let articleResponse: ArticleResponse[];

      if (!author && !after && !before) {
        const apiResponse = await articleApi.getAllNewsArticles();
        if (apiResponse === null) return [];
        articleResponse = reduce(apiResponse, articleReducer);
      } else {
        const beforeDate = new Date(before ?? Number.MAX_VALUE); // Set really high date if nothing is provided
        const afterDate = new Date(after ?? Number.MIN_VALUE); // Set really low date if nothing is provided

        const apiResponse = await articleApi.getNewsArticlesFromInterval(
          afterDate,
          beforeDate,
          author ?? undefined,
        );

        articleResponse = reduce(apiResponse, articleReducer);
      }

      return articleResponse;
    },
    latestnews: async (_, { limit }, ctx) => {
      await hasAuthenticated(ctx);
      let articleResponse: ArticleResponse[];

      // Om vi inte gett en limit returnerar vi bara alla artiklar
      if (limit) {
        const apiResponse = await articleApi.getLatestNews(limit);
        if (apiResponse === null) return [];
        articleResponse = reduce(apiResponse, articleReducer);
      } else {
        articleResponse = reduce(await articleApi.getAllNewsArticles(), articleReducer);
      }

      // If we get no articles, we should just return null directly.
      if (articleResponse.length === 0) {
        return [];
      }

      // Vi vill returnera en tom array, inte null
      return articleResponse;
    },
    article: async (_, { id, slug }, ctx) => {
      // Vi får tillbaka en DatabaseArticle som inte har en hel användare, bara unikt användarnamn.
      // Vi måste använda UserAPI:n för att få fram denna användare.
      const apiResponse = await articleApi.getArticle(id ?? undefined, slug ?? undefined);

      // Vi vill bara returnera til vem som om denna är information
      if (apiResponse.articleType !== ArticleType.Information) {
        await hasAuthenticated(ctx);
      }

      return reduce(apiResponse, articleReducer);
    },
    articles: async (_, { author, id, type, tags }, ctx) => {
      const apiResponse = await articleApi.getArticles(author, id, type, tags);

      // We only want to authenticate if we have more than zero
      // non-information articles
      const firstNonInformationArticle = apiResponse.find(
        (a) => a.articleType !== ArticleType.Information,
      );
      if (firstNonInformationArticle != null) {
        await hasAuthenticated(ctx);
      }
      return reduce(apiResponse, articleReducer);
    },
  },
  Mutation: {
    addArticle: async (_, { entry }, ctx) => {
      await checkEditAccess(ctx, entry.articleType);
      // Special type of reduce
      const apiResponse = await articleApi.newArticle(ctx.getUsername(), entry);
      return reduce(apiResponse, articleReducer);
    },
    modifyArticle: async (_, { articleId, entry }, ctx) => {
      const article = await articleApi.getArticle(articleId);

      /**
       * If trying to set a new articleType, make sure we check that the user is allowed to do so.
       *  */
      await checkEditAccess(ctx, entry?.articleType ?? article.articleType);

      const apiResponse = await articleApi.modifyArticle(articleId, ctx.getUsername(), entry);

      return reduce(apiResponse, articleReducer);
    },
    removeArticle: async (_, { articleId }, ctx) => {
      const article = await articleApi.getArticle(articleId);
      await checkEditAccess(ctx, article.articleType);
      return articleApi.removeArticle(articleId);
    },
  },
};

export default articleResolver;
