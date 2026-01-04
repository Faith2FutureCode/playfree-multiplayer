Core player form system: add powerUpForm enum (small/super/fire/raccoon/tanooki/frog/hammer), downgrade rules (hit → super → small → death), save/load current form/timers, update damage/brick-breaking logic.
Power-up acquisition: hook world pickups and inventory use to set pending form flags (using existing powerup metadata/dispatcher), apply on level start, play SFX/message; clear pending on death/respawn.
Fire Flower: add fireball projectile (arc/bounce, hit rules), throw input/cooldown, animations/SFX.
Super Leaf (Raccoon): tail whip attack hitbox/timing, slow-fall glide, P-speed flight meter + takeoff + limited flight timer, animations/SFX.
Tanooki Suit: inherit raccoon abilities + statue toggle (invuln window, duration/cooldown), statue sprite/animation, SFX.
Frog Suit: water movement buffs, land movement debuffs, swim animations, physics tuning.
Hammer Suit: lobbed hammer projectile (≈20° upward launch, gravity arc, ~6 tiles range; fast start then slower fall), enemy/block hit rules (kills most non-boss enemies, smashes bricks/ice; blocked by solid tiles), shell shield vs fireballs (frontal crouch blocks fireballs/most projectiles; reflect fireball on contact), throw input/cooldown (same button as fireball; 18f reuse lockout; max 2 active hammers), animations/SFX (throw, crouch-shell, hit impacts, pickup/use).
Starman: invincibility timer, palette flash, enemy auto-kill, music hook, timer UI.
HUD/UX: show current form icon; star timer indicator; flight meter for raccoon/tanooki; inventory overlay uses real powerup icons; feedback for use/invalid/empty.
Map/overworld items: hammer/anchor/music box map effects already tracked—wire into overworld map logic and persist; confirm target validation UX.
Tests/playtests: unit tests for pending apply/clear, form transitions, damage downgrades, projectile/tail/hammer hits; manual matrix for each form’s moveset, timers, and inventory use.
