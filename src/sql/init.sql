BEGIN TRANSACTION;
CREATE TABLE IF NOT EXISTS "Users" (
	"username"	TEXT NOT NULL,
	"passwordHash" TEXT NOT NULL,
	"salt" TEXT NOT NULL,
	"name"	TEXT NOT NULL,
	"lastname"	TEXT NOT NULL,
	"class"	TEXT NOT NULL,
	"datejoined" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
	PRIMARY KEY("username")
);

-- Alla lösenord är test men olika hash pga salt.
INSERT INTO "Users" ("username","passwordHash","salt","name","lastname","class") 
VALUES ('aa0000bb-s','Y8IUptOZ0LI3sUUP6JVNtOZiNaIblxTTXBIJ4JIBFzr/PZgFoGHM0ua7hVFCb3yFSlyV/DI0/G/br7cU9qG4Ag==',
'Z1w2IPe1l9nCKwWM6RV+PA==','Emil','Blennow','E19');
INSERT INTO "Users" ("username","passwordHash","salt","name","lastname","class")
VALUES ('bb1111cc-s','Os3+GcPpLwK+PWF9mei/dstvdawQGpT0C4wP1oebTBp5JVooisVLpOJK4/ja2lsVuTLJlC6BKKJTWgummBXXtA==',
'MNuYPYgl6wy9GlDjYKpMiw==','Leif','Persson','E16');
INSERT INTO "Users" ("username","passwordHash","salt","name","lastname","class")
VALUES ('no0000oh-s','lQFpDvvCGSVywE3PTjpTUSzwWYfGwlE4MxJ/dGZp0YRe7N/U8zKUx6NWA2aGWD7p/c090lpWYDIEcuXnaiFz5Q==',
'zXr+8b22sOLTvi/Zstu9Zw==','Lena','Handén','BME19');

END TRANSACTION;
BEGIN TRANSACTION;

CREATE TABLE "Posts" (
	"postname" TEXT NOT NULL,
	"utskott"	TEXT NOT NULL,
	PRIMARY KEY("postname")
);

CREATE TABLE "PostHistory" (
	"refpost"	TEXT NOT NULL,
	"refuser"	TEXT NOT NULL,
	"start"	TEXT NOT NULL,
	"end"	TEXT,
	"period" INT,
	PRIMARY KEY("refpost","refuser","period"),
	FOREIGN KEY("refuser") REFERENCES "Users"("username"),
	FOREIGN KEY("refpost") REFERENCES "Posts"("postname")
);

INSERT INTO Posts (postname,utskott) VALUES ('Macapär','INFU');
INSERT INTO PostHistory (refpost,refuser,"start","end",period) VALUES ('Macapär','aa0000bb-s','2020-12-29','2020-12-30',2020);
INSERT INTO PostHistory (refpost,refuser,"start","end",period) VALUES ('Macapär','aa0000bb-s','2020-12-29',null,2021);

END TRANSACTION;BEGIN TRANSACTION;

CREATE TABLE "PostAccess" (
	"ref"	TEXT,
	"resourcetype"	TEXT,
	"resource"	TEXT,
	PRIMARY KEY("ref","resource"),
	FOREIGN KEY("ref") REFERENCES "Posts"("postname")
);

CREATE TABLE "IndividualAccess" (
	"ref"	TEXT,
	"resourcetype"	TEXT,
	"resource"	TEXT,
	PRIMARY KEY("ref","resource")
	FOREIGN KEY("ref") REFERENCES "Users"("username")
);

INSERT INTO IndividualAccess ("ref",resourcetype,resource) VALUES ('aa0000bb-s','DOOR','pump');
INSERT INTO PostAccess ("ref",resourcetype,resource) VALUES ('Macapär','DOOR','hk');

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
  "id" INTEGER PRIMARY KEY AUTOINCREMENT,
  "name" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "folderLocation" TEXT NOT NULL,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "accessType" TEXT NOT NULL,
  "refuploader" TEXT NOT NULL,
  FOREIGN KEY("refuploader") REFERENCES "Users"("username")
);


END TRANSACTION;