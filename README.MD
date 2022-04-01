# Ekorre

Ekorre är sektionens nya backend driven av Node och GraphQL och
skriven i TypeScript.

TODO: Uppdatera för docker compose, prisma och postgres

+ Hur man installerar docker compose
+ Hur man kör docker compose
+ Hur man skapar schema i databasen (`npx prisma db push`)
+ Hur man seedar databasen med prisma (`npx prisma db seed`)

## Hur startar jag?

Kort och gott:
```bash
# för linux och troligen mac
sh tools/init.sh

# för windows
cmd tools/init.bat
```

### Avanacerad start/förklaringar

Det behövs en databas och konfiguration för att starta servern.
För att generera databasen med exempeldata så skriv:

```
sqlite3 -init src/sql/init.sql <databasnamn> .exit
```

(du behöver installera [sqlite3](https://www.sqlite.org/download.html). Det är även
rekommenderat att ha en databashanterare t.ex. [dbeaver](https://dbeaver.io/). För få merga sin funktion måste `init.sql` vara uppdaterad med din SQL-kod.)

Därefter kopiera `.env.example.dev` till `.env` och ange
filnamnet på databasen vid `DB_FILE` fältet.
`.env` filen innehåller konfigurationsvariabler till servern

Du kan alternativt bara köra

```
./tools/initenv.sh
```

förutsatt att du kör något UNIX-liknande (Linux/MacOS).

Därefter behöver du installera alla npm-paket med hjälp av
```
npm install
```

och för att starta utvecklingservern så skriver du:

```
npm run dev # Kompilera kontiuerligt och öppna för debugger
```

PS: För att stänga av servern trycker du CTRL+c

## Hur utvecklar jag?

Läs [semver](#SEMVER)

TL;DR
```c
npm run generate # Generera typescript från gql
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
* [Knex.js](http://knexjs.org) (vilket egentligen är SQL)
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
npm run generate
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
2. Du skapar en eller flera `SQL`-tabeller och lägger till i `src/sql/`. Du ser till att tabellen
finns i både `init.sql` och en separat fil, för att andra enkelt ska kunna lägga till tabell(erna).
3. Du skapar ett nytt GraphQL-schema i `src/schemas`
4. Du skapar databastyper, t.ex. `DatabaseAmazingFeature` som representerar hur datan lagras i databasen
5. Du skapar en ny API i `src/api/`, som bara har i uppgift att prata med din nya SQL
6. Du inser att du inte kan få all information ur SQL och skapar en mapper-typ i `src/models/mappers.d.ts`, t.ex. `AmazingFeatureResponse`
7. Du skapar en reducer som omvandlar `DatabaseAmazingFeature` till `AmazingFeatureResponse`
8. Du skapar en resolver i `src/resolvers/`. Funktionerna där använder din API och returnerar t.ex. `AmazingFeatureResponse`
9. Du lägger till resolver-metoder för att omvandla `AmazingFeatureResponse` till `AmazingFeature`, t.ex. om `AmazingFeature` innehåller `User`-objekt. `AmazingFeatureAPI` kan inte själv lösa dessa, så resolvern använder `ctx.userDataLoader` för att omvandla
`AmazingFeatureResponse`s halvfärdiga `User`-objekt till fullvärdiga (detta görs automatiskt om resolvern har rätt fält/metoder!)
10. Du kan behöva skapa en ny `DataLoader` för att undvika *n + 1*-problemet.
11. Du skriver enhetstester i `src/test/unit/` för din nya API och reducer, och integrationstester i `test/integration` för din resolver
12. Du uppdaterar `CHANGELOG.MD` med din nya uppdatering, och ändrar samtidigt versionsnummret i `package.json`!
13. Du ber om code review i GitLab på din nya MR!

Detta kan tyckas vara många steg, men det finns gott om färdiga exempel. Dessutom finns det gott om hjälpfunktioner, och många problem man kan tänkas finns lösta nånstans! Försök att följa de konventioner som finns, i design, namngiving och förväntade
returvärden. API:n är mycket enklare att använda om man är konsekvent!

# Testning

För att dels garantera att det som utvecklas gör det vi vill, och dessutom att koden fungerar som den ska, använder `ekorre`
automatisk testning. Testerna hittas i `test/` och baseras på testningsramverket `jest`. Genom lite lek med GitLab CI
trackas code coverage (alltså hur stor del av koden som körs i tester) på GitLab. Högt coverage garanterar inte att saker
fungerar som de ska, men utan något coverage famlar man helt i blinda. Det är nästan krav att ny kod även kommer med tester.
Hur ska du annars kunna bevisa att din kod gör det du säger?

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