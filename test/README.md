# Tester

Detta är mappen för tester som kan köras automatiskt. `ekorre` använder sig av `ts-jest` (se [dokumentation](https://kulshekhar.github.io/ts-jest/docs/)), en TypeScript-version av testningsramverket `jest` (se [dokumentation](https://jestjs.io/docs/getting-started)) för tester.

Ett bra verktyg att använda när man skriver sina tester är VSCode-extentionet `Jest Runner`.

* `unit/` är tester som helt enkelt testar funktioners funktionalitet, dvs. med en given (eller slumpad) input, förvänta en given output. Dessa passar främst för t.ex. `src/api/**/*` och `src/reducers/**/*`
* `integration/` är tester som kontrollerar att helheten fungerar, t.ex. ett API-anrop. I vårt fall gör vi detta vi Apollos `executeQuery`, vilket kan göras utan att starta en server. Om man vill testa med `auth`, eller om man behöver `Context` i det man använder, fungerar `util`-funktionen `requestWithAuth` bra.
* `regression/` är regressionstester, dvs. tester som kontrollerar att man inte förstör funktionalitet som redan funkar med nya
förändringar. Kräver att man kör en dev-server (`npm run dev`).

Via `package.json:scripts` kan de olika testen köras via `npm test` (alla), `npm run test:unit`, `npm run test:integration` respektive `npm run test:regression`. `npm run test:prebuild` kör både `test:unit` och `test:integration`.

Alla test ska ha namn på formen `*.test.ts`, där `*` ska vara filnamnet alternativ beskrivninga av test(en) i filen.

## Coverage

`jest` är konfigurerat att skapa en bra översikt av coverage. Detta skrivs ut i terminalen, men genom att öppna `coverage/lcov-report/index.html` i webbläsaren
kan du få en bra grafisk översikt.

Dessa bildar också artefakter i GitLab som kan öppnas i webbläsaren, vilket är riktigt snitsigt. GitLab kan hitta `jest` coverage med följande regex (enligt GitLabs docs):

```
All files[^|]*\|[^|]*\s+([\d\.]+)
```

vilket kan läggas till i GitLabs CI/CD-settings på hemsidan.

Filer som testas av regressionstester (nära produktionsmiljö) ingår ej i coverage, vilket förklarar att vissa filer har lågt coverage, men ändå testas.

## Supertest
För HTTP testningar använder vi [supertest](https://github.com/visionmedia/supertest). Den spinnar upp en HTTP-server och möjliggör att testa de olika endpoints och metoder.

Exempelvis om du vill kolla statusen på ditt api:

```js
	import request from 'supertest';
	...
	const res = await request(app).get('/health').expect(200) // vi förväntar oss att servern returnerar en statuskod på 200

	// vi förväntar oss att api:et returnerar responsen i json
	expect(res.headers['content-type']).toMatch('application/json');

	// Sen kontrollerar vi responsens body
	expect(res.body).toEqual({
		status: 'ok'
	});
```

`requestWithAuth` använder `supertest` internt, vilket förenklar requests.

Notera dock att `DataLoader` och falska timers *inte* fungerar bra ihop, då Dataloadern bara sitter och tickar för evigt. Därför kan användning av `supertest` leda till timeouts om man använder `jest.useFakeTimers()`. Då är det bättre att lägga till det som ett regressionstest, där jest och servern inte kör i samma Node-process.