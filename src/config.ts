import dotenv from 'dotenv';
import path from 'path';

import { BYTES_PER_MB } from './util';

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
  MAX_AVATAR_SIZE_BYTES: Number.parseInt(process.env.MAX_AVATAR_SIZE_MB ?? '1') * BYTES_PER_MB, // Default 1 MB
  MAX_FILE_UPLOAD_SIZE_BYTES:
    Number.parseInt(process.env.MAX_FILE_UPLOAD_SIZE_MB ?? '20') * BYTES_PER_MB, // Default 20 MB
};

/**
 * Config for HeHEs
 * @param {string} COVER_FOLDER - The folder to save HeHE covers in
 */
const HEHES = {
  COVER_FOLDER: 'hehe-covers',
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

/**
 * Config for PDF to PNG conversion
 * @param {string} URL - The base URL for the PDF to PNG microservice
 */
const PDF_TO_PNG = {
  URL: process.env.PDF_TO_PNG_BASE_URL ?? '',
};

/**
 * Config for LaTeXify
 * @param {string} URL - The base URL for the LaTeXify microservice
 */
const LATEXIFY = {
  URL: process.env.LATEXIFY_URL ?? '',
};

const VERIFY = {
  URL: process.env.VERIFY_URL ?? '',
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
  HEHES,
  EBREV,
  LU,
  WIKI,
  PDF_TO_PNG,
  LATEXIFY,
  VERIFY,
  JWT,
};

export default config;
