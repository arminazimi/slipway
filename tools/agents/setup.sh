#!/usr/bin/env bash
# Installs what `npm run check` needs on a bare agent VM: Node 22, the Ruby in
# .ruby-version, the Pages gem, npm packages, and Playwright browsers.
# Every step skips when its tool is already in place, so a second run changes nothing.
set -euo pipefail

cd "$(dirname "$0")/../.."

have() { command -v "$1" >/dev/null 2>&1; }
log() { printf '==> %s\n' "$*"; }
sudo_cmd() { if [ "$(id -u)" -eq 0 ]; then "$@"; else sudo "$@"; fi; }

node_major() { node -p 'process.versions.node.split(".")[0]' 2>/dev/null || echo 0; }

if [ "$(node_major)" -ge 22 ]; then
  log "Node $(node -v) already installed"
else
  log "Installing Node 22"
  have curl || { sudo_cmd apt-get update -y && sudo_cmd apt-get install -y curl ca-certificates; }
  curl -fsSL https://deb.nodesource.com/setup_22.x | sudo_cmd bash -
  sudo_cmd apt-get install -y nodejs
fi

want_ruby="$(tr -d '[:space:]' < .ruby-version)"
if have ruby && [ "$(ruby -e 'print RUBY_VERSION')" = "$want_ruby" ]; then
  log "Ruby $want_ruby already installed"
else
  log "Installing Ruby $want_ruby"
  if ! have rbenv && ! have ruby-build; then
    sudo_cmd apt-get update -y
    sudo_cmd apt-get install -y git build-essential libssl-dev libyaml-dev zlib1g-dev libffi-dev libreadline-dev
    [ -d "$HOME/.rbenv" ] || git clone --depth 1 https://github.com/rbenv/rbenv.git "$HOME/.rbenv"
    [ -d "$HOME/.rbenv/plugins/ruby-build" ] || git clone --depth 1 https://github.com/rbenv/ruby-build.git "$HOME/.rbenv/plugins/ruby-build"
  fi
  export PATH="$HOME/.rbenv/bin:$HOME/.rbenv/shims:$PATH"
  rbenv install --skip-existing "$want_ruby"
  rbenv global "$want_ruby"
  rbenv rehash
fi
export PATH="$HOME/.rbenv/bin:$HOME/.rbenv/shims:$PATH"

have bundle || gem install bundler --no-document
log "bundle install"
bundle check >/dev/null 2>&1 || bundle install

log "npm ci"
npm ci

log "Playwright browsers"
npx playwright install --with-deps

log "Done. Run: SLIPWAY_REQUIRE_BUILD=1 npm run check"
