#!/usr/bin/env bash
set -euo pipefail

COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.prod.yml}"

if [[ ! -f "$COMPOSE_FILE" ]]; then
  echo "Compose file not found: $COMPOSE_FILE"
  exit 1
fi

if [[ ! -f ".env.production" ]]; then
  echo "Missing .env.production. Copy from .env.production.example first."
  exit 1
fi

echo "[1/4] Building and starting containers"
docker compose --env-file .env.production -f "$COMPOSE_FILE" up -d --build

echo "[2/4] Running Prisma migrations"
docker compose --env-file .env.production -f "$COMPOSE_FILE" exec -T app npm run db:migrate:deploy

echo "[3/4] Optional admin bootstrap"
docker compose --env-file .env.production -f "$COMPOSE_FILE" exec -T app npm run db:seed:admin

echo "[4/4] Current service status"
docker compose --env-file .env.production -f "$COMPOSE_FILE" ps
