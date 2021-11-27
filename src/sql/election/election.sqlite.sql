CREATE TABLE IF NOT EXISTS "Elections" (
  "id" INTEGER PRIMARY KEY AUTOINCREMENT,
  "refcreator" TEXT NOT NULL,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "openedAt" TIMESTAMP,
  "closedAt" TIMESTAMP,
  "open" BOOLEAN NOT NULL DEFAULT 0,
  "nominationsHidden" BOOLEAN DEFAULT 0,
  FOREIGN KEY("refcreator") REFERENCES "Users"("username")
);

INSERT INTO Elections (refcreator, nominationsHidden) VALUES ('aa0000bb-s', 0);
