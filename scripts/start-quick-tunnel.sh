#!/bin/zsh
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

cd "$ROOT_DIR"

if ! command -v cloudflared >/dev/null 2>&1; then
  echo "cloudflared not found in PATH"
  exit 1
fi

echo "Starting local bridge on http://127.0.0.1:4319 ..."
npm run start &
BRIDGE_PID=$!

cleanup() {
  kill "$BRIDGE_PID" >/dev/null 2>&1 || true
}

trap cleanup EXIT INT TERM

sleep 2

echo "Opening Cloudflare quick tunnel ..."
cloudflared tunnel --url http://127.0.0.1:4319
