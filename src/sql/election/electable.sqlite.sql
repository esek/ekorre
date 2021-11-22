CREATE TABLE IF NOT EXISTS "Electable" (
  "refpost" TEXT NOT NULL,
  "refelection" INTEGER NOT NULL,
  FOREIGN KEY("refpost") REFERENCES "Posts"("postname"),
  FOREIGN KEY("refelection") REFERENCES "Elections"("id"),
  PRIMARY KEY ("refpost", "refelection")
);