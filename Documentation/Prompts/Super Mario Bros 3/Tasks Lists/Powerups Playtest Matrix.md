Manual playtest matrix (update as mechanics land)

Forms to verify
- Small → Super → Fire → Raccoon → Tanooki → Frog → Hammer
- Transitions: damage downgrades, death after small; pickups/inventory equip set form correctly.

Movement/abilities by form
- Small/Super: baseline accel/jump/friction.
- Fire: fireball throw on C, cooldown, projectile hits goons.
- Raccoon: tail on X (hit goons), glide holding Z, P-speed flight timer on jump, hammer/brick unaffected.
- Tanooki: inherits raccoon; statue on V toggles, blocks actions/motion.
- Frog: land slow accel/decel; water gravity cap; jump in water is swim impulse; glide/flight disabled in water.
- Hammer: hammer throw on C (2 max), arc ~6 tiles, breaks bricks/ice, kills goons.

Combat/proj interactions
- Stomp kills goons; damage knocks down forms.
- Tail hits: goons die; cooldown respected.
- Fireball hits: goons die; stop on walls.
- Hammer hits: goons die; bricks/ice break; stop on walls.
- Statue: invuln window while active (check damage ignored).

HUD/UX
- HUD shows form tag, star timer (invuln), flight timer for raccoon/tanooki, P-meter fill.
- Inventory icons: 🔥/🍂/🔨/🐸; feedback text for use/empty/invalid.

Pending/map items
- Map hammer/anchor/music box require target; success/invalid messages and pending flags persist via save.

Timers/persistence
- Form, timers (invuln, fire/hammer/tail, flight, statue) save/load across restart.

Suggested runs
- Equip each form via inventory, run/jump/attack.
- Water segment to verify frog swim vs land debuff.
- Hammer toss into brick/ice wall and into goon.
- Flight: build P-speed, leaf/tanooki glide/flight and timer drain.
- Statue toggle timing and invuln. 
