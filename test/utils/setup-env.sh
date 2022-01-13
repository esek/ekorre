#!/bin/bash

# Detta är en fil som initierar default .env

DATABASE_PATH=sqlite_database.db
FILES_PATH=$PWD/public.local

echo "Creating database at path $DATABASE_PATH"
sqlite3 -init src/sql/init.sql $DATABASE_PATH .exit
cp .env.example.dev .env
sed -i 's:DB_FILE=.*:DB_FILE='$DATABASE_PATH':' .env # Se nedan


echo "Creating public dir"
cp -r public $FILES_PATH
sed -i 's:FILE_ROOT=.*:FILE_ROOT='$FILES_PATH':' .env # Använd alternativ separator :, $PWD innehåller /
