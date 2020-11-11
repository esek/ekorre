BEGIN TRANSACTION;

CREATE TABLE "PostAccess" (
	"ref"	TEXT,
	"resourcetype"	TEXT,
	"resouce"	TEXT,
	PRIMARY KEY("refusername","resouce"),
	FOREIGN KEY("refusername") REFERENCES "Users"("username")
);

CREATE TABLE "IndividualAccess" (
	"ref"	TEXT,
	"resourcetype"	TEXT,
	"resource"	TEXT,
	PRIMARY KEY("refusername","resource")
)

END TRANSACTION;