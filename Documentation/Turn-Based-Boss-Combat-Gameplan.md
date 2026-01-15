# Turn-Based Boss Combat (FF5-Style, 100-Player)

## Goals
- Preserve FF5 ATB feel while scaling to 100 players with fairness, readability, and anti-grief.
- Majority-ready starts; snapshot fairness; instant rescale on exits; spectators watch while queued.
- Infinite scaling: smooth stat curve plus periodic affixes so rewards and EXP stay meaningful forever.

## Party, Lobby, Flow
- Up to 100 players, auto-split into 25 subgroups of 4. UI shows your subgroup; targeting can reach any actor.
- Vote to start: majority ready starts. Protected state while in boss; spectators watch feed (max about 3-turn wait).
- Entrance fee: flat per person. Victory refunds fee; retreat/AFK/DC loses fee. Fee scales by speed mode.
- Flow state machine: lobby -> snapshot (lock stats/gear) -> combat -> results -> return.
- Departures: AFK/DC/retreat immediately kick, remove slot from waves, rescale boss to active count, redistribute target fan-out.

## Combat Model
- ATB: FF5-style gauges; menu pauses your own ATB only; boss follows same rules.
- Slot waves: resolve slot 1 of all subgroups, then 2, 3, 4; missing slots are skips. Boss actions can land whenever its ATB fills.
- Rows and shapes: FF5 rows (front deals/takes more, back deals/takes less). Shapes: single, row, cone, party-wide, multi-target.
- Targeting: global target registry with filters (by subgroup, HP, status); cross-subgroup actions allowed.
- Timeout handling: 10s timer; first timeout -> auto basic Attack plus AFK warning; second timeout -> kick, fee loss, rescale.
- Pre-moves: players can pre-lock actions and targets before ATB fill to reduce menu churn.

## Speed Modes, Fees, Rewards
- Mode picked per run; lower timers add both higher fees and higher rewards, scaling up to the 2s mode.
- Table:
  - 5s: 1x fee, 1x rewards/EXP/rare.
  - 4s: 2x fee, 1.05x rewards, +5% EXP, +5% rare.
  - 3s: 4x fee, 1.10x rewards, +10% EXP, +10% rare.
  - 2s: 10x fee, 1.50x rewards, +25% EXP, +25% rare. Add a 0.5s grace to avoid misclick frustration.

## Actions and Cooldowns
- Menus: Attack styles (OSRS-like physical variants), Abilities (includes defend/flee/summon equivalents), Items (consume turn; FF5 behavior).
- Cooldowns: FF5 spirit: no global GCD; only charge or recast on potent effects (for example, party heal 1-turn recast, resurrect 2-turn recast, strongest buffs 1-2 turns).
- Items: no crafting mid-fight; balance via potency and cost, not lockouts. Optional per-item personal cooldown only if later needed.

## Scaling (Players and Boss Levels)
- Player-count scaling: HP times active_players. Multi-target count scales with active players; per-hit damage capped (about 45% of average player max HP) to avoid one-shots. Boss damage tuned to spread threat, not spike single targets.
- Immediate downscale on exit: reduce HP proportionally; shrink target fan-out for queued boss moves.
- Level curve (defaults, tunable): HP *= 1.08^(level-1); ATK/DEF *= 1.05^(level-1); Speed *= 1.02^(level-1). Clamp Speed to preserve telegraph windows.
- Affixes and phases: every 5 levels add or rotate an affix (elemental resists or vulns, speed ups or downs, reflect windows, add phases, shielding). Encourage varied responses in large groups.
- Caps: floor unavoidable AoE to about 65% average HP; enforce minimum telegraph time even at high speed.

## Rewards, EXP, Pity
- Base rewards and EXP scale linearly with boss level; +0.25% per active player (recomputed on departures).
- Loot parity: same loot for all participants. Pet roll is per-player; everyone can win.
- Rare modifiers: additive. Example: base rare 10% becomes 12.5% with a +25% rare bonus. Pity: session-based per-group, +1% absolute rare chance per boss kill without a rare; resets on rare drop; adjusts with player count changes.

## Status, Resistances, Rows
- Common statuses: haste, slow, stop, silence, blind, poison, bleed, burn, freeze, vulnerability, shields, barriers, reflect, stun, interrupt.
- Rows modify incoming and outgoing damage; back rows reduce physical damage dealt and taken, magic largely unchanged unless the ability says otherwise.

## Algorithms (pseudocode level)
- Instance start:
  - Lock party list; snapshot stats and gear; select speed mode; compute fee and collect; apply initial boss scale (players times level curve).
- ATB loop:
  - For each actor tick: fill ATB by Speed; when full -> enter action select (timer per mode).
  - If timer expires first time -> auto basic Attack plus AFK warn; second time -> kick and rescale boss.
  - Resolve chosen action: validate targets, pay costs, hit or crit, apply damage or effects or status, update logs, set recast or charge.
  - Slot waves: gate execution order for players by slot 1-4 per subgroup; bosses can act whenever ATB fills (not bound to slots).
- Rescale on departure: scale_factor = active_players / previous_active; boss_HP *= scale_factor (not below damage dealt floor); adjust queued multi-target counts.
- Rewards: on victory, refund fee; apply mode multiplier, player-count bonus, pity-adjusted rare rolls; update pity tracker.

## Data Entities (suggested)
- Actor: id, subgroup and slot, stats (HP, MP, Speed, Str, Mag, Def, Res, Acc, Eva, Crit), row, buffs and debuffs, gear loadout snapshot.
- Ability: id, category (attack, ability, item), row or shape, targets, cost, damage formula (physical, magic, hybrid), status effects, cast or charge, recast, elemental tags.
- Item: id, effect, potency, cost or charges, eligibility (always), turn consumption flag.
- Boss: level, base stats, AI script, phases, affix list, multi-target pattern rules, telegraphs, enrage toggles.
- StatusEffect: duration (turn or second), stacking rules, modifiers to stats or ATB or rows or elemental.
- LootTable: entries with base chance, pity interaction, mode multipliers, guaranteed rewards.
- Session: party roster, speed mode, fee, boss instance id, logs, pity tracker (session-scoped, per-group).

## UX and Clarity
- Lobby: join, decline, ready, majority indicator, speed mode selection, fee preview.
- Combat: subgroup panel plus global health and status board; ATB bars; turn preview; telegraphs for boss big moves; clear row indicators; filters for targets.
- Spectators: watch-only feed during protected wait; no controls.
- Logs: concise player-facing log; full event stream for balance and debug; rescale and kick events surfaced.

## Balancing Knobs (future tuning)
- Per-hit cap percent; Speed clamp; affix cadence; telegraph minimums.
- Potion potency and cost; recasts on top-tier heals, resurrects, buffs.
- Pity ramp rate; rare drop table composition; fee multipliers per mode.

## Why It Should Feel Fair and Fun
- Everyone acts on predictable slot cadence; boss can still threaten via ATB but with telegraphs and caps.
- Large raids avoid chaos via global targeting filters, readable telegraphs, and per-hit caps.
- Speed modes reward precision without forcing it; departures do not ruin runs thanks to rescaling.
- Infinite scaling stays interesting via affixes and phases instead of pure stat bloat.
