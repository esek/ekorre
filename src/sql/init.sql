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

	"isFuncUser" BOOLEAN NOT NULL DEFAULT False,
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
INSERT INTO "Users" ("username","passwordHash","passwordSalt","firstName","lastName","class", "email", "isFuncUser")
VALUES ('funcUser_Coolkid','glowAU4b0/zhRpqCUiMc8CtRqxySFUxZLvPLiXPPMUS6RapfgACfSDGSqvjc5PLALmqH2IAX3omnr9JuH1NOfA==','salt','Mr.','Test','E69',
'no-reply@esek.se', 'True');

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
	"start"	DATE NOT NULL,
	"end"	DATE,
	"period" INT,
	PRIMARY KEY("refpost","refuser","period"),
	FOREIGN KEY("refuser") REFERENCES "Users"("username"),
	FOREIGN KEY("refpost") REFERENCES "Posts"("postname")
);

INSERT INTO Posts (postname,utskott,posttype,spots,description,active,interviewRequired) VALUES ('Macapär','INFU','N',2,'Informationschefsslav',1,0);
INSERT INTO Posts (postname,utskott,posttype,spots,description,active,interviewRequired) VALUES ('Teknokrat','INFU','N',3,'Ljudperson',1,0);
INSERT INTO Posts (postname,utskott,posttype,spots,description,active,interviewRequired) VALUES ('Cophös','NOLLU','N',5,'Stressad',1,1);
--INSERT INTO PostHistory (refpost,refuser,"start","end",period) VALUES ('Macapär','aa0000bb-s', '2020-12-29', '2020-12-30',2020);
--INSERT INTO PostHistory (refpost,refuser,"start","end",period) VALUES ('Macapär','aa0000bb-s', '2020-12-29' ,null,2021);

END TRANSACTION;
BEGIN TRANSACTION;

CREATE TABLE "AccessResources" (
  "slug" TEXT PRIMARY KEY NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "resourceType" TEXT NOT NULL
);

INSERT INTO AccessResources (slug, name, description, resourceType) VALUES ("sikrit", "Sikrit", "Rummet med en massa skräp", "DOOR");
INSERT INTO AccessResources (slug, name, description, resourceType) VALUES ("bd", "Blå Dörren", "Coolaste rummet i edekvata", "DOOR");
INSERT INTO AccessResources (slug, name, description, resourceType) VALUES ("ekea", "EKEA", "Här finns bord och skor", "DOOR");

INSERT INTO AccessResources (slug, name, description, resourceType) VALUES ("super-admin", "Superadmin", "Får göra allt", "WEB");
INSERT INTO AccessResources (slug, name, description, resourceType) VALUES ("ahs", "AHS", "Alkoholhanteringssystemet", "WEB");
INSERT INTO AccessResources (slug, name, description, resourceType) VALUES ("article-editor", "Artikelredigerare", "Kan skapa och redigera artiklar", "WEB");

CREATE TABLE "PostAccess" (
	"refname"	TEXT NOT NULL,
	"refaccessresource"	TEXT NOT NULL,
	PRIMARY KEY("refname","refaccessresource"),
	FOREIGN KEY("refname") REFERENCES "Posts"("postname"),
	FOREIGN KEY("refaccessresource") REFERENCES "AccessResources"("slug")
);

CREATE TABLE "IndividualAccess" (
	"refname"	TEXT NOT NULL,
	"refaccessresource"	TEXT NOT NULL,
	PRIMARY KEY("refname","refaccessresource"),
	FOREIGN KEY("refname") REFERENCES "Users"("username"),
	FOREIGN KEY("refaccessresource") REFERENCES "AccessResources"("slug")
);

INSERT INTO PostAccess VALUES('Macapär', 'sikrit');
INSERT INTO PostAccess VALUES('Macapär', 'bd');
INSERT INTO PostAccess VALUES('Macapär', 'super-admin');
INSERT INTO PostAccess VALUES('Ordförande', 'sikrit');

INSERT INTO IndividualAccess VALUES('aa0000bb-s', 'sikrit');
INSERT INTO IndividualAccess VALUES('aa0000bb-s', 'ekea');
INSERT INTO IndividualAccess VALUES('aa0000bb-s', 'super-admin'); -- this allows aa0000bb-s to access everything by default

CREATE TABLE "AccessMappings" (
  "id" INTEGER PRIMARY KEY AUTOINCREMENT,
  "refaccessresource" TEXT,
  "resolverType" TEXT NOT NULL,
  "resolverName" TEXT NOT NULL,
	FOREIGN KEY("refaccessresource") REFERENCES "AccessResources"("slug")
  CONSTRAINT "uniqueMapping" UNIQUE ("refaccessresource", "resolverType", "resolverName")

);


CREATE TABLE IF NOT EXISTS "Articles" (
  "id" INTEGER PRIMARY KEY AUTOINCREMENT,
  "refcreator" TEXT NOT NULL,
  "reflastupdateby" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "lastUpdatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "signature" TEXT NOT NULL,
  "tags" TEXT NOT NULL,
  "articleType" TEXT NOT NULL,
  FOREIGN KEY("refcreator") REFERENCES "Users"("username")
  FOREIGN KEY("reflastupdateby") REFERENCES "Users"("username")
);

INSERT INTO Articles (refcreator, reflastupdateby, title, body, signature, tags, articleType) VALUES ('aa0000bb-s', 'aa0000bb-s', 'Nyhet 1', '<h1>Detta är en nyhet</h1><p>Body för nyheten<b>bold!</b></p>', 'AB', 'tag1,tag2','news');
INSERT INTO Articles (refcreator, reflastupdateby, title, body, signature, tags, articleType) VALUES ('bb1111cc-s', 'aa0000bb-s', 'Nyhet 2', '<h1>Detta är också en nyhet</h1><p>Body för nyheten<i>italic!</i></p>', 'Hejsan', 'tag1,tag2','news');
INSERT INTO Articles (refcreator, reflastupdateby, title, body, signature, tags, articleType) VALUES ('no0000oh-s', 'no0000oh-s', 'Info 1', '<h1>Detta är information</h1><p>Body för infon<s>strikethrough!</s></p>', 'XX', '','information');

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
  FOREIGN KEY("refsummons") REFERENCES "Files"("id"),
  FOREIGN KEY("refdocuments") REFERENCES "Files"("id"),
  FOREIGN KEY("reflateDocuments") REFERENCES "Files"("id"),
  FOREIGN KEY("refprotocol") REFERENCES "Files"("id"),
  CONSTRAINT "uniqueMeeting" UNIQUE ("type", "number", "year")
);

INSERT INTO Meetings (type, number, year, refsummons) VALUES ('VM', 1, 2020, '098f6bcd4621d373cade4e832627b4f6.txt');
INSERT INTO Meetings (type, number, year) VALUES ('SM', 1, 1962);
INSERT INTO Meetings (type, number, year) VALUES ('Extra', 1, 2050);

END TRANSACTION;