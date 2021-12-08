CREATE TABLE IF NOT EXISTS "Electables" (
  "refpost" TEXT NOT NULL,
  "refelection" INTEGER NOT NULL,
  FOREIGN KEY("refpost") REFERENCES "Posts"("postname"),
  FOREIGN KEY("refelection") REFERENCES "Elections"("id"),
  PRIMARY KEY ("refpost", "refelection")
);

INSERT INTO Electables (refpost, refelection) VALUES ('Macapär', 1);