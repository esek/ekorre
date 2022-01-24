#!/bin/sh

cp .env.example.dev .env
DATABASE_PATH=sqlite_database.db
FILES_PATH=$PWD/public.local

echo "Skapar en databas under namnet $DATABASE_PATH"
sqlite3 -init src/sql/init.sql $DATABASE_PATH .exit
cp .env.example.dev .env
sed -i'' -e"s:DB_FILE=.*:DB_FILE=${DATABASE_PATH}:g" .env # Undvik / i regex då paths innehåller det, -i'' för POSIX compliance

echo "Fixar public mapp"

# Antingen finns hela directoriet, och då kopierar vi in filerna (public/),
# eller så kopierar vi även public
if [ -d $FILES_PATH ]; then
  cp -r public/ $FILES_PATH
else
  cp -r public $FILES_PATH
fi

sed -i'' -e"s:FILE_ROOT=.*:FILE_ROOT=${FILES_PATH}:g" .env