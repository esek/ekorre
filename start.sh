#!/bin/sh
set -e

# The database can still be starting, e.g. when it is recreated in the same deploy.
# Only an unreachable database (P1001) is retried, other errors stop the start
echo "Running database migrations..."
tries=0
until out=$(npx prisma migrate deploy 2>&1); do
  echo "$out"
  tries=$((tries + 1))
  if ! echo "$out" | grep -q P1001 || [ "$tries" -ge 30 ]; then
    exit 1
  fi
  echo "Database not reachable yet, retrying in 2s ($tries/30)..."
  sleep 2
done
echo "$out"

echo "Starting application..."
exec node -r ts-node/register/transpile-only -r tsconfig-paths/register build/src/index.js
