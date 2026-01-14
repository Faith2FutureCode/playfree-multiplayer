# @smb3/game-core

Core gameplay logic and shared data structures.

### Turn-based boss combat (FF5-style)
- `createCombatState` to snapshot players, scale the boss by level and active player count, and seed pity/rare tables.
- `tickATB` to fill gauges, open selection windows, and auto-resolve timeouts (auto-attack first, kick/rescale on second).
- `submitActionIntent` to queue a ready actor’s action (with basic cooldown/target guards).
- `resolveNextSlotWave` to execute queued actions in slot order across subgroups (1-4), tick recasts, and expire statuses.
- `handleDeparture` to rescale the boss when a player leaves mid-instance.
- `computeRewards`, `applyKillPity`, `clearPity` to keep loot parity, pity ramps, and mode bonuses consistent.

Types and constants live under `src/combat` (abilities, statuses, slots, speed modes, level curves, caps).

Damage + modifiers
- Row modifiers applied to physical/hybrid outgoing/incoming (front hits harder/takes more, back hits softer/takes less); magic ignores by default.
- Status modifiers aggregate into effective stats for speed, attack, defense, etc., before ATB fill and damage calc.

### Dev
- `pnpm --filter @smb3/game-core build` to emit `dist/`.
- `pnpm --filter @smb3/game-core test` to run Vitest suite (`src/combat/engine.test.ts`) for ATB, timeouts, rescale, recasts/status expiry, damage caps, and rewards/pity math.

### Browser demo
- Static JS builds live under `packages/game-core/dist/` for direct import in the site.
- `combat-demo.js` (root, module script) imports the dist build and exposes `window.combatDemo` with helpers: `tick()`, `intent(actorId, abilityId, targets)`, `wave()`, `rewards()`, `pity()/clear()`, and `reset(mode)`.
- The site includes a floating “Combat Demo” toggle (bottom-right). Open it to run the lobby -> ready/vote -> boss selection -> combat -> results flow without affecting gameplay.
