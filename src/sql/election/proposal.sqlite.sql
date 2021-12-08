CREATE TABLE IF NOT EXISTS "Proposals" (
  "refuser" TEXT NOT NULL,
  "refpost" TEXT NOT NULL,
  "refelection" INTEGER NOT NULL,
  FOREIGN KEY("refuser") REFERENCES "Users"("username"),
  FOREIGN KEY("refpost") REFERENCES "Posts"("postname"),
  FOREIGN KEY("refelection") REFERENCES "Elections"("id"),
  PRIMARY KEY ("refuser", "refpost", "refelection")
);

INSERT INTO Proposals (refuser, refpost, refelection)  VALUES ('aa0000bb-s', 'Macapär', 1);