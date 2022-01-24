# Changelog
Alla märkbara ändringar ska dokumenteras i denna fil.

Baserat på [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
och följer [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.10.0] - 2022-01-24

## Ändrat
- Flyttat `graphql.generated.ts` från `src` -> `src/models/generated/graphql.ts`
- Path alias tillagt för:
  - `@/` - Allting inom `src`-mappen, t.ex. `@/auth`
  - `@api` - Alla apier, t.ex. `@api/file`
  - `@resolver` - Alla resolvers
  - `@db` - Alla databas-modeller
  - `@generated` - Genereade modeller i `/src/models/generated`
  - `@dataloader` - Alla dataloaders
  - `@route` - Alla REST Routes
  - `@middleware` - Middlewares (måste prefixas med antingen `/rest` eller `/graphql` för att indikera vad det är för middleware)
  - `@service` - Servicar
  - `@test` - Filer inom `/test`-mappen
- Jest använder `ts-jest` för att resolva aliasen ovan

## [0.9.0] - 2022-01-17

### Tillagt
- `removeArticle`-mutation
- Integrationstester för `article`-resolvern
- Ny test-util, `requestWithAuth`, som låter en skicka GraphQL-requests som samlar coverage. Bör troligen ersätta
`axios`.

### Ändrat
- `article`-resolver kräver inte längre användarnamn, utan använder `ctx.getUsername()`
- Anrop till `app.listen()` flyttat till `src/index.ts` för att `jest` ska fungera
- `modifyArticle` och `removeArticle` använder nu `ID!` istället för `Int!` för `articleId`-parametern
- `ArticleAPI`s get-metoder uppdatera för att följa konventioner om `NotFoundError` för enskilda icke funna artiklar och tomma listor för när man förfrågar för flera artiklar.
- `app.ts` och `serverconfig.ts` flyttad till `src/app/`

## [0.8.0] - 2022-01-13

### Tillagt
- Integrationstester, bl.a. för access

### Ändrat
- Splittar `app.ts` i `app.ts` och `serverconfig.ts` för att utnyttja Apollos `executeOperation` i nya intergrationstester
- `test/regression` numera separat, `test/integration/` ersätter viss funktionalitet

## [0.7.1] - 2022-01-07

### Tillagt
- Lagt till `wikiEdits` fält för användare
- `WikiService` skapad för kommunikation mellan E-Wiki och Ekorre.

## [0.7.0] - 2022-01-06

### Ändrat
- Uppdaterat `Knex` typ 1 miljon versioner, och uppdaterat kod därefter
- Bytt namn på `knex`-instansen till `db` för att stödja nya `KNex`-namespaces

## [0.6.2] - 2022-01-06

### Ändrat
- När man byter profilbild så tas nu gamla profilbilden bort från databasen och filsystemet.

## [0.6.1] - 2021-12-29

### Ändrat
- Flyttar om i DataLoaders genom en ny sorterings-util, `sortBatchResult`.
## [0.6.0] - 2021-12-29

### Tillagt
- `tools/migration` för migreringsverktyg från gamla DB `esek12`

### Ändrat
- `meeting` har nu även bilagor i form av `appendix` för bakåtkompabilitet
- `addMeeting` returnerar nu ID på skapade mötet, likt `createElection`

## [0.5.0] - 2021-12-14

### Ändrat
- Efter diskussion kastar saker som är på formatet `[SomeType]!` i GraphQL-schemas 404, utan returnerar nu istället tomma listor.

## [0.4.1] - 2021-12-15
### Tillagt
- SetElection mutation för att skriva över elections

## [0.4.0] - 2021-12-13

### Tillagt
- Lägger till API för HeHE

### Ändrat
- Begränsar antalet workers för `jest` för att SQLite inte ska
låsa sig i testerna

## [0.3.2] - 2021-12-09

### Ändrat
- Uppdaterat deps
- Docker image nu Node 16
- Mindre ändringar och stavfel
## [0.3.1] - 2021-12-08

### Ändrat
- Sätter constraint att resolversen `login` och `casLogin` aldrig kan ha en
rad i `AccessMapping`

## [0.3.0] - 2021-12-08

### Tillagt
 - Lägger till API för elections, se [!69](https://gitlab.com/esektionen/projekt/ekorre/-/merge_requests/69)
 - `notEmpty` util-filter
 
## [0.2.7] - 2021-12-07

### Tillagt
- Databastabell för nödkontakter
- Queries och Mutations för att hämta, lägga till och ta bort nödkontakter
- Tester för nödkontakter

## [0.2.6] - 2021-12-05

### Tillagt
- Mutation för att skicka mail med hjälp av [ebrev](https://gitlab.com/esektionen/projekt/ebrev)

## [0.2.5] - 2021-11-29

### Tillagt
- `setUserPostEnd`-mutation för att sätta när personer går av sin post
- `removeHistoryEntry`-mutation för att ta bort `HistoryEntry`s
- `midnightTimestamp`-utility för att få timestamp för 00:00:00.000 och 23:59:59.999 på ett `Date`

### Borttaget
- `removeUserFromPost`-mutation för att ta bort en användare från alla `HistoryEntries` för en post

### Ändrat
- `start` anses nu som permanent för en `HistoryEntry`. Vill man ändra får man fan ta bort entrien.

## [0.2.4]	- 2021-11-28

### Tillagt
- Lägger till `numberOfVolunteers` som beräknar antalet unika funktionärer
- Lägger till tester för ovanstående

### Ändrat
- `period` inte längre än del av `Post`
- `start` och `end` sparas nu som `TIMESTAMP` i `PostHistory`

## [0.2.3]	- 2021-11-27

### Ändrat
- Aktiverar `FOREIGN KEY` i sqlite genom knex
- Fixar tester som gick sönder av ovanstående

## [0.2.2]	- 2021-11-26

### Ändrat
- Återinför GraphQL playground, bör ersättas med GraphiQL i framtiden

## [0.2.1]	- 2021-11-26

### Tillagt
- Query för gruppering av poster

## [0.2.0] - 2021-11-25

### Tillagt
 - `Meetings`-tabell i databasen
 - API för möten, inklusive mötesfiler
 - Standardlösning för auth
    - Tabeller för access och auth
    - `graphql-middleware` för tabellbaserad auth
 - Standardiserad felhantering i API:er
 - Automatisk testning i form av `ts-jest`
 - Uppdaterad CI för testning
 - Möjlighet att köra `build`-CI på GitLab genom `-run-build`-suffix på branchnamn
 - DataLoaders för flertalet resurser

 ### Ändrat
  - Ändrat `files` till `file` i kodbasen för att följa praxis
  - Se MR [!22](https://gitlab.com/esektionen/projekt/ekorre/-/merge_requests/22) till [!79](https://gitlab.com/esektionen/projekt/ekorre/-/merge_requests/79) för mer information


## [0.1.0] - 2021-04-27

### Tillagt
 - `Files`-tabell i databasen
 - REST Endpoint för filuppladdning, default på `{baseUrl}/files/upload`
 - Hosting för statiska filer, default på `{baseUrl}/files/*`
 - API för CRUD för filer

### Ändrat
 - Apollo körs numera ovanpå express på `/`
 - Se [!13](https://gitlab.com/esektionen/projekt/ekorre/-/merge_requests/13/) för mer info

## [0.0.2] - 2021-04-27
### Tillagt
 - Initskript för att enklare kunna böjra arbeta med projektet
 - SEMVER

### Ändrat
 - Ändrat miljövariablen `port` -> `PORT` för att vara konsekvent
 - Ändrat standardport `3000` -> `5000` för att funka bättre med ekollon
 - Uppdaterat npm skript till att funka på windows

## [0.0.1] - 2021
### Tillagt
 - Hela projektet, kolla git historik för mer info...
