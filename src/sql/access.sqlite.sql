BEGIN TRANSACTION;

CREATE TABLE "PostAccess" (
	"refname"	TEXT,
	"refresource"	INTEGER,
	PRIMARY KEY("refname","refresource"),
	FOREIGN KEY("refname") REFERENCES "Posts"("postname"),
	FOREIGN KEY("refresource") REFERENCES "Resources"("id")
);

CREATE TABLE "IndividualAccess" (
	"refname"	TEXT,
	"refresource"	INTEGER,
	PRIMARY KEY("refname","refresource"),
	FOREIGN KEY("refname") REFERENCES "Users"("username"),
	FOREIGN KEY("refresource") REFERENCES "Resources"("id")
);

INSERT INTO PostAccess VALUES('Macapär', 1);
INSERT INTO PostAccess VALUES('Macapär', 2);
INSERT INTO PostAccess VALUES('Macapär', 4);
INSERT INTO PostAccess VALUES('Ordförande', 1);

INSERT INTO IndividualAccess VALUES('aa0000bb-s', 1);
INSERT INTO IndividualAccess VALUES('aa0000bb-s', 3);

END TRANSACTION;