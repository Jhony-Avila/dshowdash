#!/bin/bash
# Build Panel UI CSS - Concatena módulos na ordem correta
# @version 1.0.0
# @usage bash build-panel-css.sh
# @output _panel-ui.css

DIR="$(cd "$(dirname "$0")" && pwd)"
MODULES_DIR="$DIR/panel-ui"
OUTPUT="$DIR/_panel-ui.css"

echo "Building _panel-ui.css..."

cat "$MODULES_DIR/_variables.css" \
    "$MODULES_DIR/_base.css" \
    "$MODULES_DIR/_components.css" \
    "$MODULES_DIR/_widgets.css" \
    "$MODULES_DIR/_command-palette.css" \
    "$MODULES_DIR/_states.css" \
    "$MODULES_DIR/_tooltips.css" \
    "$MODULES_DIR/_icons-tabs.css" \
    "$MODULES_DIR/_animations.css" \
    "$MODULES_DIR/_visual-polish.css" \
    "$MODULES_DIR/_interactions.css" \
    "$MODULES_DIR/_features.css" \
    > "$OUTPUT"

chown www-data:www-data "$OUTPUT"

LINES=$(wc -l < "$OUTPUT")
MODULES=$(ls "$MODULES_DIR"/_*.css | wc -l)
echo "Done: $LINES lines from $MODULES modules -> $OUTPUT"
