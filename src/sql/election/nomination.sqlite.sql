CREATE TABLE IF NOT EXISTS "Nominations" (
  "refuser" TEXT NOT NULL,
  "refpost" TEXT NOT NULL,
  "refelection" INT NOT NULL,
  "accepted" TEXT NOT NULL, -- TS Enum
  FOREIGN KEY("refuser") REFERENCES "Users"("username"),
  FOREIGN KEY("refpost") REFERENCES "Posts"("postname"),
  FOREIGN KEY("refelection") REFERENCES "Elections"("id"),
  PRIMARY KEY ("refuser", "refpost", "refelection")
);

INSERT INTO Nominations (refuser, refpost, refelection, accepted)  VALUES ('aa0000bb-s', 'Macapär', 1, 'YES');