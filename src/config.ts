import dotenv from 'dotenv';
import path from 'path';

// Read dot-env file
dotenv.config();

/**
 * Config for file-handling
 * @param {string} ENDPOINT - The endpoint in Ekorre to expose with files (ex. https://api.esek.se/{endpoint})
 * @param {string} ROOT - The root folder to save files in
 */

const FILES = {
  ENDPOINT: process.env.FILES_ENDPOINT ?? '/files',
  ROOT: process.env.FILE_ROOT ?? `${path.dirname(__dirname)}/public`,
};

/**
 * Config for Ebrev - our emailing service
 * @param {string} URL - The base URL for Ebrevs API
 * @param {string} API_TOKEN - The API token set as an env-variable in Ebrev
 */
const EBREV = {
  URL: process.env.EBREV_URL ?? 'https://localhost:8081',
  API_TOKEN: process.env.EBREV_API_TOKEN ?? '',
};

/**
 * Cors options
 * @param {string} ALLOWED_ORIGINS - Commaseparated list of origins that are allowed to make requests
 */
const CORS = {
  ALLOWED_ORIGINS: [
    'https://localhost',
    'http://localhost:3000',
    ...(process.env.ALLOWED_ORIGINS?.split(',') ?? []),
  ],
};

/** LU Options
 * @param {string} CAS - The base URL for LU CAS
 */
const LU = {
  CAS: (process.env.LU_CAS as string) ?? 'https://idpv4.lu.se',
};

/** Cookie auth
 * @param {string} domain - The base domain for your app
 */
const COOKIE = {
  DOMAIN: (process.env.COOKIE_DOMAIN as string) ?? '',
};

const WIKI = {
  URL: process.env.WIKI_BASE_URL ?? '',
  USERNAME: process.env.WIKI_USERNAME ?? '',
  PASSWORD: process.env.WIKI_PASSWORD ?? '',
};

const config = {
  PORT: parseInt(process.env.PORT ?? '5000', 10),
  HOST: process.env.HOST ?? '0.0.0.0',
  DEV: process.env.NODE_ENV !== 'production',
  SKIP_ACCESS_CHECKS: process.env.SKIP_ACCESS_CHECKS?.toLowerCase() === 'true',
  FILES,
  EBREV,
  CORS,
  LU,
  COOKIE,
  WIKI,
};

export default config;
