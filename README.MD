# Ekorre

Ekorre är sektionens nya backend driven av node och graphql.

## Hur startar jag?

Kort och gott:
```
npm install
npm run start
```

### Fortsättning på det korta och goda...

Det behövs en databas och konfiguration. Det enklaste är att kopiera
`.env.example.dev` till `.env` och ange filnamnet på databasen.
För att skapa en sqlite databas använd kommandot

```
sqlite3 -init <din sql fil> <databasnamn> .exit
```

Mer avancerat
```c
npm run dev // Kompilera kontiuerligt
npm run swc // Snabb kompilering med swc
npm run swcdev // Snabb kontinuerlig kompilering
```

## Hur utvecklar jag?

TL;DR
```c
npm run generate // Generera typescript från gql
npm run swcdev // Kontiuerlig kompilering
alt
npm run dev
npm run prettier-format // Formatera kod, finns IDE intergration oftast
```

### Struktur

För att separera kod och underlätta utveckling så
finns det en struktur. För den som ska uttöka
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
som behövs för din funktion.

### Verktyg

Det är rekomenderat att du bekantar dig lite med de verktyg som används:

* [Typescript](https://www.typescriptlang.org/)
* [GraphQL](https://graphql.org/)
* [Knex.js](http://knexjs.org)
* [graphql-codegen](https://graphql-code-generator.com/)
* [apollo-server](https://www.apollographql.com/docs/apollo-server/)*
* [graphql-tools](https://www.graphql-tools.com/docs/introduction/)*
* [swc-project](https://swc.rs/)*
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