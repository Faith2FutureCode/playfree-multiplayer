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


Parallax stack: Move multiple background layers at different speeds tied to camera/velocity (far space slow, near clouds faster). Add slight vertical parallax on jumps/falls.
Perspective shift: Subpixel “camera lean” based on acceleration (ease-in/out), nudging layers horizontally/vertically to give depth without jitter.
Slow procedural drift: Run a very slow offset on motifs (cloud bands, nebula noise, god rays) independent of player to keep it alive when standing still.
Screen-space waves: Apply a subtle sine warp or scale pulse to distant layers (e.g., horizon heat shimmer, underwater caustics) with very low amplitude.
Particle trails: Add a sparse, slow parallax particle layer (dust, pollen, fireflies) that scrolls and respawns offscreen.
Depth-of-field hint: Slight alpha fade on distant layers; brighten/contrast near layers when moving fast to fake focus.
Weather passes: Layer in moving rain/snow/leaf sprites with wind that varies per biome and responds to player speed/direction.














adapt git cmds, formatted for cmd line, to this but write custom description in one message:
git add index.html
git commit -m "Copy /results summary to clipboard"
git push origin main
vercel --prod