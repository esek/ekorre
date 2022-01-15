#!/bin/sh

cp .env.example.dev .env
DATABASE_PATH=sqlite_database.db
FILES_PATH=$PWD/public.local

echo "Skapar en databas under namnet $DATABASE_PATH"
sqlite3 -init src/sql/init.sql $DATABASE_PATH .exit
cp .env.example.dev .env
sed --in-place='' -e "s:DB_FILE=.*:DB_FILE=${DATABASE_PATH}:g" .env # Undvik / i regex då paths innehåller det

echo "Fixar public mapp"
cp -r public $FILES_PATH
sed --in-place='' -e "s:FILE_ROOT=.*:FILE_ROOT=${FILES_PATH}:g" .env