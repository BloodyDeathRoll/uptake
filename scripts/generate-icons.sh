#!/bin/bash
# Generate simple placeholder PWA icons using ImageMagick (if available)
# Or create SVG placeholders

ICONS_DIR="$(dirname "$0")/../public/icons"
mkdir -p "$ICONS_DIR"

# Try ImageMagick first
if command -v convert &> /dev/null; then
  convert -size 192x192 xc:'#10b981' \
    -fill white -pointsize 72 -gravity center \
    -annotate 0 "U" \
    "$ICONS_DIR/icon-192.png"

  convert -size 512x512 xc:'#10b981' \
    -fill white -pointsize 192 -gravity center \
    -annotate 0 "U" \
    "$ICONS_DIR/icon-512.png"

  echo "Icons generated with ImageMagick"
else
  # Create SVG fallbacks
  cat > "$ICONS_DIR/icon-192.svg" << 'SVG'
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 192 192">
  <rect width="192" height="192" rx="36" fill="#10b981"/>
  <text x="96" y="130" font-family="system-ui,sans-serif" font-size="96" font-weight="bold" fill="white" text-anchor="middle">U</text>
</svg>
SVG

  cat > "$ICONS_DIR/icon-512.svg" << 'SVG'
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="96" fill="#10b981"/>
  <text x="256" y="346" font-family="system-ui,sans-serif" font-size="256" font-weight="bold" fill="white" text-anchor="middle">U</text>
</svg>
SVG

  echo "SVG placeholders created (run with ImageMagick for PNG)"
fi
