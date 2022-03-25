CREATE TABLE "PostAccess" (
	"refname"	TEXT NOT NULL,
	"resource"	TEXT NOT NULL,
	"resourcetype" TEXT NOT NULL,
	PRIMARY KEY("refname","resource")
	FOREIGN KEY("refname") REFERENCES "Posts"("postname")
);

CREATE TABLE "IndividualAccess" (
	"refname"	TEXT NOT NULL,
	"resource"	TEXT NOT NULL,
	"resourcetype" TEXT NOT NULL,
	PRIMARY KEY("refname","resource")
	FOREIGN KEY("refname") REFERENCES "Users"("username")
);

INSERT INTO PostAccess VALUES('Macapär', 'sikrit', 'door');
INSERT INTO PostAccess VALUES('Macapär', 'bd', 'door');
INSERT INTO PostAccess VALUES('Macapär', 'superadmin', 'feature');
INSERT INTO PostAccess VALUES('Ordförande', 'sikrit', 'door');

INSERT INTO IndividualAccess VALUES('aa0000bb-s', 'sikrit', 'door');
INSERT INTO IndividualAccess VALUES('aa0000bb-s', 'ekea', 'door');
INSERT INTO IndividualAccess VALUES('aa0000bb-s', 'superadmin', 'feature'); -- this allows aa0000bb-s to access everything by default
