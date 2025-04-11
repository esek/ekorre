# Ekorre 

![Mascot logo](./.github/logo.png)

Ekorre är sektionens nya backend driven av Node och GraphQL och
skriven i TypeScript.

Förhoppningsvis har någon hållit denna README:n uppdaterad...

## Hur startar jag?

Börja med att installera alla node modules med
¨
```bash
npm install
```

Kopiera `.env.example` till `.env` och fyll i miljövariablerna.
`.env`-filen innehåller konfigurationsvariabler till servern

`ekorre` använder `docker compose` för att få upp en fungerande en databas, dvs.

```bash
docker compose up
```

(förutsatt att du installerat docker).

För att generera en `PrismaClient` (som används för att kommunicera med databasen) och
fylla databasen med rätt schemas används

```bash
npm run prisma:reset
```

vilket även brukar lösa dryga problem. Detta seedar även databasen med lite testdata.
Sedan körs projektet med

```bash
npm run dev
```

## Hur utvecklar jag?

Läs [semver](#SEMVER)

TL;DR
```c
npm run generate # Generera typescript från gql och en Prisma client
npm run dev # Kompilera kontiuerligt och öppna för debugger
npm run prettier-format # Formatera kod, finns IDE intergration oftast
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
├── reducers
│   └── <modul>.reducer.ts
└── schema
    └── <modul>.graphql
```

där `schemas` och `resolvers` är viktigast. För
att hålla en konsekvent och stabil struktur bör
alla databasfrågor skötas från en klass i `api`
och `sql` är dedikerad till att skapa de tabeller
som behövs för din funktion. Det finns mer djupgående
README:s i undermapparna.

Förutom dessa finns även `prisma/`, som är vår `ORM` (isch). Detta
är delen som sköter databasstruktur och våra queries till databasen
(Postgres).

### Verktyg

Det är rekomenderat att du bekantar dig lite med de verktyg som används:

* [Typescript](https://www.typescriptlang.org/)
* [GraphQL](https://graphql.org/)
* [Prisma](http://prisma.io) (vilket egentligen är SQL)
* [graphql-codegen](https://graphql-code-generator.com/)
* [apollo-server](https://www.apollographql.com/docs/apollo-server/)*
* [graphql-tools](https://www.graphql-tools.com/docs/introduction/)*
* [jwt](https://jwt.io/)*

\**kursivt*

#### graphql-codegen

För att underlätta utveckling så används [graphql-codegen](https://graphql-code-generator.com/docs/plugins/typescript).
Detta gör att en typescript fil vid namn 'graphql.ts' i mappen `src/models/generated`
generas som innehåller typdefintioner för graphql frågor.
Använd denna!

För att generera:

```
npm run graphql:generate
```

Det kan hända att VScode eller annan IDE gnäller på dina typer även om du genererat nya. Då bör du i VScode köra `Ctrl+Shift+P` följt av `Reload Window`.

#### Kodstil

Eslint och prettier är konfigurerat och det
rekomenderas att du följer de regler som är
givna.

```c
npm run lint // Testa kodfel, brukar göras av IDE
npm run prettier-format // Formatera all kod
```

Det händer att `prettier` och `eslint` bråkar, främst vid långa typdeklarationer som i
`src/models/mappers.d.ts`. Då är det praktiskt att prega in en

```ts
// prettier-ignore
```

ovanför typen.

### SEMVER

Versionshantering följer [semantic versioning](https://semver.org/spec/v2.0.0.html) specificationen. Detta är viktigt eftersom releases ska taggas med semver för att kunna automatiskt deployas.

### CHANGELOG

Parallellt med `SEMVER` (som ska uppdateras i `package.json`) skrivs även förändringar ner i `CHANGELOG.MD`. Detta för att
hålla reda på vad som förändrats, och för att ha en lättläst historik över projektet (vilket är kul!). `git`-historik är
*inte* en ersättning till en bra CHANGELOG! Kolla in [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) för mer info.

### Typiskt arbetsflöde

När du utvecklar en modul ser det troligen ut på följande sätt.

1. Du har en idé om vad man ska kunna göra och ungefär hur det ska fungera
2. Du skapar en ny typ i `prisma/schema.prisma` och lägger till testdata i `prisma/data/`. Prisma sköter själv att skapa databasen när man kör `npm run prisma:push`, så du behöver inte skapa SQL-schemas själv!
3. Du skapar ett nytt GraphQL-schema i `src/schemas`
4. Du skapar en ny API i `src/api/`, som bara har i uppgift att prata med din nya SQL
5. Du inser att du inte kan få all information ur SQL och skapar en mapper-typ i `src/models/mappers.d.ts`, t.ex. `AmazingFeatureResponse`
6. Du skapar en reducer som omvandlar `DatabaseAmazingFeature` till `AmazingFeatureResponse`
7. Du skapar en resolver i `src/resolvers/`. Funktionerna där använder din API och returnerar t.ex. `AmazingFeatureResponse`
8. Du lägger till resolver-metoder för att omvandla `AmazingFeatureResponse` till `AmazingFeature`, t.ex. om `AmazingFeature` innehåller `User`-objekt. `AmazingFeatureAPI` kan inte själv lösa dessa, så resolvern använder `ctx.userDataLoader` för att omvandla
`AmazingFeatureResponse`s halvfärdiga `User`-objekt till fullvärdiga (detta görs automatiskt om resolvern har rätt fält/metoder!)
9. Du kan behöva skapa en ny `DataLoader` för att undvika *n + 1*-problemet.
10. Du skriver enhetstester i `src/test/unit/` för din nya API och reducer, och integrationstester i `test/integration` för din resolver
11. Du uppdaterar `CHANGELOG.MD` med din nya uppdatering, och ändrar samtidigt versionsnummret i `package.json`!
12. Du ber om code review i GitHub på din nya PR!

Glöm inte att köra `npm run generate` när du pillat med GraphQL eller Prisma!

Detta kan tyckas vara många steg, men det finns gott om färdiga exempel. Dessutom finns det gott om hjälpfunktioner, och många problem man kan tänkas finns lösta nånstans! Försök att följa de konventioner som finns, i design, namngiving och förväntade
returvärden. API:n är mycket enklare att använda om man är konsekvent!

# Testning

För att dels garantera att det som utvecklas gör det vi vill, och dessutom att koden fungerar som den ska, använder `ekorre`
automatisk testning. Testerna hittas i `test/` och baseras på testningsramverket `jest`. Genom lite lek med GitLab CI
trackas code coverage (alltså hur stor del av koden som körs i tester) på GitLab. Högt coverage garanterar inte att saker
fungerar som de ska, men utan något coverage famlar man helt i blinda. Det är nästan krav att ny kod även kommer med tester.
Hur ska du annars kunna bevisa att din kod gör det du säger?

# Docker

Det finns en pipeline som kommer bygga docker bilder med hjälp av Dockerfile.
Dessa publiceras sedan till en *registry* som tillhör detta projekt. Dessa bilder är i huvudsak
designade för servern (som i skrivande stund är extrovert).

Referera till [ddgwiki](https://ddgwiki.esek.se/index.php?title=CI/CD) för mer information. 

Ha kul!
