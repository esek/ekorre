# Benchmarks

Detta dir innehåller skriptfiler som är tänkta att användas med `wrk` för att
kontrollera prestanda under högt tryck för `ekorre`. För mer info, se [wrk](https://github.com/wg/wrk).

Kräver att `wrk` är installerat (duh...)

## Kör test lokalt

Sätt upp en normal utvecklingsmiljö för `ekorre` och kör sedan exempelvis

```
npm run dev
wrk -t6 -c200 -d30s -s <script_name>.lua http://localhost:8081
```

och vänta på resultat! Kontrollera dock i resultatet att alla dina requests inte returnerar icke-`2XX`/`3XX`-statuskoder. Då returnerar din request nämligen inget vettigt alls...

## Skapa fler script

För att skapa egna request behöver man köra en query genom `JSON.stringify()`. Det enklaste sättet att göra
detta är följande:

1. Designa din query i din GraphQL-sandbox (det du får när du kör `npm run dev`)
2. Kontrollera att din query fungerar
3. Tryck på `COPY CURL`
4. Kopiera datan till `--data-binary` i kommandot du får, dvs. `curl ... --data-binary '<detta här!>' ...`
5. Öppna konsolen i din webbläsare och kör
```js
JSON.stringify(<det du precis kopierade>)
```
6. Kopiera output och klistra in som `wrk.body` i en ny Lua-fil!