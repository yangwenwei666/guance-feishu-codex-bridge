#!/bin/zsh
set -euo pipefail

SOURCE_DIR="$(cd "$(dirname "$0")/.." && pwd)"
RUNTIME_DIR="$HOME/Library/Application Support/guance-feishu-codex-bridge"
LAUNCH_AGENTS_DIR="$HOME/Library/LaunchAgents"
BRIDGE_PLIST="$LAUNCH_AGENTS_DIR/com.yangwenwei.guance.feishu-bridge.plist"
TUNNEL_PLIST="$LAUNCH_AGENTS_DIR/com.yangwenwei.guance.cloudflared-tunnel.plist"
BRIDGE_LABEL="com.yangwenwei.guance.feishu-bridge"
TUNNEL_LABEL="com.yangwenwei.guance.cloudflared-tunnel"
LOG_DIR="/tmp"

mkdir -p "$LAUNCH_AGENTS_DIR"
mkdir -p "$RUNTIME_DIR/src" "$RUNTIME_DIR/scripts"

cp "$SOURCE_DIR/package.json" "$RUNTIME_DIR/package.json"
cp "$SOURCE_DIR/bridge.config.json" "$RUNTIME_DIR/bridge.config.json"
cp "$SOURCE_DIR/scripts/start-bridge-daemon.sh" "$RUNTIME_DIR/scripts/start-bridge-daemon.sh"
cp "$SOURCE_DIR/scripts/start-fixed-tunnel-daemon.sh" "$RUNTIME_DIR/scripts/start-fixed-tunnel-daemon.sh"

chmod +x "$RUNTIME_DIR/scripts/start-bridge-daemon.sh" "$RUNTIME_DIR/scripts/start-fixed-tunnel-daemon.sh"

rsync -a --delete "$SOURCE_DIR/src/" "$RUNTIME_DIR/src/"

cat > "$BRIDGE_PLIST" <<PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>${BRIDGE_LABEL}</string>
  <key>ProgramArguments</key>
  <array>
    <string>/bin/zsh</string>
    <string>${RUNTIME_DIR}/scripts/start-bridge-daemon.sh</string>
  </array>
  <key>WorkingDirectory</key>
  <string>${RUNTIME_DIR}</string>
  <key>EnvironmentVariables</key>
  <dict>
    <key>PATH</key>
    <string>/Applications/Codex.app/Contents/Resources:/opt/homebrew/bin:/opt/homebrew/opt/node@22/bin:/usr/local/bin:/usr/bin:/bin</string>
    <key>BRIDGE_CONFIG_PATH</key>
    <string>${RUNTIME_DIR}/bridge.config.json</string>
  </dict>
  <key>RunAtLoad</key>
  <true/>
  <key>KeepAlive</key>
  <true/>
  <key>StandardOutPath</key>
  <string>${LOG_DIR}/guance-feishu-bridge.out.log</string>
  <key>StandardErrorPath</key>
  <string>${LOG_DIR}/guance-feishu-bridge.err.log</string>
</dict>
</plist>
PLIST

cat > "$TUNNEL_PLIST" <<PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>${TUNNEL_LABEL}</string>
  <key>ProgramArguments</key>
  <array>
    <string>/bin/zsh</string>
    <string>${RUNTIME_DIR}/scripts/start-fixed-tunnel-daemon.sh</string>
  </array>
  <key>WorkingDirectory</key>
  <string>${RUNTIME_DIR}</string>
  <key>EnvironmentVariables</key>
  <dict>
    <key>PATH</key>
    <string>/Applications/Codex.app/Contents/Resources:/opt/homebrew/bin:/opt/homebrew/opt/node@22/bin:/usr/local/bin:/usr/bin:/bin</string>
    <key>TUNNEL_NAME</key>
    <string>guance-feishu-codex</string>
    <key>LOCAL_URL</key>
    <string>http://127.0.0.1:4319</string>
  </dict>
  <key>RunAtLoad</key>
  <true/>
  <key>KeepAlive</key>
  <true/>
  <key>StandardOutPath</key>
  <string>${LOG_DIR}/guance-cloudflared-tunnel.out.log</string>
  <key>StandardErrorPath</key>
  <string>${LOG_DIR}/guance-cloudflared-tunnel.err.log</string>
</dict>
</plist>
PLIST

launchctl bootout "gui/$(id -u)" "$BRIDGE_PLIST" >/dev/null 2>&1 || true
launchctl bootout "gui/$(id -u)" "$TUNNEL_PLIST" >/dev/null 2>&1 || true

launchctl bootstrap "gui/$(id -u)" "$BRIDGE_PLIST"
launchctl bootstrap "gui/$(id -u)" "$TUNNEL_PLIST"

launchctl enable "gui/$(id -u)/${BRIDGE_LABEL}"
launchctl enable "gui/$(id -u)/${TUNNEL_LABEL}"

launchctl kickstart -k "gui/$(id -u)/${BRIDGE_LABEL}"
launchctl kickstart -k "gui/$(id -u)/${TUNNEL_LABEL}"

echo "Installed and started:"
echo "  - ${BRIDGE_LABEL}"
echo "  - ${TUNNEL_LABEL}"
echo
echo "Runtime directory:"
echo "  - ${RUNTIME_DIR}"
echo
echo "Plists:"
echo "  - ${BRIDGE_PLIST}"
echo "  - ${TUNNEL_PLIST}"
