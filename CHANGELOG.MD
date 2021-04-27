# Changelog
Alla märkbara ändringar ska dokumenteras i denna fil.

Baserat på [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
och följer [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2021-04-27

### Tillagt
 - `Files`-tabell i databasen
 - REST Endpoint för filuppladdning, default på `{baseUrl}/files/upload`
 - Hosting för statiska filer, default på `{baseUrl}/files/*`
 - API för CRUD för filer

### Ändrat
 - Apollo körs numera ovanpå express på `/`
 - Se [!13](https://gitlab.com/esektionen/projekt/ekorre/-/merge_requests/13/) för mer info

## [0.0.2] - 2021-04-27
### Tillagt
 - Initskript för att enklare kunna böjra arbeta med projektet
 - SEMVER

### Ändrat
 - Ändrat miljövariablen `port` -> `PORT` för att vara konsekvent
 - Ändrat standardport `3000` -> `5000` för att funka bättre med ekollon
 - Uppdaterat npm skript till att funka på windows

## [0.0.1] - 2021
### Tillagt
 - Hela projektet, kolla git historik för mer info...
