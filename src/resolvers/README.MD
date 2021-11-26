# Resolvers

Detta är den viktigaste delen av en Graphql api. Dessa hanterar
alla queries och ser till att de returnera vettig data.
För att göra det så användbart som möjligt så bör varje resolver
sköta en grej och om en resolvers funktion uttökar en annan
typ av data ska det fältet defineras i korrekt resolver. Se
`access` modulen och hur den uttökar både `post` och `user`. Det
går dock att lösa, men man behöver generellt använda [mappers](../models/mappers.d.ts),
för att specificera att vissa delar i en typ löses på annat håll.

I vissa fall kan `Maybe`-typer få TS att bli riktigt drygt.
För arrays av denna typ kan man använda `notEmpty`-filtret i [`util.ts`](../util.ts).

## Att hantera en typ i en annan

Ett exempel på något som innehåller väldigt många typer som kräver andra är
`Election`, se [`election.graphql`](../schemas/election.graphql). Vi kan
se att t.ex. `Election` behöver en lista av `Proposal`, som i sin tur
består av `User` och `Post`. Men om vi kollar hur detta ser ut i databasen blir
det ju extremt jobbigt (och långsamt) att gå igenom alla förslag, och sen för dem
skapa ett perfekt användarobjekt i `ElectionAPI`. Hur gör vi då? Och hur får
vi TypeScript att fatta vad vi vill? Vår räddning är delvis `graphql-generate` som
genererar våra typer av våra scheman, med hjälp av mappers. Mappers berättar för
TypeScript att vissa saker fyller sig själva (more or less).

Det är ofta bra att börja med schemat, men sen bör man starta på sin API. Varje API
ska bara göra SQL-queries på "sin egen" tabell. Så vi skapar ett antal typer i
[`models/db`](../models/db) som beskriver hur våra typer ser ut i databasen, jämfört
med våra genererade typer (vårt mål). För `DatabaseElection` ser vi att vi behöver en skapare,
men har endast `refcreator` (användarnamnet). Så vi gör följande:

#1 En ny typ, `ElectionResponse`, vilket är `Election` men vi tillåter att skapare är delvis där.
#2 Vi skapar en reducer, `electionReduce`, som omvandlar vår `DatabaseElection` till denna nya typ.
#3 Nu kan vi fylla ut resolvern med beskrivningar hur den ska fylla ut vår `ElectionResponse`
till att bli `Election`. Vi säger bl.a. att `creator` fås genom att använda en dataloader
för att få ett fullständigt `User`-objekt.

Ibland har vi inte en referens, som med `nominations` och `proposals`. Detta gör inget,
för de kan ju fås med hjälp av val-ID:t, och det är ju en del av `DatabaseElection` och
`ElectionResponse` redan.

Kolla runt lite i resolvers för att lista ut hur de fungerar. Notera att deras struktur
är densamma som hur vi definierar typer i GraphQL!
### (n+1)-problemet och vår standardlösning

Detta medför dock ett känt problem med GraphQL; n+1 problemet. Vi kan ju behöva göra en massa queries för att få `User`-objekt, vilket gör det väldigt långsamt att få fram artiklar. Problemet beskrivs bra i [denna](https://youtu.be/uCbFMZYQbxE) videon. Detta är något man måste lösa för att få en snabb och bra API.

I grunden går problemet ut på att om vi t.ex. ska ladda in flera `Article`-objekt, och varje objekt behöver ett `User`-objekt (som sköts av en annan del av API:n) måste vi skapa ett `User`-objekt för varje `Article`-objekt. Det kommer ju bli jättemånga queries snabbt! Vi vill lösa så att vi återanvänder `User`-objekt, om samma skulle dyka upp flera gånger.

Vår standardlösning är att använda `DataLoader`, ett objekt vi skapar vid varje request för att batcha t.ex. `User`-objekt. Konstruktorn till `DataLoader` kräver en funktion som ska vara på en viss form och laddar in `User`-objekt från `UserAPI`. Då detta är återkommande finns funktioner i `src/dataloaders` som sköter skapandet och användandet av DataLoaders. Om en user hämtats en gång redan i samma request så löser DataLoadern detta.

Anledningen att vi skapar ett nytt `DataLoader`-objekt varje gång är att vi inte ska cacha en `User` som sedan uppdateras i databasen, men inte i `DataLoader`-objektet; Då riskerar vi att skicka utdaterad information.

För den intresserade kan man kolla upp _memoization_, vilket är hur `DataLoader` håller koll på vilka `username` den redan har en `User` på.

DataLoaders ökar också prestanda genom att batcha flera förfrågningar till databasen samtidigt,
vilket är väldigt nice!