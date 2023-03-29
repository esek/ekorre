import { reduce } from '@/reducers';
import { OrbiAPI } from '@api/orbi';
import { Activity, Resolvers, Utskott, UtskottInfo } from '@generated/graphql';
import { orbiActivityReduce, orbiDepartmentReduce } from '@reducer/orbi';

const api = new OrbiAPI();

const orbiResolver: Resolvers = {
  Query: {
    getActivities: async (_, { year: year, month: month, departments: departments }, __) => {
      const acts = await api.getActivities(
        year,
        month,
        departments ? (departments as Utskott[]) : Object.values(Utskott),
      );
      return reduce(acts, orbiActivityReduce);
    },

    getDepartments: async (_, { departments: departments }, __) => {
      const deps = departments
        ? await api.getDepartmentInfo(departments as Utskott[])
        : await api.getDepartmentInfo(Object.values(Utskott));
      return reduce(deps, orbiDepartmentReduce);
    },
  },
};

export default orbiResolver;
