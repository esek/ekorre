#!/bin/sh

# Startar och kollar efter en startad dev-server
# tänkt att användas i CI-miljö

npm run dev > startup.tmp.log 2>&1 &

source $PWD/.env # För att få $PORT
TIMEOUT=600
counter=0

# Greppa efter startad server tills dess adress hittas,
# räkna upp till timeout
while ! grep -q "http://.*:${PORT}" startup.tmp.log
do
  counter=$((counter + 1))
  if [ $counter -gt $TIMEOUT ]; then
    echo -e "Test dev server startup timed out\n"
    exit 1
  fi
  sleep .1
done

echo -e "Test dev server has started\n"
rm startup.tmp.log
exit 0