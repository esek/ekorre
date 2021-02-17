BEGIN TRANSACTION;
CREATE TABLE IF NOT EXISTS "Articles" (
  "id" INT NOT NULL,
  "creator" TEXT NOT NULL,
  "lastupdateby" TEXT,
  "title" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "createdat" TIMESTAMP NOT NULL CURRENT_TIMESTAMP,
  "lastupdatedat" TIMESTAMP CURRENT_TIMESTAMP,
  "signature" TEXT NOT NULL,
  "tags" TEXT NOT NULL,
  "articletype" TEXT NOT NULL,
  PRIMARY KEY("id"),
  FOREIGN KEY("creator") REFERENCES "Users"("username")
  FOREIGN KEY("lastupdateby") REFERENCES "Users"("username")
);