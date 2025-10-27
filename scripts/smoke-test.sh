#!/usr/bin/env bash
set -euo pipefail

# Simple smoke test for the mtg-catalog app.
# Exits with non-zero on any failure.

HOST=${1:-http://localhost:3300}

echo "Running smoke tests against $HOST"

check_http() {
  local url=$1
  local expected=${2:-200}
  echo -n "Checking $url ... "
  status=$(curl -s -o /dev/null -w "%{http_code}" "$url") || status=000
  if [[ "$status" != "$expected" && "$expected" != "any" ]]; then
    echo "FAILED (status $status, expected $expected)"
    return 1
  fi
  echo "OK ($status)"
}

# 1) status endpoint should exist
check_http "$HOST/status" 200

# 2) app.js static asset
check_http "$HOST/app.js" 200

# 3) /cards should respond (200) — DB must be available for this to pass.
check_http "$HOST/cards" 200

echo "All smoke tests passed."
