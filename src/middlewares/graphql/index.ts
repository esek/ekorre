import { getDirective, MapperKind, mapSchema } from '@graphql-tools/utils';
import { defaultFieldResolver, GraphQLFieldResolver, GraphQLSchema } from 'graphql';
import { Context } from '../../models/context';

type GqlFieldResolver = GraphQLFieldResolver<any, Context>;
type CustomResolver<TArgs> = (ctx: Context, resolve: () => GqlFieldResolver, args: TArgs) => Promise<GqlFieldResolver> | GqlFieldResolver;


export const useDirective = <TArgs extends Record<string, unknown> = {}>(name: string, customResolver: CustomResolver<TArgs>) => 
(schema: GraphQLSchema) =>
	mapSchema(schema, {
		[MapperKind.OBJECT_FIELD]: (field) => {
			const directive = getDirective(schema, field, name)?.[0];
			
			if(directive) {
				const {resolve = defaultFieldResolver} = field;

				field.resolve = async (source, args, context: Context, info) => {
					const r = () => resolve(source, args, context, info);
					
					return customResolver(context, r, directive as any);
				};
			}

			return field;
		}
	});