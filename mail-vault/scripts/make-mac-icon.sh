#!/usr/bin/env bash
set -euo pipefail

# Run on macOS before packaging. Uses built-in macOS tools only.
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SOURCE="$ROOT/assets/mail-vault-icon.png"
ICONSET="$ROOT/build/MailVault.iconset"
OUTPUT="$ROOT/build/icon.icns"

if [[ "$(uname)" != "Darwin" ]]; then
  echo "Mac icon generation needs macOS (sips and iconutil)." >&2
  exit 1
fi

mkdir -p "$ICONSET"
sips -z 16 16     "$SOURCE" --out "$ICONSET/icon_16x16.png" >/dev/null
sips -z 32 32     "$SOURCE" --out "$ICONSET/icon_16x16@2x.png" >/dev/null
sips -z 32 32     "$SOURCE" --out "$ICONSET/icon_32x32.png" >/dev/null
sips -z 64 64     "$SOURCE" --out "$ICONSET/icon_32x32@2x.png" >/dev/null
sips -z 128 128   "$SOURCE" --out "$ICONSET/icon_128x128.png" >/dev/null
sips -z 256 256   "$SOURCE" --out "$ICONSET/icon_128x128@2x.png" >/dev/null
sips -z 256 256   "$SOURCE" --out "$ICONSET/icon_256x256.png" >/dev/null
sips -z 512 512   "$SOURCE" --out "$ICONSET/icon_256x256@2x.png" >/dev/null
sips -z 512 512   "$SOURCE" --out "$ICONSET/icon_512x512.png" >/dev/null
sips -z 1024 1024 "$SOURCE" --out "$ICONSET/icon_512x512@2x.png" >/dev/null
iconutil -c icns "$ICONSET" -o "$OUTPUT"
rm -rf "$ICONSET"
echo "Created $OUTPUT"
