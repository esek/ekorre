CREATE TABLE IF NOT EXISTS "AccessResources" (
  "slug" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "resourceType" TEXT NOT NULL
);

INSERT INTO AccessResources (slug, name, description, resourceType) VALUES ("sikrit", "Sikrit", "Rummet med en massa skräp", "DOOR");
INSERT INTO AccessResources (slug, name, description, resourceType) VALUES ("bd", "Blå Dörren", "Coolaste rummet i edekvata", "DOOR");
INSERT INTO AccessResources (slug, name, description, resourceType) VALUES ("ekea", "EKEA", "Här finns bord och skor", "DOOR");

INSERT INTO AccessResources (slug, name, description, resourceType) VALUES ("super-admin", "SUPER_ADMIN", "Får göra allt", "WEB");
INSERT INTO AccessResources (slug, name, description, resourceType) VALUES ("ahs", "AHS", "Alkoholhanteringssystemet", "WEB");
INSERT INTO AccessResources (slug, name, description, resourceType) VALUES ("news-editor", "NEWS_EDITOR", "Kan skapa och redigera nyheter", "WEB");