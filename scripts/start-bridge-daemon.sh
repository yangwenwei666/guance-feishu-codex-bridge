#!/bin/zsh
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
export PATH="/opt/homebrew/bin:/opt/homebrew/opt/node@22/bin:${PATH:-}"
export BRIDGE_CONFIG_PATH="${BRIDGE_CONFIG_PATH:-$ROOT_DIR/bridge.config.json}"

cd "$ROOT_DIR"

exec /opt/homebrew/opt/node@22/bin/npm run start
