CREATE TABLE IF NOT EXISTS "Nominations" (
  "refuser" TEXT NOT NULL,
  "refpost" TEXT NOT NULL,
  "refelection" INT NOT NULL,
  "response" BOOLEAN DEFAULT NULL,
  FOREIGN KEY("refuser") REFERENCES "Users"("username"),
  FOREIGN KEY("refpost") REFERENCES "Posts"("postname"),
  FOREIGN KEY("refelection") REFERENCES "Elections"("id"),
  CONSTRAINT "uniqueNomination" UNIQUE ("refuser", "refpost", "refelection")
);
