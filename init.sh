#!/bin/bash

if ! command -v sqlite3 &> /dev/null
then
    echo "sqlite3 kunde inte hittas!"
    echo "För debian/ubuntu skriv: sudo apt install sqlite3"
    echo "För fedora/rhel skriv: sudo dnf install sqlite3"
    exit
fi

function finish {
    echo "PS: för att starta serven själv senare så skriv kommandot:"
    echo ""
    echo "npm run dev"
}
trap finish EXIT

DATABASE_PATH=sqlite_database.db
FILES_PATH=$PWD/public.local

echo "Skapar en databas under namnet $DATABASE_PATH"
sqlite3 -init src/sql/init.sql $DATABASE_PATH .exit
cp .env.example.dev .env
sed -i '' 's:DB_FILE=.*:DB_FILE='$DATABASE_PATH':' .env # Se nedan


echo "Fixar public mapp"
cp -r public $FILES_PATH
sed -i '' 's:FILE_ROOT=.*:FILE_ROOT='$FILES_PATH':' .env # Använd alternativ separator :, $PWD innehåller /

echo "Installerar alla npm paket..."
npm install

echo "Startar utvecklingserver..."
echo "För att stänga av servern, tryck CTRL+C"
sleep 5

npm run dev

