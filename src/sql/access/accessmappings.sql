CREATE TABLE "AccessMappings" (
  "id" INTEGER PRIMARY KEY AUTOINCREMENT,
  "refaccessresource" TEXT,
  "resolverType" TEXT NOT NULL,
  "resolverName" TEXT NOT NULL,
	FOREIGN KEY("refaccessresource") REFERENCES "AccessResources"("slug")
  CONSTRAINT "uniqueMapping" UNIQUE ("refaccessresource", "resolverType", "resolverName")
  -- Stupid to disallow login for not logged in users
  CONSTRAINT "noLoginMapping" CHECK ("resolverName" <> "login")
  CONSTRAINT "noCasLoginMapping" CHECK ("resolverName" <> "casLogin")
);