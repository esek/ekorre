# Migrering av gamla databasen

Detta är ett directory till för att migrera den gamla databasen
(`esek12`) till det nya formatet som används av `ekorre`. Denna
skapades genom att exportera strukturen för `esek12`. Dock är inte
alla tabeller med; Vissa ansågs inte nödvändiga (och inte alla som
är med behövs). Om det mot förmodan behövs mer kan detta exporteras
enkelt.

Det saknas i de allra flesta fall exempeldata, men detta kan läggas till
i `esek12_partial.sql` för att göra tester av migration enkelt!

För att börja migrera en ny tabell, eller grupp av tabeller, bara skapa
en ny SQL-fil och börja jämföra tabeller!
