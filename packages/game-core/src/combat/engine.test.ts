import { describe, expect, it } from "vitest";
import {
  BASIC_ATTACK_ID,
  PER_HIT_CAP_PERCENT,
  SPEED_MODES,
} from "./constants.js";
import {
  applyKillPity,
  clearPity,
  createCombatState,
  computeRewards,
  handleDeparture,
  resolveNextSlotWave,
  submitActionIntent,
  tickATB,
} from "./engine.js";
import { AbilityMap, ActorSnapshot } from "./types.js";

const players: ActorSnapshot[] = [
  {
    id: "p1",
    name: "Hero",
    subgroup: 1,
    slot: 1,
    row: "front",
    stats: {
      maxHp: 100,
      hp: 100,
      maxMp: 20,
      mp: 20,
      speed: 100,
      str: 20,
      mag: 5,
      def: 10,
      res: 8,
      acc: 10,
      eva: 5,
      crit: 5,
    },
  },
];

const boss = {
  id: "boss",
  name: "Test Boss",
  baseStats: {
    maxHp: 200,
    hp: 200,
    maxMp: 0,
    mp: 0,
    speed: 100,
    str: 15,
    mag: 10,
    def: 12,
    res: 10,
    acc: 10,
    eva: 5,
    crit: 5,
  },
  affixes: [],
};

const abilities: AbilityMap = {
  heavy: {
    id: "heavy",
    name: "Heavy Strike",
    category: "attack",
    shape: "single",
    damageType: "physical",
    potency: 3,
    recastTurns: 1,
  },
};

describe("combat engine", () => {
  it("fills ATB to ready and opens selection window", () => {
    const state = createCombatState({
      speedModeId: "5s",
      bossLevel: 1,
      baseFee: 10,
      rareBase: 0.1,
      pityRampPerKill: 0.01,
      players,
      boss,
      abilities,
    });

    const now = Date.now();
    tickATB(state, 1000, now);
    expect(state.players[0].ready).toBe(false);

    tickATB(state, 5000, now + 5000);
    expect(state.players[0].ready).toBe(true);
    expect(state.players[0].selecting).toBeTruthy();
  });

  it("auto basic on first timeout, kick and rescale on second", () => {
    const state = createCombatState({
      speedModeId: "5s",
      bossLevel: 1,
      baseFee: 10,
      rareBase: 0.1,
      pityRampPerKill: 0.01,
      players,
      boss,
      abilities,
    });
    const start = Date.now();

    // Fill and force first timeout (auto basic)
    state.players[0].atb = 1;
    state.players[0].ready = true;
    state.players[0].selecting = { startedAt: start, deadline: start };
    tickATB(state, 0, start);
    expect(state.pendingActions.length).toBe(1);
    expect(state.pendingActions[0].abilityId).toBe(BASIC_ATTACK_ID);
    expect(state.players[0].timeoutStrikes).toBe(1);

    // Second timeout -> kick + rescale
    state.players[0].selecting = { startedAt: start, deadline: start };
    tickATB(state, 0, start + 1);
    expect(state.players[0].kicked).toBe(true);
    expect(state.activePlayers).toBe(0);
    const rescale = state.log.find((l) => l.type === "rescale");
    expect(rescale).toBeTruthy();
  });

  it("validates intent, applies recast, and resolves in slot order", () => {
    const state = createCombatState({
      speedModeId: "5s",
      bossLevel: 1,
      baseFee: 10,
      rareBase: 0.1,
      pityRampPerKill: 0.01,
      players,
      boss,
      abilities,
    });
    const actor = state.players[0];
    actor.atb = 1;
    actor.ready = true;
    actor.selecting = { startedAt: 0, deadline: 999999 };

    const result = submitActionIntent(state, {
      actorId: actor.id,
      abilityId: "heavy",
      targetIds: [state.boss.id],
      slot: actor.slot,
      subgroup: actor.subgroup,
    });
    expect(result.accepted).toBe(true);
    expect(actor.recastTurns["heavy"]).toBe(1);

    resolveNextSlotWave(state);
    expect(state.boss.stats.hp).toBeLessThan(state.boss.stats.maxHp);
  });

  it("applies row modifiers and hit caps", () => {
    const state = createCombatState({
      speedModeId: "5s",
      bossLevel: 1,
      baseFee: 10,
      rareBase: 0.1,
      pityRampPerKill: 0.01,
      players,
      boss,
      abilities,
    });
    const actor = state.players[0];
    actor.atb = 1;
    actor.ready = true;
    actor.selecting = { startedAt: 0, deadline: 999999 };

    submitActionIntent(state, {
      actorId: actor.id,
      abilityId: "heavy",
      targetIds: [state.boss.id],
      slot: actor.slot,
      subgroup: actor.subgroup,
    });
    resolveNextSlotWave(state);
    const dmg = state.log.find((l) => l.type === "damage" && l.targetId === state.boss.id);
    expect(dmg).toBeTruthy();
    const cap = Math.ceil(state.boss.stats.maxHp * PER_HIT_CAP_PERCENT);
    expect((dmg as any).amount).toBeLessThanOrEqual(cap);
  });

  it("tracks pity and reward math", () => {
    const state = createCombatState({
      speedModeId: "2s",
      bossLevel: 1,
      baseFee: 10,
      rareBase: 0.1,
      pityRampPerKill: 0.05,
      players,
      boss,
      abilities,
    });
    applyKillPity(state);
    applyKillPity(state);
    const rewards = computeRewards(state);
    expect(rewards.rareChance).toBeGreaterThan(0.1);
    clearPity(state);
    const rewards2 = computeRewards(state);
    expect(rewards2.pityApplied).toBe(0);
  });

  it("resets boss scale on player departure", () => {
    const twoPlayers: ActorSnapshot[] = [
      ...players,
      {
        ...players[0],
        id: "p2",
        name: "Hero2",
        subgroup: 1,
        slot: 2,
      },
    ];
    const state = createCombatState({
      speedModeId: "5s",
      bossLevel: 1,
      baseFee: 10,
      rareBase: 0.1,
      pityRampPerKill: 0.01,
      players: twoPlayers,
      boss,
      abilities,
    });
    const initialMax = state.boss.stats.maxHp;
    handleDeparture(state, "p2");
    expect(state.boss.stats.maxHp).toBeLessThan(initialMax);
    const log = state.log.find((l) => l.type === "rescale");
    expect(log).toBeTruthy();
  });
});
