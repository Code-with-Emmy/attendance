#!/usr/bin/env bash

set -euo pipefail

KIOSK_URL="${KIOSK_URL:-http://localhost:3000}"
CHROME_APP="${CHROME_APP:-Google Chrome}"

if ! open -Ra "$CHROME_APP" >/dev/null 2>&1; then
  echo "Chrome app '$CHROME_APP' was not found."
  echo "Set CHROME_APP to your browser name if needed."
  echo 'Example: CHROME_APP="Google Chrome Canary" npm run kiosk:chrome'
  exit 1
fi

open -na "$CHROME_APP" --args \
  --autoplay-policy=no-user-gesture-required \
  --app="$KIOSK_URL"
