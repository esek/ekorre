CREATE TABLE IF NOT EXISTS "Proposals" (
  "refuser" TEXT NOT NULL,
  "refpost" TEXT NOT NULL,
  "refelection" TEXT NOT NULL,
  FOREIGN KEY("refuser") REFERENCES "Users"("username"),
  FOREIGN KEY("refpost") REFERENCES "Posts"("postname"),
  FOREIGN KEY("refelection") REFERENCES "Elections"("id")
);