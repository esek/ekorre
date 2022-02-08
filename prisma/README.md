# Prisma

Prisma är en ORM som hjälper oss automatiskt generera typeklasserna för våra databastabeller.

## Filstruktur
I dagsläget finns inte moduler i prisma, dvs man kan inte använda import/export för att deklarera modeller i separata filer.
För att göra det enkelt att få en överblick ändå, används paketet `prismix` för att sammanställa samtliga prismafiler till en stor `schema.prisma`-fil.

Detta görs genom att köra:

```bash
npm run prisma:mix
```

`common.prisma` - Denna filen innehåller basen av våran struktur, dvs våran `datasource` och även våran `generator`.

`modules` - varje tabell är en separat module, som sedan slås ihop med prismix.

För att deklarera en **relation** behöver man skapa en `empty model`, dvs en liten del av modellen som beskriver hur relationen ser ut.

Läs mer:
- [Prisma](https://www.prisma.io/)
- [Prismix](https://www.npmjs.com/package/prismix)