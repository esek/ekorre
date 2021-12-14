CREATE TABLE IF NOT EXISTS "Hehes" (
  "number" INT NOT NULL,
  "year" INT NOT NULL,
  "refuploader" TEXT NOT NULL,
  "reffile" TEXT NOT NULL,
  FOREIGN KEY("refuploader") REFERENCES "Users"("username"),
  FOREIGN KEY("reffile") REFERENCES "Files"("id"),
  PRIMARY KEY ("number", "year")
);