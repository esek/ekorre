CREATE TABLE "AccessMappings" (
  "id" INTEGER PRIMARY KEY AUTOINCREMENT,
  "refaccessresource" TEXT,
  "resolverType" TEXT NOT NULL,
  "resolverName" TEXT NOT NULL,
	FOREIGN KEY("refaccessresource") REFERENCES "Resources"("slug")
);