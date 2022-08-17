import dotenv from 'dotenv';
import path from 'path';

// Read dot-env file
dotenv.config();

/**
 * Config for file-handling
 * @param {string} ENDPOINT - The endpoint in Ekorre to expose with files (ex. https://api.esek.se/{endpoint})
 * @param {string} ROOT - The root folder to save files in
 * @param {number} MAX_AVATAR_SIZE_BYTES - Maximum size for users profile pictures (avatars) in bytes
 * @param {number} MAX_FILE_UPLOAD_SIZE_BYTES - Maximum size for all uploaded files in bytes
 */
const FILES = {
  ENDPOINT: process.env.FILES_ENDPOINT ?? '/files',
  ROOT: `${path.dirname(__dirname)}/public`,
  MAX_AVATAR_SIZE_BYTES: Number.parseInt(process.env.MAX_AVATAR_SIZE_KB ?? '1000') * 1000, // Default 1 MB
  MAX_FILE_UPLOAD_SIZE_BYTES:
    Number.parseInt(process.env.MAX_FILE_UPLOAD_SIZE_MB ?? '20') * 1000000, // Default 20 MB
};

/**
 * Config for Ebrev - our emailing service
 * @param {string} URL - The base URL for Ebrevs API
 * @param {string} API_TOKEN - The API token set as an env-variable in Ebrev
 */
const EBREV = {
  URL: process.env.EBREV ?? 'https://localhost:8081',
  API_TOKEN: process.env.EBREV_API_TOKEN ?? '',
};

/** LU Options
 * @param {string} CAS - The base URL for LU CAS
 */
const LU = {
  CAS: (process.env.LU_CAS as string) ?? 'https://idpv4.lu.se',
};

const WIKI = {
  URL: process.env.WIKI_BASE_URL ?? '',
  USERNAME: process.env.WIKI_USERNAME ?? '',
  PASSWORD: process.env.WIKI_PASSWORD ?? '',
};

const JWT = {
  SECRET: (process.env.JWT_SECRET as string) ?? '',
};

const config = {
  PORT: parseInt(process.env.PORT ?? '3000', 10),
  HOST: process.env.HOST ?? '0.0.0.0',
  DEV: process.env.NODE_ENV !== 'production',
  X_API_KEY_HEADER: 'X-E-Api-Key',
  SKIP_ACCESS_CHECKS: process.env.SKIP_ACCESS_CHECKS?.toLowerCase() === 'true',
  POST_ACCESS_COOLDOWN_DAYS: Number.parseInt(process.env.POST_ACCESS_COOLDOWN_DAYS ?? '0'),
  FILES,
  EBREV,
  LU,
  WIKI,
  JWT,
};

export default config;
