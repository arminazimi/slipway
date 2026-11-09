#!/usr/bin/env bash
# Installs what `npm run check` needs on a bare agent VM: Node 24 and the npm packages.
# Every step skips when its tool is already in place, so a second run changes nothing.
set -euo pipefail

cd "$(dirname "$0")/../.."

have() { command -v "$1" >/dev/null 2>&1; }
log() { printf '==> %s\n' "$*"; }
sudo_cmd() { if [ "$(id -u)" -eq 0 ]; then "$@"; else sudo "$@"; fi; }

node_major() { node -p 'process.versions.node.split(".")[0]' 2>/dev/null || echo 0; }

if [ "$(node_major)" -ge 24 ]; then
  log "Node $(node -v) already installed"
else
  log "Installing Node 24"
  have curl || { sudo_cmd apt-get update -y && sudo_cmd apt-get install -y curl ca-certificates; }
  curl -fsSL https://deb.nodesource.com/setup_24.x | sudo_cmd bash -
  sudo_cmd apt-get install -y nodejs
fi

log "npm ci"
npm ci

log "Done. Run: npm run check"
