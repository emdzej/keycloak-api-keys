#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

cd "$ROOT_DIR"

echo "👀 Watching for changes..."
echo "   Press Ctrl+C to stop"
echo ""

# Run initial build
"$SCRIPT_DIR/build.sh"

# Watch and rebuild (requires entr or similar)
if command -v entr &> /dev/null; then
    find spi/src -name "*.java" | entr -r "$SCRIPT_DIR/build.sh"
else
    echo "⚠️  Install 'entr' for file watching: brew install entr"
    echo "   For now, run ./scripts/build.sh manually after changes"
fi
