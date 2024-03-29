export type TokenType = 'accessToken' | 'refreshToken';

type SecretStoreItem = { value: string; time: number; readonly refreshDays: number };

export type SecretStore = Record<TokenType, SecretStoreItem>;

export type TokenBlacklistItem = {
  token: string;
  time: number;
};

export type TokenValue = {
  username: string;
};

export type VerifiedRefreshToken = {
  username: string;
};
