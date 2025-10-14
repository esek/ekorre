const { compilerOptions } = require('./tsconfig.json');
const { pathsToModuleNameMapper } = require('ts-jest');

const commonOptions = {
  preset: 'ts-jest/presets/default',
  moduleNameMapper: pathsToModuleNameMapper(compilerOptions.paths, { prefix: '<rootDir>' }),
}

const serialTests = ['test/regression/election.test.ts', 'test/unit/election.api.test.ts', 'test/integration/article.test.ts']

/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  testEnvironment: 'node',
  collectCoverage: false,
  maxWorkers: '90%',
  // Alla JS, JSX, TS, TSX-filer i src, men inte models, genererad kod
  // eller resolvers
  collectCoverageFrom: ['src/**/*.{js,jsx,ts,tsx}', '!src/**/*.{d}.ts', '!src/models/generated/*'], // Ignore .d and generated files
  setupFiles: ['dotenv/config'], // Så jest kommer åt .env
  projects: [
    {
      ...commonOptions,
      displayName: "serial-tests",
      runner: "jest-serial-runner",
      testRegex: serialTests,
    },
    {
      ...commonOptions,
      displayName: "parallel-tests",
      testMatch: ['**/*.test.ts'],
      testPathIgnorePatterns: serialTests,
    },
  ]
};
