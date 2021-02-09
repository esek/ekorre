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

Detta medför dock ett känt problem med GraphQL; n+1 problemet. Vi kan ju behöva göra en massa queries för att få `User`-objekt, vilket gör det väldigt långsamt att få fram artiklar. Problemet beskrivs bra i [denna](https://youtu.be/uCbFMZYQbxE) videon. Detta är något man måste lösa för att få en snabb API.