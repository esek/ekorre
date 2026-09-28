const { compilerOptions } = require('./tsconfig.json');
const { pathsToModuleNameMapper } = require('ts-jest');

const commonOptions = {
  preset: 'ts-jest/presets/default',
  moduleNameMapper: pathsToModuleNameMapper(compilerOptions.paths, { prefix: '<rootDir>' }),
}

// GitHub Actions sets CI=true, also inside job containers
const isCI = Boolean(process.env.CI || process.env.GITHUB_ACTIONS);

const serialTests = [
  'test/regression/election.test.ts',
  'test/unit/election.api.test.ts',
  'test/integration/election.nominate.test.ts',
  'test/unit/interview.api.test.ts',
  'test/integration/interview.test.ts',
  'test/unit/interview.summary.test.ts',
]

/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  testEnvironment: 'node',
  collectCoverage: false,
  // CI runners have 8 GB shared with Postgres and a parallel Docker build; a worker per
  // core used over 6 GB and got the runner OOM-killed. Locally, use the cores.
  maxWorkers: isCI ? 2 : '90%',
  // Restart a worker that holds on to more than this between test files
  workerIdleMemoryLimit: isCI ? '512MB' : undefined,
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
