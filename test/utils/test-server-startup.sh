#! /bin/bash
# Detta är en fil som initierar default .env,
# startar och kollar efter en startad dev-server
# tänkt att användas i CI-miljö

DATABASE_PATH=sqlite_database.db
FILES_PATH=$PWD/public.local

echo "Creating database at path $DATABASE_PATH"
sqlite3 -init src/sql/init.sql $DATABASE_PATH .exit
cp .env.example.dev .env
sed -i 's:DB_FILE=.*:DB_FILE='$DATABASE_PATH':' .env # Se nedan


echo "Creating public dir"
cp -r public $FILES_PATH
sed -i 's:FILE_ROOT=.*:FILE_ROOT='$FILES_PATH':' .env # Använd alternativ separator :, $PWD innehåller /

npm run dev > startup.tmp.log 2>&1 &

PORT=$(cat .env | grep -oP '(?<=PORT=)(\d+)')
TIMEOUT=1000
counter=0

# Greppa efter startad server tills dess adress hittas,
# räkna upp till timeout
while ! grep -q "http://.*:$PORT" startup.tmp.log
do
  counter=$((counter + 1))
  if [[ counter -gt TIMEOUT ]]; then
    echo -e "Test dev server startup timed out\n"
    exit 1
  fi
  sleep .1
done

echo -e "Test dev server has started\n"
rm startup.tmp.log
exit 0