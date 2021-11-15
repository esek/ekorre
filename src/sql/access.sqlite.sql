BEGIN TRANSACTION;

CREATE TABLE "PostAccess" (
	"refname"	TEXT NOT NULL,
	"refresource"	TEXT NOT NULL,
	PRIMARY KEY("refname","refresource"),
	FOREIGN KEY("refname") REFERENCES "Posts"("postname"),
	FOREIGN KEY("refresource") REFERENCES "Resources"("slug")
);

CREATE TABLE "IndividualAccess" (
	"refname"	TEXT NOT NULL,
	"refresource"	TEXT NOT NULL,
	PRIMARY KEY("refname","refresource"),
	FOREIGN KEY("refname") REFERENCES "Users"("username"),
	FOREIGN KEY("refresource") REFERENCES "Resources"("slug")
);

INSERT INTO PostAccess VALUES('Macapär', 'sikrit');
INSERT INTO PostAccess VALUES('Macapär', 'bd');
INSERT INTO PostAccess VALUES('Macapär', 'super-admin');
INSERT INTO PostAccess VALUES('Ordförande', 'sikrit');

INSERT INTO IndividualAccess VALUES('aa0000bb-s', 'sikrit');
INSERT INTO IndividualAccess VALUES('aa0000bb-s', 'ekea');
INSERT INTO IndividualAccess VALUES('aa0000bb-s', 'super-admin'); -- this allows aa0000bb-s to access everything by default

END TRANSACTION;