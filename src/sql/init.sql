BEGIN TRANSACTION;
CREATE TABLE IF NOT EXISTS "Users" (
	"username"	TEXT NOT NULL,

	"passwordHash" TEXT NOT NULL,
	"passwordSalt" TEXT NOT NULL,

	"firstName"	TEXT NOT NULL,
	"lastName"	TEXT NOT NULL,

	"photoUrl" TEXT,

	"email" TEXT NOT NULL,
	"phone" TEXT,
	"address" TEXT,
	"zipCode" TEXT,
	"website" TEXT,

	"class"	TEXT NOT NULL,
	"dateJoined" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

	PRIMARY KEY("username")
);


-- Alla lösenord är test men olika hash pga salt.
INSERT INTO "Users" ("username","passwordHash","passwordSalt","firstName","lastName","class", "email") 
VALUES ('aa0000bb-s','Y8IUptOZ0LI3sUUP6JVNtOZiNaIblxTTXBIJ4JIBFzr/PZgFoGHM0ua7hVFCb3yFSlyV/DI0/G/br7cU9qG4Ag==',
'Z1w2IPe1l9nCKwWM6RV+PA==','Emil','Blennow','E19', "aa0000bb-s@student.lu.se");
INSERT INTO "Users" ("username","passwordHash","passwordSalt","firstName","lastName","class", "email")
VALUES ('bb1111cc-s','Os3+GcPpLwK+PWF9mei/dstvdawQGpT0C4wP1oebTBp5JVooisVLpOJK4/ja2lsVuTLJlC6BKKJTWgummBXXtA==',
'MNuYPYgl6wy9GlDjYKpMiw==','Leif','Persson','E16','aa0000bb-s@student.lu.se');
INSERT INTO "Users" ("username","passwordHash","passwordSalt","firstName","lastName","class", "email")
VALUES ('no0000oh-s','lQFpDvvCGSVywE3PTjpTUSzwWYfGwlE4MxJ/dGZp0YRe7N/U8zKUx6NWA2aGWD7p/c090lpWYDIEcuXnaiFz5Q==',
'zXr+8b22sOLTvi/Zstu9Zw==','Lena','Handén','BME19','aa0000bb-s@student.lu.se');

END TRANSACTION;
BEGIN TRANSACTION;

CREATE TABLE "Posts" (
	"postname" TEXT NOT NULL,
	"utskott"	TEXT NOT NULL,
	"postType" TEXT NOT NULL,
	"spots" INT NOT NULL,
	"description" TEXT NOT NULL,
	"active" BOOLEAN NOT NULL,
	"interviewRequired" BOOLEAN NOT NULL DEFAULT 0,
	PRIMARY KEY("postname")
);

CREATE TABLE "PostHistory" (
	"refpost"	TEXT NOT NULL,
	"refuser"	TEXT NOT NULL,
	"start"	TIMESTAMP NOT NULL,
	"end"	TIMESTAMP,
	PRIMARY KEY("refpost", "refuser", "start"),
	FOREIGN KEY("refuser") REFERENCES "Users"("username"),
	FOREIGN KEY("refpost") REFERENCES "Posts"("postname")
);

INSERT INTO Posts (postname,utskott,posttype,spots,description,active,interviewRequired) VALUES ('Macapär','INFU','N',2,'Informationschefsslav',1,0);
INSERT INTO Posts (postname,utskott,posttype,spots,description,active,interviewRequired) VALUES ('Teknokrat','INFU','N',3,'Ljudperson',1,0);
INSERT INTO Posts (postname,utskott,posttype,spots,description,active,interviewRequired) VALUES ('Cophös','NOLLU','N',5,'Stressad',1,1);
INSERT INTO PostHistory (refpost,refuser,"start","end") VALUES ('Macapär','aa0000bb-s', 1577833200, 1609369200);
INSERT INTO PostHistory (refpost,refuser,"start","end") VALUES ('Macapär','aa0000bb-s', 1609369200, null);

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

CREATE TABLE "ApiKeyAccess" (
	"refname"	TEXT NOT NULL,
	"resource"	TEXT NOT NULL,
	"resourcetype" TEXT NOT NULL,
	PRIMARY KEY("refname","resource"),
	FOREIGN KEY("refname") REFERENCES "ApiKeys"("key")
);

INSERT INTO PostAccess VALUES('Macapär', 'sikrit', 'door');
INSERT INTO PostAccess VALUES('Macapär', 'bd', 'door');
INSERT INTO PostAccess VALUES('Macapär', 'superadmin', 'feature');
INSERT INTO PostAccess VALUES('Ordförande', 'sikrit', 'door');

INSERT INTO IndividualAccess VALUES('aa0000bb-s', 'sikrit', 'door');
INSERT INTO IndividualAccess VALUES('aa0000bb-s', 'ekea', 'door');
INSERT INTO IndividualAccess VALUES('aa0000bb-s', 'superadmin', 'feature'); -- this allows aa0000bb-s to access everything by default

CREATE TABLE IF NOT EXISTS "Articles" (
  "id" INTEGER PRIMARY KEY AUTOINCREMENT,
  "refcreator" TEXT NOT NULL,
  "reflastupdateby" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "lastUpdatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "signature" TEXT NOT NULL,
  "articleType" TEXT NOT NULL,
  FOREIGN KEY("refcreator") REFERENCES "Users"("username")
  FOREIGN KEY("reflastupdateby") REFERENCES "Users"("username")
);

CREATE TABLE IF NOT EXISTS "ArticleTags" (
  "id" INTEGER PRIMARY KEY AUTOINCREMENT,
  "refarticle" INTEGER NOT NULL,
  "tag" TEXT NOT NULL,
  FOREIGN KEY("refarticle") REFERENCES "Articles"("id")
);

INSERT INTO Articles (refcreator, reflastupdateby, title, body, signature, articleType) VALUES ('aa0000bb-s', 'aa0000bb-s', 'Nyhet 1', '<h1>Detta är en nyhet</h1><p>Body för nyheten<b>bold!</b></p>', 'AB', 'news');
INSERT INTO Articles (refcreator, reflastupdateby, title, body, signature, articleType) VALUES ('bb1111cc-s', 'aa0000bb-s', 'Nyhet 2', '<h1>Detta är också en nyhet</h1><p>Body för nyheten<i>italic!</i></p>', 'Hejsan', 'news');
INSERT INTO Articles (refcreator, reflastupdateby, title, body, signature, articleType) VALUES ('no0000oh-s', 'no0000oh-s', 'Info 1', '<h1>Detta är information</h1><p>Body för infon<s>strikethrough!</s></p>', 'XX', 'information');

INSERT INTO ArticleTags (refarticle, tag) VALUES (1, 'tag1');
INSERT INTO ArticleTags (refarticle, tag) VALUES (1, 'tag2');
INSERT INTO ArticleTags (refarticle, tag) VALUES (2, 'tag1');

CREATE TABLE IF NOT EXISTS "Files" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "folderLocation" TEXT NOT NULL,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "accessType" TEXT NOT NULL,
  "refuploader" TEXT NOT NULL,
  FOREIGN KEY("refuploader") REFERENCES "Users"("username")
);

INSERT INTO Files (id, name, type, folderLocation, accessType, refUploader) VALUES ('c703198a20f148f392061060f651fdb3.png', 'esek.png', 'image', '/c703198a20f148f392061060f651fdb3.png', 'public', 'aa0000bb-s');
INSERT INTO Files (id, name, type, folderLocation, accessType, refUploader) VALUES ('6f837f0400bd1eb70f3648fc31343ecc', 'textfiler', 'folder', '/6f837f0400bd1eb70f3648fc31343ecc', 'public', 'aa0000bb-s');
INSERT INTO Files (id, name, type, folderLocation, accessType, refUploader) VALUES ('098f6bcd4621d373cade4e832627b4f6.txt', 'text.txt', 'text', '/6f837f0400bd1eb70f3648fc31343ecc/098f6bcd4621d373cade4e832627b4f6.txt', 'authenticated', 'aa0000bb-s');

CREATE TABLE
IF NOT EXISTS "PasswordReset"
(
  "token" TEXT PRIMARY KEY,
  "username" TEXT NOT NULL,
  "time" NUMBER NOT NULL
);

CREATE TABLE IF NOT EXISTS "Meetings" (
  "id" INTEGER PRIMARY KEY AUTOINCREMENT,
  "type" TEXT NOT NULL,
  "number" INTEGER NOT NULL,
  "year" INTEGER NOT NULL,
  "refsummons" TEXT,
  "refdocuments" TEXT,
  "reflateDocuments" TEXT,
  "refprotocol" TEXT,
  "refappendix" TEXT,
  FOREIGN KEY("refsummons") REFERENCES "Files"("id"),
  FOREIGN KEY("refdocuments") REFERENCES "Files"("id"),
  FOREIGN KEY("reflateDocuments") REFERENCES "Files"("id"),
  FOREIGN KEY("refprotocol") REFERENCES "Files"("id"),
  FOREIGN KEY("refappendix") REFERENCES "Files"("id"),
  CONSTRAINT "uniqueMeeting" UNIQUE ("type", "number", "year")
);

INSERT INTO Meetings (type, number, year, refsummons) VALUES ('VM', 1, 2020, '098f6bcd4621d373cade4e832627b4f6.txt');
INSERT INTO Meetings (type, number, year) VALUES ('SM', 1, 1962);
INSERT INTO Meetings (type, number, year) VALUES ('Extra', 1, 2050);

CREATE TABLE IF NOT EXISTS "Elections" (
  "id" INTEGER PRIMARY KEY AUTOINCREMENT,
  "refcreator" TEXT NOT NULL,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "openedAt" TIMESTAMP,
  "closedAt" TIMESTAMP,
  "open" BOOLEAN NOT NULL DEFAULT 0,
  "nominationsHidden" BOOLEAN DEFAULT 0,
  FOREIGN KEY("refcreator") REFERENCES "Users"("username")
);

INSERT INTO Elections (refcreator, nominationsHidden) VALUES ('aa0000bb-s', 0);

CREATE TABLE IF NOT EXISTS "Electables" (
  "refpost" TEXT NOT NULL,
  "refelection" INTEGER NOT NULL,
  FOREIGN KEY("refpost") REFERENCES "Posts"("postname"),
  FOREIGN KEY("refelection") REFERENCES "Elections"("id"),
  PRIMARY KEY ("refpost", "refelection")
);

INSERT INTO Electables (refpost, refelection) VALUES ('Macapär', 1);

CREATE TABLE IF NOT EXISTS "Proposals" (
  "refuser" TEXT NOT NULL,
  "refpost" TEXT NOT NULL,
  "refelection" INTEGER NOT NULL,
  FOREIGN KEY("refuser") REFERENCES "Users"("username"),
  FOREIGN KEY("refpost") REFERENCES "Posts"("postname"),
  FOREIGN KEY("refelection") REFERENCES "Elections"("id"),
  PRIMARY KEY ("refuser", "refpost", "refelection")
);

INSERT INTO Proposals (refuser, refpost, refelection)  VALUES ('aa0000bb-s', 'Macapär', 1);

CREATE TABLE IF NOT EXISTS "Nominations" (
  "refuser" TEXT NOT NULL,
  "refpost" TEXT NOT NULL,
  "refelection" INT NOT NULL,
  "accepted" TEXT NOT NULL, -- TS Enum
  FOREIGN KEY("refuser") REFERENCES "Users"("username"),
  FOREIGN KEY("refpost") REFERENCES "Posts"("postname"),
  FOREIGN KEY("refelection") REFERENCES "Elections"("id"),
  PRIMARY KEY ("refuser", "refpost", "refelection")
);

INSERT INTO Nominations (refuser, refpost, refelection, accepted)  VALUES ('aa0000bb-s', 'Macapär', 1, 'YES');

CREATE TABLE IF NOT EXISTS "EmergencyContacts" (
  "id" INTEGER PRIMARY KEY AUTOINCREMENT,
  "name" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "phone" TEXT NOT NULL,
	"refuser" TEXT NOT NULL,
  FOREIGN KEY("refuser") REFERENCES "Users"("username")
);

CREATE TABLE IF NOT EXISTS "Hehes" (
  "number" INT NOT NULL,
  "year" INT NOT NULL,
  "refuploader" TEXT NOT NULL,
  "reffile" TEXT NOT NULL,
  FOREIGN KEY("refuploader") REFERENCES "Users"("username"),
  FOREIGN KEY("reffile") REFERENCES "Files"("id"),
  PRIMARY KEY ("number", "year")
);

CREATE TABLE "ApiKeys" (
	"key"	TEXT PRIMARY KEY NOT NULL UNIQUE,
	"description" TEXT NOT NULL,
	"createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
	"refcreator" TEXT NOT NULL,
	FOREIGN KEY("refcreator") REFERENCES "Users"("username")
);

END TRANSACTION;