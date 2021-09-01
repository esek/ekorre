#! /bin/bash
# Detta är en fil som startar kollar efter en startad dev-server
# i startup.tmp.log, tänkt att användas i CI-miljö
# (efter `npm ci` och `./init.sh > startup.tmp.log 2>&1 &`)
# Kör `./<detta script> <port definierad i .env>`

PORT=$1
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