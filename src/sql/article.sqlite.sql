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