# Ekorre

Ekorre är sektionens nya backend driven av Node och GraphQL och
skriven i TypeScript.

## Hur startar jag?

Kort och gott:
```bash
# för linux och troligen mac
sh init.sh

# för windows
cmd init.bat
```

### Avanacerad start/förklaringar

Det behövs en databas och konfiguration för att starta servern.
För att generera databasen med exempeldata så skriv:

```
sqlite3 -init src/sql/init.sql <databasnamn> .exit
```

(du behöver installera [sqlite3](https://www.sqlite.org/download.html). Det är även
rekommenderat att ha en databashanterare t.ex. [dbeaver](https://dbeaver.io/). För få merga sin funktion måste `init.sql` vara uppdaterad med din sql kod.)

Därefter kopiera `.env.example.dev` till `.env` och ange
filnamnet på databasen vid `DB_FILE` fältet.
`.env` filen innehåller konfigurationsvariabler till servern.

Därefter behöver du installera alla npm-paket med hjälp av
```
npm install
```

och för att starta utvecklingservern så skriver du:
```c
npm run dev // Kompilera kontiuerligt och öppna för debugger
```
PS: För att stänga av servern trycker du CTRL+c

## Hur utvecklar jag?

Läs [semver](#SEMVER)

TL;DR
```c
npm run generate // Generera typescript från gql
npm run dev // Kompilera kontiuerligt och öppna för debugger
npm run prettier-format // Formatera kod, finns IDE intergration oftast
```

### Struktur

För att separera kod och underlätta utveckling så
finns det en struktur. För den som ska utöka
funktionaliteten i programmet finns det fyra mappar
som är viktiga:

```
src
├── api
│   └── <modul>.api.ts
├── resolvers
│   ├── index.ts
│   └── <modul>.resolver.ts
├── schemas
│   └── <modul>.graphql
└── sql
    └── <modul>.sql
```

där `schemas` och `resolvers` är viktigast. För
att hålla en konsekvent och stabil struktur bör
alla databasfrågor skötas från en klass i `api`
och `sql` är dedikerad till att skapa de tabeller
som behövs för din funktion. Det finns mer djupgående
README:s i undermapparna.

### Verktyg

Det är rekomenderat att du bekantar dig lite med de verktyg som används:

* [Typescript](https://www.typescriptlang.org/)
* [GraphQL](https://graphql.org/)
* [Knex.js](http://knexjs.org)
* [graphql-codegen](https://graphql-code-generator.com/)
* [apollo-server](https://www.apollographql.com/docs/apollo-server/)*
* [graphql-tools](https://www.graphql-tools.com/docs/introduction/)*
* [jwt](https://jwt.io/)*

\**kursivt*

#### graphql-codegen

För att underlätta utveckling så används [graphql-codegen](https://graphql-code-generator.com/docs/plugins/typescript).
Detta gör att en typescript fil vid namn 'graphql.generated.ts'
generas som innehåller typdefintioner för graphql frågor.
Använd denna!

För att generera:
```
npm run generate
```
#### Kodstil

Eslint och prettier är konfigurerat och det
rekomenderas att du följer de regler som är
givna.

```c
npm run lint // Testa kodfel, brukar göras av IDE
npm run prettier-format // Formatera all kod
```

### SEMVER

Versionshantering följer [semantic versioning](https://semver.org/spec/v2.0.0.html) specificationen. Detta är viktigt eftersom releases
ska taggas med semver för att kunna automatiskt deployas.
# Docker

Det finns en gitlab-ci pipeline som kommer bygga docker bilder med hjälp av Dockerfile.
Dessa publiceras sedan till en *registry* som tillhör detta projekt. Dessa bilder är i huvudsak
designade för servern (som i skrivande stund är extrovert).

För att starta en docker container med ekorre så används kommandot:

```bash
docker run -p 5000:5000 --env-file .env registry.gitlab.com/esektionen/projekt/ekorre:latest
```
där taggen `latest` också kan vara `release-X.X.X`.


Referera till [ddgwiki](https://ddgwiki.esek.se/index.php?title=CI/CD) för mer information.