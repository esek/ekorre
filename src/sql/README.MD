# SQL

Här bör alla sql filer för att skapa de fält som behövs finnas.
Det går även bra att mata in lite exempeldata så den som
ska sätta upp en ny miljö har data att jobba med.

TODO: Komma på hur detta ska lösas i produktion.

## Foreign keys

För att förhindra att man gör något dumt som klyddar till det används `FOREIGN KEY`,
vilket förhindrar att man t.ex. lägger till en `refpost` som inte är en post i `Electables`.
Dock måste det vara enabled, vilket för sqlite görs i runtime med

```sql
PRAGMA foreign_keys = ON;
```
