#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

cd "$ROOT_DIR"

echo "🔨 Building SPI..."
./gradlew :spi:shadowJar --quiet

echo "🔨 Building UI..."
pnpm build

echo "🚀 Starting Keycloak..."
docker compose -f docker-compose.dev.yml up "$@"
