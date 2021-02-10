import type { User } from './graphql.generated';
import DataLoader = require("../node_modules/dataloader");  // To cache, solves n+1 problem (see https://youtu.be/uCbFMZYQbxE)

export type Context = {
  token: string;
  getUser(): User;
  userLoader: DataLoader<string, User>;
};
