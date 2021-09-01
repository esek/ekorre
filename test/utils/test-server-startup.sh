#! /bin/bash
# Detta är en fil som startar en dev-server, tänkt att
# användas i CI-miljö (efter `npm ci`)
# Kör `./<detta script> <port definierad i .env>`

PORT=$1
TIMEOUT=1000
counter=0

# Starta devserver och logga output i tillfällig fil
npm run dev > startup.tmp.log 2>&1 &

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