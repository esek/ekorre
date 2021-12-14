/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  preset: 'ts-jest/presets/default',
  testEnvironment: 'node',
  collectCoverage: true,
  // SQLite ogillar skarpt när man kör för mycket parallellt,
  // så istället för antal kärnor - 1 kör vi 75% av det
  maxWorkers: '75%',
  // Alla JS, JSX, TS, TSX-filer i src, men inte models, genererad kod
  // eller resolvers (anrop till API:n via HTTP ger inte coverage)
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.{d,generated}.ts',
    '!src/resolvers/*.{js,jsx,ts,tsx}',
  ],
  setupFiles: ["dotenv/config"], // Så jest kommer åt .env
};