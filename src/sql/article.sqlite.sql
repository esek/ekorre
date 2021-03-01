BEGIN TRANSACTION;
CREATE TABLE IF NOT EXISTS "Articles" (
  "id" INT NOT NULL,
  "refcreator" TEXT NOT NULL,
  "reflastupdateby" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "createdAt" TIMESTAMP NOT NULL CURRENT_TIMESTAMP,
  "lastUpdatedAt" TIMESTAMP CURRENT_TIMESTAMP,
  "signature" TEXT NOT NULL,
  "tags" TEXT NOT NULL,
  "articleType" TEXT NOT NULL,
  PRIMARY KEY("id"),
  FOREIGN KEY("refcreator") REFERENCES "Users"("username")
  FOREIGN KEY("reflastupdateby") REFERENCES "Users"("username")
);