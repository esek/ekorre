# Routes

En samling av HTTP Rest endpoints för att hantera olika typer av requests. Dessa är generellt för klyddiga att lösa i
GraphQL.

## Files
Denna filen innehåller alla endpoints för filhantering i REST:
  - `/upload` som hanterar uppladdningen av filer
  - `/*` som hanterar alla andra requests för att visa filer för användaren

Både `/upload` och `/*` prefixas av en endpoint som kan sättas av en miljövariabeln `FILES_ENDPOINT`. Om ingen sådan är satt, prefixas dessa endpoints av `/files`.

### Uppladdning
För att ladda upp en fil gör man ett [`POST`](https://en.wikipedia.org/wiki/POST_(HTTP)) anrop mot endpointen `/upload`.

Denna endpointen tar emot en [`multipart/form-data`](https://developer.mozilla.org/en-US/docs/Web/API/FormData) formaterad body.

Filen skickas med under namnet `file` (observera att endast en fil går att ladda upp åt gången).
För att bestämma vart filen ska ligga, använder man attributet `path`, t.ex. `/abc/123`, då lägger sig filen i `/abc/123/{filnamn}`. Om ingen path skickas med så läggs filen i root ( / ).

En fil kan ha en av tre accessTypes:
  - Public: Alla kan läsa denna filen, oavsett om de är in- eller utloggade
  - Authenticated: Endast inloggade medlemmar har möjlighet att se denna filen
  - Admin: Endast Admins kan se denna filen

För att bestämma accessType skickas typen med som en string under `accessType` i FormDatan. Observera att om ingen accessType skickas så kommer filen automatiskt vara publik.

I JavaScript/TypeScript kan man skapa ett `FormData`-objekt genom:

```javascript
const fd = new FormData();

fd.append('file', file); // där file är filen du vill ladda upp
fd.append('path', '/abc/123');
fd.append('accessType', AccessType.Public);

/* Request mot ekorre... */
```

### Läsning av filer
Alla requests som görs mot `/*` kommer ses som ett anrop för att läsa en fil.
Då fångas anropet av ett [`middleware`](https://expressjs.com/en/guide/using-middleware.html) som letar upp filen i databasen och jämför filens accessType med användarens rättigheter.

För att verifiera dig mot en fil kan antingen en `Authorization`-header användas, eller så kan man skicka en JWT token som en `token` query-parameter.
T.ex: 

```
.../esek.png?token=abc123
```
