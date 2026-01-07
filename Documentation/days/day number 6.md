Day 6
Today we focused on the tileset workflow and editor tools.

- Added a tileset upload field and a full-screen preview overlay above the game canvas.
- Matched the preview sizing/scaling to the game canvas so it stays aligned on resize.
- Built a sidebar tool panel with grid controls (X, Y, Width, Height) and padding (Pad X/Y).
- Added grid overlay rendering on top of the tileset with zoom and middle-click pan.
- Fixed grid alignment to use native tileset pixels (e.g., 500x500) so 16x16 + padding lines up.
- Styled the tools to fit the existing theme and made inputs readable (3-digit width).
- Added a Remove BG color input and button stub for future color keying.
- Removed the temporary grid reference button after testing the concept.

Next up: slicing the tileset into a new palette and wiring the BG color removal.
