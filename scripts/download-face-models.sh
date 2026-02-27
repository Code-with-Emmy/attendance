#!/usr/bin/env bash
set -euo pipefail

OUT_DIR="public/models"
BASE_URL_PRIMARY="${FACE_MODELS_BASE_URL:-https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights}"
BASE_URL_FALLBACK="https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js@master/weights"

FILES=(
  "tiny_face_detector_model-weights_manifest.json"
  "tiny_face_detector_model-shard1"
  "face_landmark_68_model-weights_manifest.json"
  "face_landmark_68_model-shard1"
  "face_recognition_model-weights_manifest.json"
  "face_recognition_model-shard1"
  "face_recognition_model-shard2"
)

mkdir -p "$OUT_DIR"

download_file() {
  local src="$1"
  local dest="$2"

  curl \
    --fail \
    --silent \
    --show-error \
    --location \
    --retry 6 \
    --retry-all-errors \
    --retry-delay 2 \
    --connect-timeout 10 \
    --max-time 180 \
    -C - \
    "$src" \
    -o "$dest"
}

for file in "${FILES[@]}"; do
  url_primary="$BASE_URL_PRIMARY/$file"
  url_fallback="$BASE_URL_FALLBACK/$file"
  dest="$OUT_DIR/$file"

  if [[ -s "$dest" ]]; then
    echo "Skipping $file (already exists)"
    continue
  fi

  echo "Downloading $file"
  if ! download_file "$url_primary" "$dest"; then
    echo "Primary failed, trying fallback mirror..."
    if ! download_file "$url_fallback" "$dest"; then
      echo
      echo "Failed to download $file from both mirrors."
      echo "Manual fallback:"
      echo "1) Download weights from face-api.js repo (weights folder)."
      echo "2) Copy files into $OUT_DIR."
      echo
      exit 1
    fi
  fi
done

echo "Done. Downloaded ${#FILES[@]} face-api model files to $OUT_DIR"
