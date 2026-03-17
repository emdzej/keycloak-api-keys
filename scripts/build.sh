#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

cd "$ROOT_DIR"

echo "🔨 Building SPI (shadowJar)..."
./gradlew :spi:shadowJar

echo "🔨 Building UI packages..."
pnpm build

echo "✅ Build complete!"
echo "   SPI JAR: spi/build/libs/spi-0.1.0-SNAPSHOT-all.jar"
