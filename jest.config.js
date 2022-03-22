const { compilerOptions } = require('./tsconfig.json');
const { pathsToModuleNameMapper } = require('ts-jest');

/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  preset: 'ts-jest/presets/default',
  testEnvironment: 'node',
  collectCoverage: true,
  // SQLite ogillar skarpt när man kör för mycket parallellt,
  // så istället för antal kärnor - 1 kör 50% av max (dis make dest dlow).
  maxWorkers: '50%',
  // Alla JS, JSX, TS, TSX-filer i src, men inte models, genererad kod
  // eller resolvers
  collectCoverageFrom: ['src/**/*.{js,jsx,ts,tsx}', '!src/**/*.d.ts', '!src/models/generated/*'], // Ignore .d and generated files
  setupFiles: ['dotenv/config'], // Så jest kommer åt .env
  moduleNameMapper: pathsToModuleNameMapper(compilerOptions.paths, { prefix: '<rootDir>' }),
};
