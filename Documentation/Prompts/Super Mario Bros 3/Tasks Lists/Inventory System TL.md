Capture spec: document item set, 28-slot grid, no stacking, overworld-only usage, pending effects (suit, P-Wing, cloud, star, anchor/music box/hammer).
Data types: add ItemType enum + metadata table (name, icon, usage context, effect handler id).
State shape: fixed 28-slot array, cursor index, flags for pending effects (suit, flight, invincibility, cloud skip, airship lock, hammer bros sleep), map rock state hooks.
Persistence schema: define save/load format for slots + flags + map changes; stub serialize/deserialize functions.
Input map: bind open/close inventory on overworld, d-pad/arrow navigation with wrap, confirm/use, cancel.
UI scaffold: render 7x4 grid with icons/counts, cursor highlight, tooltip/name + “Use” hint; block overworld input while open.
Navigation logic: cursor move with wrap, ignore empty slots on use, debounce confirm.
Add/remove helpers: addItem, removeAt, useAt returning ok/full/empty codes; emit feedback on failures.
Effect dispatcher: route useAt to per-item handlers.
Power-up handlers: set pending suit (mushroom/fire/leaf/tanooki/frog/hammer); consume slot.
One-time level flags: P-Wing (flight next level), Starman (invincibility on start), Cloud (skip once), clear after level enter.
Map/world items: Hammer (break selected rock tile), Music Box (sleep hammer bros N turns), Anchor (lock airship once); validate targets and consume.
State transitions: apply pending flags when entering level; close inventory before level start; keep hidden in-level.
Persistence wiring: hook inventory/flags/map state into save/load pipeline; verify reload restores icons/effects.
Feedback polish: add SFX for open/close/use, message for full inventory/no item, small open/close animation.
Tests/playchecks: add unit tests for add/remove/use constraints and per-item effects; manual playtest matrix (full inventory, empty use, wrap nav, P-Wing/cloud/star/anchor flows, hammer invalid target).