#!/usr/bin/env bash
set -euo pipefail

COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.prod.yml}"

echo "== docker compose ps =="
docker compose --env-file .env.production -f "$COMPOSE_FILE" ps

echo "\n== app logs (last 100 lines) =="
docker compose --env-file .env.production -f "$COMPOSE_FILE" logs app --tail=100

echo "\n== prisma migration status =="
docker compose --env-file .env.production -f "$COMPOSE_FILE" exec -T app npx prisma migrate status
