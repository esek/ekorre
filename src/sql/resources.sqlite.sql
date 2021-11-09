CREATE TABLE IF NOT EXISTS "Resources" (
  "id" INTEGER PRIMARY KEY AUTOINCREMENT,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "resourceType" TEXT NOT NULL
);

INSERT INTO Resources (name, description, resourceType) VALUES ("Sikrit", "Rummet med en massa skräp", "DOOR");
INSERT INTO Resources (name, description, resourceType) VALUES ("BD", "Coolaste rummet i edekvata", "DOOR");
INSERT INTO Resources (name, description, resourceType) VALUES ("EKEA", "Här finns bord och skor", "DOOR");

INSERT INTO Resources (name, description, resourceType) VALUES ("SUPER_ADMIN", "Får göra allt", "WEB");
INSERT INTO Resources (name, description, resourceType) VALUES ("AHS", "Alkoholhanteringssystemet", "WEB");
INSERT INTO Resources (name, description, resourceType) VALUES ("NEWS_EDITOR", "Kan skapa och redigera nyheter", "WEB");