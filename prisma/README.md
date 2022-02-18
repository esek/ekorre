# Prisma

Prisma är en ORM som hjälper oss automatiskt generera typeklasserna för våra databastabeller.

Läs mer:
- [Prisma](https://www.prisma.io/)

## Index i databasen

Med `prisma` kan man enkelt skapa index (via `@@index`) för att snabba upp databasen rejält vid vissa
queries. Detta görs genom att databasen har en eller flera extra tabeller med sorteringar över kolumnerna
man definierat i sitt index. Dock måste man vara försiktig, då det kan göra databasen långsammare!

Har man flertalet nycklar i ett index går det snabbare då dessa två nycklar ofta förekommer i samma query.
Genom att kolla på `Query` i ekorres GraphQL-schemas kan man se vad som används för att hitta data, och
då kan det vara vettigt att skapa ett index för detta!

Index ska undvikas för tabeller som ofta uppdateras, eller åtminstone väldigt intensivt. De tar dessutom extra minne (bör inte vara något problem).

Som praxis bör _alla index motiveras med en kort kommentar i schemat!_