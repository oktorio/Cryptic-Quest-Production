#!/usr/bin/env sh
set -eu
cd "$(dirname "$0")"
PORT=8317
printf 'Serving Cryptic Quest on http://127.0.0.1:%s\n' "$PORT"
if command -v python3 >/dev/null 2>&1; then
  python3 -m http.server "$PORT"
else
  python -m http.server "$PORT"
fi
