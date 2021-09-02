import path from 'path';

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
  URL: process.env.EBREV ?? 'https://localhost:8081',
  API_TOKEN: process.env.EBREV_API_TOKEN ?? '',
};

/**
 * Cors options
 * @param {string} ALLOWED_ORIGINS - Commaseparated list of origins that are allowed to make requests
 */
const CORS = {
  ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS?.split(',') ?? [],
};

const config = {
  PORT: parseInt(process.env.PORT ?? '5000', 10),
  HOST: process.env.HOST ?? '0.0.0.0',
  FILES,
  EBREV,
  CORS,
};

export default config;
