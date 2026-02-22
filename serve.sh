#!/usr/bin/env bash
set -euo pipefail

PORT="${1:-5173}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

exec env PORT="$PORT" npm start
