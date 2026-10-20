#!/bin/sh
set -e

echo "Running database migrations..."
npx prisma migrate deploy

echo "Starting application..."
exec node -r ts-node/register/transpile-only -r tsconfig-paths/register build/src/index.js
