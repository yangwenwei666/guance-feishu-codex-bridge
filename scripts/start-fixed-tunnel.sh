#!/bin/zsh
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
TUNNEL_NAME="${TUNNEL_NAME:-guance-feishu-codex}"
LOCAL_URL="${LOCAL_URL:-http://127.0.0.1:4319}"

cd "$ROOT_DIR"

if ! command -v cloudflared >/dev/null 2>&1; then
  echo "cloudflared not found in PATH"
  exit 1
fi

echo "Starting fixed tunnel ${TUNNEL_NAME} -> ${LOCAL_URL} ..."
cloudflared tunnel --no-autoupdate run --url "$LOCAL_URL" "$TUNNEL_NAME"
