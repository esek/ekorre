# Changelog
Alla märkbara ändringar ska dokumenteras i denna fil.

Baserat på [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
och följer [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.3.0] - 2023-04-05

### Tillagt
- Lagt till en `users` query i `User`-resolver för att kunna hämta användare från en lista av användarnamn

## [1.2.4] - 2023-02-06

### Tillagt
- `UserApi.updateUser` kan nu ta bort `luCard` ifall man skickar med en empty string
- Tester för ovan.

## [1.2.3] - 2022-12-16

### Ändrat
- `getHistoryEntries` returnerar inte längre poster innan folk gått på dem då `onlyCurrent` eller `withinAccessCooldown` är `true`
- Lagt till unit-tester för ovanstående


## [1.2.2] - 2022-11-03

### Ändrat
- `getLatestElections` fungerar som tänkt
- `interactiveTransactions` borttagen som `previewFeature` i `schema.prisma`

## [1.2.1] - 2022-10-03

### Tillagt
- `PengU` utskottet tillagt i [`utskott.graphql`](./src/schemas/utskott.graphql)

## [1.2.0] - 2022-09-18
### Tillagt
- Lagt till `User.luCard` med regler enligt [egen research](https://github.com/esek/ekorre/pull/240#issuecomment-1250354632)
- Nytt fält `PrismaUser.luCard` i databas som tillåter null och därför bakåtkompatibel
- `userByCard` query

## [1.1.3] - 2022-08-30
- Fixat krash i `/files/upload`

## [1.1.2] - 2022-08-24
- Fixat så att vi inte bloatar med scalars som inte används.

## [1.1.1] - 2022-08-24
- Fixat `Date` resolvers

## [1.1.0] - 2022-08-20

### Tillagt
- Lagt till `Post.sortPriority` så att man kan ändra i vilken ordning poster kommer

## [1.0.6] - 2022-08-19

### Ändrat
- `getNumberOfVolunteers` räknar inte längre samma användare flera gånger

## [1.0.5] - 2022-08-19

### Tillagt
- Valbar parameter `noAlumni` för `numberOfMembers` för att bara få de som börjat de senaste fem åren

## [1.0.4] - 2022-08-18

### Ändrat
- `getMultipleMeetings` sorterar nu först på nummer och sen på år

## [1.0.3] - 2022-08-17

### Ändrat
- Lagt till maxstorlek på användares avatarer
- Lagt till allmän maxstorlek på filer

## [1.0.2] - 2022-08-16

### Ändrat
- Profilbilder är nu public

## [1.0.1] - 2022-08-16

### Ändrat
- Man behöver inte vara email adming för att skicka epost till esek adresser

## [1.0.0] - 2022-08-16

### Tillagt
- `AGPL-3.0-only` licens.

## [0.27.1] - 2022-08-16

### Tillagt
- Skickar email till användaren när man blir nomierad och när man registrerar sig

## [0.27.0] - 2022-08-12

### Ändrat
- Publika fält i user-resolvern matchar nu exakt privacy policy

## [0.26.0] - 2022-08-11

### Tillagt
- Lägger till miljövariabel `POST_ACCESS_COOLDOWN_DAYS` för att indikera hur många dagar efter att en användare gått av sin post som de ska behålla sin access

### Ändrat
- `PostAPI.getHistoryEntries` har nu parametern `withinAccessCooldown` som returnerar history entries vars access inte gått ut enligt cooldown
- `AccessAPI.getUserFullAccess` använder nu post access cooldown

## [0.25.4] - 2022-08-08

### Ändrat
- Fixar sortering av breadcrumbs

## [0.25.3] - 2022-08-08

### Ändrat
- Bättre felmeddelande för DataLoaders

## [0.25.2] - 2022-08-5

### Ändrat
- `includeInactive` på `posts` filterar inte ordentligt.

## [0.25.1] - 2022-08-5

### Tillagt
- Lägger till docstrings i `apikey.api.ts`

### Ändrat
- Ändrar docstrings i `article.api.ts` till engelska
- Ändrar docstrings i `election.api.ts` till engelska
- Gjort `ElectionAPI.nominate` till en transaktion, och optimert densamma
- Ändrar docstrings i `emergencycontact.api.ts` till engelska
- Ändrar några docstrings i `file.api.ts` till engelska
- Ändrar docstrings i `hehe.api.ts` till engelska
- Ändrar docstrings i `meeting.api.ts` till engelska
- Ändrar docstrings i `post.api.ts` till engelska
- `PostAPI.deletePost` använder nu en transaktion
- `PostAPI.getHistoryEntries` now uses username and postname instead of prisma where input
- Ändrar docstrings i `user.api.ts` till engelska
- `UserAPI.requestPasswordReset` använder nu en transaktion, och gör saker i en rimlig ordning
- `UserAPI.forgetUser` använder nu en transaktion
- Other misc comment edits

## [0.25.0] - 2022-08-05

### Ändrat
- Ändrat hur `special:` taggar hanteras
- Lagt till `includeSpecial: Boolean` parameter till `Article.tags`

## [0.24.1] - 2022-08-05

### Ändrat
- `AccessApi` tar nu bort access och sätter den i en transaktion (via prisma)
- Gör alla kommentarer `access.api.ts` helt på engelska

## [0.24.0] - 2022-08-03

### Tillagt
- `forgetUser` finns nu så vi kan anonymisera användare

## [0.23.1] - 2022-08-03

### Fixat
- `meetings` funkade ifall man försöker filtrera
- Nu kan man inte lägga till ickepublika filer till ett möte

## [0.23.0] - 2022-08-03

### Ändrat
- `Post`-resolvern kräver inte auth längre, användare skyddas i `User`-resolver
- CORS i dev accepterar allt nu

## [0.22.0] - 2022-08-03

### Tillagt
- Poster har nu det nullbara fältet `email`

## [0.21.0] - 2022-07-28

### Tilllagt
- `changePassword` mutation.

## [0.20.0] - 2022-07-28
### Ändrat
- Ändrat `User.userPostHistory` till `User.postHistory`
- Lagt till `current` som valbar parameter till `User.postHistory`

## [0.19.3] - 2022-07-27

### Ändrat
- Fixar att `Post.history` resolver returns history entry ID instead of `refPost` id
- Gömmer klass om förnamn innehåller phøs

## [0.19.2] - 2022-07-27

## Ändrat
- Lagt till cors igen fast endast för development.

## [0.19.1] - 2022-07-27

### Ändrat
- `username` och `email` är nu alltid lowercase, och all input i API omvandlas till lowercase

## [0.19.0] - 2022-07-27

### Ändrat
- `requestPasswordReset` tar numera en `resetLink` och en `returnTo` parameter som skickas vidare till användaren i mailet.

### Borttaget
- `currentHolder`, `current` i posthistorik-query används istället

## [0.18.0] - 2022-07-26

### Tillagt
- `User.fullName`

### Ändrat
- Nu har alla api en specifik ordning som de returneras i
- `File.api.ts` är så async den kan vara
- `@types/node` är v16 vilket innebär att node måste minst vara 16
- Många objekt som kunde vara null får inte vara det längre
- `Post.Mutation.addUsersToPost` returnerar en `Post!` istället för `Boolean!`
- `Election.acceptedNominations` är alltid en lista
- Default värden för docker compose till postgres databas

### Borttaget
- CORS

## [0.17.1] - 2022-07-24

### Tillagt
- DataLoader för `currentHolder`

## [0.17.0] - 2022-07-24

### Tillagt
- Lägger till `currentHolders` i `Post`

## [1.16.1] - 2022-07-23

### Ändrat
- Ser till att användare måste vara inloggade för att få tillgång till en `User`s `email` och `phone`

## [0.16.0] - 2022-07-21

### Tillagt
- Länkning för användare till inloggningsproviders 

## [0.15.2] - 2022-07-20

### Ändrat
- Uppdaterat `UserAPI.searchUser` att inte vara case sensitive och söka bättre allmännt
- Uppdaterat `FileAPI.searchFile` att inte vara case sensitive också _for good measure_

## [0.15.1] - 2022-07-20

### Ändrat
- Uppdaterat/lagt till auth-check på flera platser(!) i resolvers

## [0.15.0] - 2022-07-21

### Ändrat
- Default port är nu `3000` istället för `3001`

## [0.14.4] - 2022-07-19

### Ändrat
- Fixat lint

## [0.14.3] - 2022-07-18

### Ändrat
- Fixat med ci och rensat dependecies

### Borttaget
- Files root och prod env fil

## [0.14.2] - 2022-07-16

### Tillagt
- Lägger till `type` i `articles`-query

### Ändrat
- Fixar att tomma queries inte crashar `articles`-queries

## [0.14.1] - 2022-07-14

### Borttaget
- Flyttade `tools/migration` till `esek/infra-migration`-repot

## [0.14.0] - 2022-07-13

### Tillagt
- `prisma` är nytt sätt att hantera databasen
- Tillhörande schemas till `prisma`
- `postgresql` är ny hard dependency, även för dev
- Flertalet index i `schema.prisma` (dvs. databasen) för nycklar som ofta förekommer i queries men sällan i mutations.
- Numera används docker compose (via `docker-compose.yml`) för att hantera databas i utveckling/testning och CI
- Nya utilities för testning, specifikt att generera användare/slumpmässiga användare i `test/utils/`

### Borttaget
- `knex` är inte längre dependency
- SQL-filer (`src/sql/`) är borttagna; Allt sköts via `Prisma`

### Ändrat
- I flertalet graphql-schemas är olika ID:n bytade från `ID!` till `Int!`. Detta då `ID!` blir till typen `string` i TypeScript, men vi använder det som `AUTO_INCREMENT` i databasen och `number` i TS
- Enums i GraphQL-schemas har nu konsekvent `UPPER_CASE`
- `npm run generate` genererar nu både typer från GraphQL-schema och `PrismaClient` från prisma-schema. `npm run graphql:generate` ersätter gamla `npm run generate`
- I `election` har `NO_ANSWER` ändrats till `NOT_ANSWERED` för tydlighet, och `Nomination` har nu `answer` istället för `accepted`
- Poster har nu ID och inte slugs, för att tillåta namn att ändras ordentligt. `addPost` returnerar numera en integer med det nya post-ID:t
- `npm run generate` genererar nu både GQL och Prisma
- `addEmergencyContact` returnerar nu ID vid lyckad skapad kontakt, vilket matchar beteende för andra API:er
- Flertalet GraphQL-mutations returnerar nu de skapade objekten, t.ex. `addPost` och `createElection`

## [0.13.0] - 2022-03-25

### Tillagt
- API Nyckel tabell för att kunna använda API-nycklar i andra applikationer.


## [0.12.0] - 2022-03-23

### Ändrat
- Access API har blivit betydligt mycket enklare genom att det finns fördefinerade
roller i en enum döpt till `Feature`. Dörrar finns även i en enum vid namn `Door`.
- EmergencyContacts ligger på user objektet

### Borttaget
- Allt som har med Access mappings att göra.
- Doors api endpoint, detta ska lösas i en microservice.
- emergencyContacts queryn
## [0.11.0] - 2022-02-16

### Tillagt
- Api för att få hur många medlemmar på som går på sektionen

## [0.10.3] - 2022-02-01

### Tillagt
- Nytt sätt att benchmarka ekorre via `npm run benchmark`

## [0.10.2] - 2022-02-01

### Ändrat
- `groupedPosts` prime:ar numera `ctx.postDataLoader`, vilket ser ut att öka prestanda
- Ändrat till bätte API-anrop för att få full access till en user

## [0.10.1] - 2022-01-30

### Tillagt
  - `latestElections` querien kan numera filtrera bort oöppnade val och val som har gömda nomineringar.

## [0.10.0] - 2022-01-24

### Ändrat
- Flyttat `graphql.generated.ts` från `src` -> `src/models/generated/graphql.ts`
- `/src/errors/RequestErrors.ts` -> `src/errors/request.errors.ts` för enhetlighet
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
