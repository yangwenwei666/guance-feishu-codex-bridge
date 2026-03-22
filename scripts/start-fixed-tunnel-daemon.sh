#!/bin/zsh
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
export PATH="/opt/homebrew/bin:/opt/homebrew/opt/node@22/bin:${PATH:-}"
TUNNEL_NAME="${TUNNEL_NAME:-guance-feishu-codex}"
LOCAL_URL="${LOCAL_URL:-http://127.0.0.1:4319}"

cd "$ROOT_DIR"

exec /opt/homebrew/bin/cloudflared tunnel --no-autoupdate run --url "$LOCAL_URL" "$TUNNEL_NAME"
