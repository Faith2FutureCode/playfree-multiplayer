Data: add sparse labelMap keyed by tx,ty (e.g., {"10,5": "reset"}) alongside the existing tile grid; helper getters/setters to read/write labels.
UI: in the editor gutter, show a “Label” input when a tile is selected. Typing updates the selected cell’s label; empty clears it.
Render (editor-only): draw labels on selected/hovered/labeled tiles—tiny pixel font with dark outline; small badge (e.g., “T”) in a corner for non-selected labeled tiles to show they have text.
Clipboard: include label data in copy/cut/paste so labels move with tiles.
Save/Load (optional): ensure labels persist if you serialize levels (if you have an export/import path).
UX polish: add toggle to hide/show labels and a quick-jump dropdown to labeled tiles (optional).