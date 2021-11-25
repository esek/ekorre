# GraphQL Auth Middleware

Paketet `graphql-middleware` möjliggör en middlewarefunktion som körs på **alla** queries och mutations som görs mot Ekorres GraphQL API.

## Auth
Funktionen [`checkAuthMiddleware`](auth.middleware.ts) hämtar namnet på resolvern som anropas, samt vilken typ av resolver det är. Det kan vara:

- QUERY
- MUTATION

Därefter letar den i mappningstabellen `AccessMappings` efter vilka resurser (`AccessResource`) som krävs för att läsa/skriva till resolvern. En mappning kan vara antingen *only auth* eller *permissions*.

### Only Auth
Detta innebär att användaren endast måste vara inloggad för att få tillgång till resursen. För att sätta denan typen av access krävs det ett `null`-värde, alternativt en tom `string` i `refaccessresource`. Alla requests med en giltig `e-access-token` cookie kommer då släppas igenom.

### Permissions
Vissa andra resurser vill vi endast att personer med specifika roller ska kunna använda sig av. Då specificerar man vilken resurs (`AccessResource`) som krävs genom att skicka med resursens `slug`.

## Olika typer av access
Det finns två sätt som en användare kan ha access.

### Individual Access
Individuell access är precis vad det låter som. En användare som uttryckligen fått access tilldelad till just sig själv. Denna access kommer finnas kvar förevigt (eller tills någon tar bort den), och kommer alltså inte löpa ut i slutet av personens mandatperiod på någon post.

### Postaccess
Postaccess är access som sätts på Postnivå. T.ex. att *Cafémästaren* ska ha access till dörren  `cm`. Denna access kommer användare att automatiskt ärva under tiden den är tilldelad posten, och när mandatperioden är över så kommer accessen att tas bort.