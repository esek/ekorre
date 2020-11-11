BEGIN TRANSACTION;

CREATE TABLE "PostAccess" (
	"refusername"	TEXT,
	"resourcetype"	TEXT,
	"resouce"	TEXT,
	PRIMARY KEY("refusername","resouce"),
	FOREIGN KEY("refusername") REFERENCES "Users"("username")
);

CREATE TABLE "IndividualAccess" (
	"refusername"	TEXT,
	"resourcetype"	TEXT,
	"resource"	TEXT,
	PRIMARY KEY("refusername","resource")
)

END TRANSACTION;