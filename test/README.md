# Tester

Detta är mappen för tester som kan köras automatiskt. `ekorre` använder sig av `ts-jest` (se [dokumentation](https://kulshekhar.github.io/ts-jest/docs/)), en TypeScript-version av testningsramverket `jest` (se [dokumentation](https://jestjs.io/docs/getting-started)) för tester.

* `unit/` är tester som helt enkelt testar funktioners funktionalitet, dvs. med en given (eller slumpad) input, förvänta en given output.
* `regression/` är regressionstester, dvs. tester som går några abstraktionslager uppåt. Dessa tester testar en given funktionalitet, t.ex. skickar en request till en API
och förväntar sig ett svar. Ett regressionstest garanterar inte att de underliggande funktionerna fungerar, utan antar att de gör det om regressionstestet fungerar.
* `integration/` är tester som kontrollerar att helheten fungerar. Kräver att man bygger upp en miljö som är så nära produktionsmiljö som möjligt.

Via `package.json:scripts` kan de olika testen köras via `npm run test` (alla), `npm run unittest`, `npm run regressiontest` respektive `npm run integrationtest`.

Alla test ska ha namn på formen `*.test.ts`, där `*` ska vara filnamnet alternativ beskrivninga av test(en) i filen.