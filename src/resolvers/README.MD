# Resolvers

Detta är den viktigaste delen av en Graphql api. Dessa hanterar
alla queries och ser till att de returnera vettig data.
För att göra det så användbart som möjligt så bör varje resolver
sköta en grej och om en resolvers funktion uttökar en annan
typ av data ska det fältet defineras i korrekt resolver. Se
`access` modulen och hur den uttökar både `post` och `user`. Detta
är dock lite av ett undantagsfall.

## Att hantera en typ i en annan

Låt oss ta `article` som exempel (för jag skrev den och har därför koll på den, även om den i skrivande stund ej är mergad). Om du kollar i `/src/schemas/article.graphql` ser du att `Article` kräver två `User`-objekt; `creator` och `lastUpdatedBy`. Men detta kan ju bli krångligt om man inte gör det relativt snyggt. Vi måste ju skapa ett `User`-objekt vid något tillfälle så vi kan returnera detta. Sättet vi löser detta är genom att använda `UserAPI` i `article.resolver.ts`. Vi sparar `username` som `creator` i vår artikel-databas, men inte hela `User`-objektet. Därför returnerar vår `ArticleAPI` en `ArticleModel` till vår reducer som formaterar och returnerar ännu en `ArticleModel` till resolvern.

Vår `ArticleModel` är en speciell typ skapad genom

```
export type ArticleModel = Omit<Article, 'creator' | 'lastUpdatedBy'> & {
  refcreator: string;  // Reference for use, i.e. username
  reflastupdater: string
}
```

dvs. vi har referens-användarnamn `refcreator`, en sträng, som placeholder. Eftersom `username` är unikt i databasen räcker detta för att i resolvern kalla på `UserAPI.getSingleUser()` för att få fram ett färdigt `User`-objekt genom vårt användarnamn `refuser`, som vi sedan kan returnera som en del i vårt `Article`-objekt.

### (n+1)-problemet och vår standardlösning

Detta medför dock ett känt problem med GraphQL; n+1 problemet. Vi kan ju behöva göra en massa queries för att få `User`-objekt, vilket gör det väldigt långsamt att få fram artiklar. Problemet beskrivs bra i [denna](https://youtu.be/uCbFMZYQbxE) videon. Detta är något man måste lösa för att få en snabb och bra API.

I grunden går problemet ut på att om vi t.ex. ska ladda in flera `Article`-objekt, och varje objekt behöver ett `User`-objekt (som sköts av en annan del av API:n) måste vi skapa ett `User`-objekt för varje `Article`-objekt. Det kommer ju bli jättemånga queries snabbt! Vi vill lösa så att vi återanvänder `User`-objekt, om samma skulle dyka upp flera gånger.

Vår standardlösning är att använda `DataLoader`, ett objekt vi skapar vid varje request för att batcha `User`-objekt, denna lagrar vi i `ctx` som `ctx.batchUsersFunction()`. Vid varje request skapar vi ett nytt `DataLoader`-objekt med `ctx.batchUsersFunction` som parameter. Sedan använder vi `load()`-metoden på detta objekt när vi vill hämta nya users. Om en user hämtats en gång redan i samma request så löser DataLoadern detta.

T.ex. kan vi i vår resolver skapa en ny `DataLoader` i en av våra Query-funktioner som

```
const userLoader = new DataLoader<string, User>(usernames => ctx.batchUsersFunction(usernames));
```