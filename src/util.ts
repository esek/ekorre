import DataLoader from 'dataloader';
import { userReducer } from './reducers/user.reducer';
import { UserAPI } from './api/user.api';
import type { User } from './graphql.generated';

/* eslint-disable import/prefer-default-export */

/**
 * Utility function to ensure that the required modules
 * are supplied in the config.
 */
export const dependecyGuard = (name: string, dependecies: string[]): void => {
  const modules = JSON.parse(process.env.MODULES ?? '[]') as string[];
  if (!dependecies.every((e) => modules.includes(e)))
    throw new Error(`Module(s) ${dependecies.join(' ')} is required by ${name}!`);
};

/**
 * These are functions related to DataLoader and the
 * GraphQL (n+1) problem. To create a new kind of dataloader,
 * create a batch function and a create<Type>DataLoader() function.
 * 
 * Why not simply have global DataLoader objects? Well they would quickly become
 * outdated, and it would result in caching data server-side which may quickly
 * be outdated. This is intended for batching, i.e. not having to query
 * for the same User multiple times.
 */

const userApi = new UserAPI();

/**
 * Funktion som används för att skapa en DataLoader
 * för att batcha User-requests och öka prestanda
 * markant
 * @param usernames List of usernames
 */
const batchUsersFunction = async (usernames: readonly string[]): Promise<ArrayLike<User | Error>> => {
  /**
 * Batch function used as parameter to DataLoader constructor,
 * see /src/resolvers/README.md
 * @param usernames 
 */

  const apiResponse = await userApi.getMultipleUsers(usernames);
  if (apiResponse === null) return [];
  const users = await userReducer(apiResponse);

  // Mappar skit, detta är copypasta
  const userMap = {};
  users.forEach(user => {
    // @ts-ignore: username är non-nullable i databasen
    userMap[user.username] = user;
  });

  // @ts-ignore: Detta är taget från någon annans kod och jag pallar helt enkelt inte
  return usernames.map(username => users[username]);
};

/**
 * Returnerar en DataLoader för att med hög prestanda
 * hämta User-objekt från databasen. Använd load()-metoden
 * på returnerat objekt för att ladda Users.
 * 
 * För mer info, se DataLoader-dokumentation.
 */
export const createUserDataLoader = (): DataLoader<string, User> => {
  return new DataLoader<string, User>(usernames => batchUsersFunction(usernames));
};