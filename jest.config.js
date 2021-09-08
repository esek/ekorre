/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  preset: 'ts-jest/presets/default',
  testEnvironment: 'node',
  collectCoverage: true,
  // Alla JS, JSX, TS, TSX-filer i src, men inte models
  // eller resolvers (anrop till API:n via HTTP ger inte coverage)
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/resolvers/*.{js,jsx,ts,tsx}',
  ],
  setupFiles: ["dotenv/config"], // Så jest kommer åt .env
};