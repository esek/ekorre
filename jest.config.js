const { compilerOptions } = require('./tsconfig.json');
const { pathsToModuleNameMapper } = require('ts-jest');

/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  preset: 'ts-jest/presets/default',
  testEnvironment: 'node',
  collectCoverage: false,
  maxWorkers: '90%',
  // Alla JS, JSX, TS, TSX-filer i src, men inte models, genererad kod
  // eller resolvers
  collectCoverageFrom: ['src/**/*.{js,jsx,ts,tsx}', '!src/**/*.{d}.ts', '!src/models/generated/*'], // Ignore .d and generated files
  setupFiles: ['dotenv/config'], // Så jest kommer åt .env
  moduleNameMapper: pathsToModuleNameMapper(compilerOptions.paths, { prefix: '<rootDir>' }),
};
