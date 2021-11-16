CREATE TABLE IF NOT EXISTS "Electable" (
  "refpost" TEXT NOT NULL,
  "refelection" TEXT NOT NULL,
  CONSTRAINT "uniqueElectable" UNIQUE ("refpost", "refelection")
);