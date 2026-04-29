#!/bin/sh
set -e
cd /app
prisma migrate deploy
exec node server.js
