CREATE TABLE "AccessMappings" (
  "id" INTEGER PRIMARY KEY AUTOINCREMENT,
  "refresource" TEXT,
  "resolverType" TEXT NOT NULL,
  "resolverName" TEXT NOT NULL,
	FOREIGN KEY("refresource") REFERENCES "Resources"("slug")
);