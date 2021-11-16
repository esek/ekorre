import { getDirective, MapperKind, mapSchema } from '@graphql-tools/utils';
import { defaultFieldResolver, GraphQLFieldResolver, GraphQLSchema } from 'graphql';

import { Context } from '../../models/context';

type GqlFieldResolver = GraphQLFieldResolver<unknown, Context>;

// prettier-ignore
type CustomResolver<TArgs> = (ctx: Context, resolve: () => GqlFieldResolver, args: TArgs) => Promise<GqlFieldResolver> | GqlFieldResolver;

/**
 * Helper function to create a custom directive
 * @param name The name of the directive
 * @param customResolver Defines how you want the function to resolve
 * @returns A graphql mapped schema with the new directive
 */

// prettier-ignore
export const useDirective = <TArgs extends Record<string, unknown>>(name: string, customResolver: CustomResolver<TArgs>) =>
  // returns a function that takes a schema and returns a new schema
  (schema: GraphQLSchema) =>
    mapSchema(schema, {
      [MapperKind.OBJECT_FIELD]: (field) => {
        // Try to get the actual directive
        const directive = getDirective(schema, field, name)?.[0];

        // If it exists, we can resplace the resolving
        if (directive) {
          const { resolve = defaultFieldResolver } = field;

          // eslint-disable-next-line no-param-reassign
          field.resolve = async (source, args, context: Context, info) => {
            // Define a helper func so we don't need to pass in all the args
            const r = () => resolve(source, args, context, info) as GqlFieldResolver;

            // Use the custom resolver to only pass the context, resolve function and any arguments in the directive
            return customResolver(context, r, directive as unknown as TArgs);
          };
        }

        return field;
      },
    });
