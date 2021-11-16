import { useDirective } from '.';
import { UnauthenticatedError } from '../../errors/RequestErrors';

export const permissionsDirectiveTransformer = useDirective<{roles: string[]}>('withPermissions', 
	async ({getUsername}, resolve, {roles}) => {
		const username = getUsername();

		if(!username) {
			throw new UnauthenticatedError('Du måste logga in för att se denna resursen');
		}
		
		// TODO: Verify user roles
		
		return resolve();
	});