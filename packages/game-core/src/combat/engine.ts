import {
  BASIC_ATTACK_ID,
  DEFAULT_ATB_SPEED,
  DEFAULT_TIMEOUT_MS,
  LEVEL_CURVE,
  MAX_SLOT,
  PER_HIT_CAP_PERCENT,
  ROW_INCOMING_PHYSICAL,
  ROW_OUTGOING_PHYSICAL,
  SPEED_MODES,
} from "./constants.js";
import {
  Ability,
  AbilityMap,
  ActorSnapshot,
  ActorState,
  BossState,
  BossTemplate,
  CombatConfig,
  CombatLogEntry,
  CombatState,
  IntentResult,
  QueuedAction,
  RewardSummary,
  SpeedModeId,
  StatusInstance,
} from "./types.js";

export interface CombatInit {
  sessionId?: string;
  speedModeId: SpeedModeId;
  bossLevel: number;
  baseFee: number;
  rareBase: number;
  pityRampPerKill: number;
  seed?: string;
  players: ActorSnapshot[];
  boss: BossTemplate;
  abilities: AbilityMap;
}

function cloneAttributes(stats: ActorSnapshot["stats"]): ActorSnapshot["stats"] {
  return { ...stats };
}

function scaleAttribute(base: number, factor: number, level: number): number {
  return Math.round(base * Math.pow(factor, level - 1));
}

function makeActorState(snapshot: ActorSnapshot): ActorState {
  return {
    ...snapshot,
    atb: 0,
    ready: false,
    dead: false,
    kicked: false,
    timeoutStrikes: 0,
    recastTurns: {},
    statuses: [],
  };
}

function scaleBoss(template: BossTemplate, level: number, activePlayers: number): BossState {
  const base = cloneAttributes(template.baseStats);
  const scaledHp = scaleAttribute(base.maxHp, LEVEL_CURVE.hp, level) * activePlayers;
  const scaledStr = scaleAttribute(base.str, LEVEL_CURVE.atk, level);
  const scaledMag = scaleAttribute(base.mag, LEVEL_CURVE.atk, level);
  const scaledDef = scaleAttribute(base.def, LEVEL_CURVE.def, level);
  const scaledRes = scaleAttribute(base.res, LEVEL_CURVE.def, level);
  const scaledSpeed = scaleAttribute(base.speed, LEVEL_CURVE.speed, level);

  const stats = {
    ...base,
    maxHp: scaledHp,
    hp: scaledHp,
    str: scaledStr,
    mag: scaledMag,
    def: scaledDef,
    res: scaledRes,
    speed: scaledSpeed,
  };

  return {
    ...makeActorState({
      id: template.id,
      name: template.name,
      subgroup: 0,
      slot: 0,
      row: "front",
      stats,
    }),
    level,
    affixes: template.affixes || [],
    phase: 1,
  };
}

function randomId(): string {
  return `session_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function createCombatState(init: CombatInit): CombatState {
  const speedMode = SPEED_MODES[init.speedModeId];
  const sessionId = init.sessionId || randomId();
  const config: CombatConfig = {
    sessionId,
    speedMode,
    bossLevel: init.bossLevel,
    baseFee: init.baseFee,
    rareBase: init.rareBase,
    pityRampPerKill: init.pityRampPerKill,
    seed: init.seed || sessionId,
  };

  const players = init.players.map(makeActorState);
  const boss = scaleBoss(init.boss, init.bossLevel, players.length);

  const abilities: AbilityMap = {
    [BASIC_ATTACK_ID]: {
      id: BASIC_ATTACK_ID,
      name: "Basic Attack",
      category: "attack",
      shape: "single",
      damageType: "physical",
      potency: 1,
    },
    ...init.abilities,
  };

  return {
    config,
    boss,
    players,
    activePlayers: players.length,
    slotCursor: 1,
    pendingActions: [],
    pity: 0,
    abilities,
    log: [],
  };
}

function selectionWindowEndsAt(speedWindowMs: number, graceMs: number, now: number): number {
  return now + speedWindowMs + graceMs;
}

function isActorSelectable(actor: ActorState): boolean {
  return !actor.dead && !actor.kicked;
}

function queueActionForActor(
  state: CombatState,
  actor: ActorState,
  intent: { abilityId: string; targetIds: string[] }
): void {
  state.pendingActions.push({
    actorId: actor.id,
    abilityId: intent.abilityId,
    targetIds: intent.targetIds,
    slot: actor.slot,
    subgroup: actor.subgroup,
  });
  actor.atb = 0;
  actor.ready = false;
  actor.selecting = undefined;
}

function effectiveStats(actor: ActorState): ActorState["stats"] {
  const merged = { ...actor.stats };
  for (const status of actor.statuses) {
    const mods = status.effect.modifiers;
    if (!mods) continue;
    for (const [key, value] of Object.entries(mods)) {
      const statKey = key as keyof ActorState["stats"];
      const next = (merged[statKey] as number) + (value as number);
      merged[statKey] = Math.max(0, next) as (typeof merged)[keyof typeof merged];
    }
  }
  return merged;
}

function handleTimeout(state: CombatState, actor: ActorState, now: number): void {
  actor.timeoutStrikes += 1;
  state.log.push({ type: "timeout", actorId: actor.id, strikes: actor.timeoutStrikes });

  if (actor.timeoutStrikes === 1) {
    queueActionForActor(state, actor, { abilityId: BASIC_ATTACK_ID, targetIds: [state.boss.id] });
    return;
  }

  actor.kicked = true;
  const prevActive = state.activePlayers;
  const nextActive = Math.max(0, prevActive - 1);
  state.activePlayers = nextActive;
  state.log.push({ type: "kick", actorId: actor.id });
  rescaleBossForActivePlayers(state, prevActive, nextActive);
}

export function tickATB(state: CombatState, deltaMs: number, now: number): CombatLogEntry[] {
  const startLogLen = state.log.length;
  const actors: ActorState[] = [...state.players, state.boss];
  for (const actor of actors) {
    if (!isActorSelectable(actor)) continue;

    const stats = effectiveStats(actor);
    const fill = (stats.speed / DEFAULT_ATB_SPEED) * (deltaMs / 1000);
    actor.atb = Math.min(1, actor.atb + fill);

    if (actor.atb >= 1 && !actor.ready && !actor.selecting) {
      actor.ready = true;
      const deadline = selectionWindowEndsAt(
        state.config.speedMode.actionWindowMs || DEFAULT_TIMEOUT_MS,
        state.config.speedMode.graceMs,
        now
      );
      actor.selecting = { startedAt: now, deadline };
    }

    if (actor.selecting && now >= actor.selecting.deadline) {
      handleTimeout(state, actor, now);
    }
  }

  return state.log.slice(startLogLen);
}

function findActor(state: CombatState, id: string): ActorState | undefined {
  if (id === state.boss.id) return state.boss;
  return state.players.find((p) => p.id === id);
}

function computeDamage(ability: Ability, source: ActorState, target: ActorState): number {
  const potency = ability.potency ?? 1;
  const damageType = ability.damageType || "physical";
  const sourceStats = effectiveStats(source);
  const targetStats = effectiveStats(target);
  const attackStat =
    damageType === "magic"
      ? sourceStats.mag
      : damageType === "hybrid"
      ? (sourceStats.str + sourceStats.mag) / 2
      : sourceStats.str;
  const defenseStat = damageType === "magic" ? targetStats.res : targetStats.def;
  const raw = Math.max(1, Math.round(potency * (attackStat / Math.max(1, defenseStat))));

  const outgoingRow =
    damageType === "magic" || ability.ignoresRowModifiers ? 1 : ROW_OUTGOING_PHYSICAL[source.row] ?? 1;
  const incomingRow =
    damageType === "magic" || ability.ignoresRowModifiers ? 1 : ROW_INCOMING_PHYSICAL[target.row] ?? 1;

  const total = Math.round(raw * outgoingRow * incomingRow);
  const cap = Math.ceil(target.stats.maxHp * PER_HIT_CAP_PERCENT);
  return Math.min(Math.max(1, total), cap);
}

function applyStatuses(target: ActorState, statuses: StatusInstance[]): CombatLogEntry[] {
  const logs: CombatLogEntry[] = [];
  for (const status of statuses) {
    target.statuses.push(status);
    logs.push({ type: "status", targetId: target.id, statusId: status.effect.id, apply: true });
  }
  return logs;
}

function validateTargets(state: CombatState, actor: ActorState, intent: QueuedAction): IntentResult {
  const ability = state.abilities[intent.abilityId];
  if (!ability) return { accepted: false, reason: "ability_not_found" };
  const targets: ActorState[] = [];
  for (const id of intent.targetIds) {
    const t = findActor(state, id);
    if (!t || t.kicked) return { accepted: false, reason: "invalid_target" };
    targets.push(t);
  }
  if (targets.length === 0) return { accepted: false, reason: "target_required" };
  if (ability.shape === "single" && targets.length !== 1) return { accepted: false, reason: "target_count" };
  if (ability.targetLimit && targets.length > ability.targetLimit) return { accepted: false, reason: "target_limit" };
  if (ability.shape === "row") {
    const row = targets[0]?.row;
    const sameRow = targets.every((t) => t.row === row);
    if (!sameRow) return { accepted: false, reason: "row_mismatch" };
  }
  return { accepted: true };
}

function resolveAction(state: CombatState, action: QueuedAction): CombatLogEntry[] {
  const logs: CombatLogEntry[] = [];
  const actor = findActor(state, action.actorId);
  const ability = state.abilities[action.abilityId] || state.abilities[BASIC_ATTACK_ID];
  if (!actor || !ability) return logs;

  logs.push({ type: "action", actorId: actor.id, abilityId: ability.id, targets: action.targetIds });

  for (const targetId of action.targetIds) {
    const target = findActor(state, targetId);
    if (!target || target.dead) continue;
    const dmg = computeDamage(ability, actor, target);
    target.stats.hp = Math.max(0, target.stats.hp - dmg);
    logs.push({ type: "damage", sourceId: actor.id, targetId, amount: dmg, abilityId: ability.id });
    if (target.stats.hp === 0) {
      target.dead = true;
    }

    if (ability.statusEffects && ability.statusEffects.length > 0) {
      const statusInstances: StatusInstance[] = ability.statusEffects.map((effect) => ({
        effect,
        remainingTurns: effect.durationTurns,
        sourceId: actor.id,
      }));
      logs.push(...applyStatuses(target, statusInstances));
    }
  }

  actor.atb = 0;
  actor.ready = false;
  actor.selecting = undefined;
  return logs;
}

function decrementRecasts(actor: ActorState): void {
  for (const key of Object.keys(actor.recastTurns)) {
    actor.recastTurns[key] = Math.max(0, actor.recastTurns[key] - 1);
    if (actor.recastTurns[key] === 0) delete actor.recastTurns[key];
  }
}

function tickStatuses(actor: ActorState, log: CombatLogEntry[]): void {
  const remaining: StatusInstance[] = [];
  for (const status of actor.statuses) {
    status.remainingTurns -= 1;
    if (status.remainingTurns > 0) {
      remaining.push(status);
      continue;
    }
    log.push({ type: "status", targetId: actor.id, statusId: status.effect.id, apply: false });
  }
  actor.statuses = remaining;
}

export function resolveNextSlotWave(state: CombatState): CombatLogEntry[] {
  const logs: CombatLogEntry[] = [];

  for (let i = 0; i < MAX_SLOT; i++) {
    const slot = state.slotCursor;
    const wave = state.pendingActions.filter((a) => a.slot === slot);
    if (wave.length === 0) {
      state.slotCursor = slot % MAX_SLOT + 1;
      continue;
    }

    wave.sort((a, b) => a.subgroup - b.subgroup);
    for (const action of wave) {
      logs.push(...resolveAction(state, action));
    }

    for (const actor of [...state.players, state.boss]) {
      if (!isActorSelectable(actor)) continue;
      decrementRecasts(actor);
      tickStatuses(actor, logs);
    }

    state.pendingActions = state.pendingActions.filter((a) => a.slot !== slot);
    state.slotCursor = slot % MAX_SLOT + 1;
    break;
  }

  state.log.push(...logs);
  return logs;
}

function rescaleBossForActivePlayers(state: CombatState, prevActive: number, nextActive: number): void {
  const safePrev = Math.max(1, prevActive);
  const safeNext = Math.max(1, nextActive);
  const scale = safeNext / safePrev;
  const prevHp = state.boss.stats.hp;
  const prevMax = state.boss.stats.maxHp;
  state.boss.stats.maxHp = Math.max(1, Math.round(prevMax * scale));
  state.boss.stats.hp = Math.max(1, Math.round(prevHp * scale));
  state.log.push({ type: "rescale", hpScale: scale, activePlayers: safeNext });
}

export function handleDeparture(state: CombatState, actorId: string): void {
  const actor = findActor(state, actorId);
  if (!actor || actor.kicked) return;
  actor.kicked = true;
  const prevActive = state.activePlayers;
  const nextActive = Math.max(0, prevActive - 1);
  state.activePlayers = nextActive;
  rescaleBossForActivePlayers(state, prevActive, nextActive);
}

export function submitActionIntent(state: CombatState, intent: QueuedAction): IntentResult {
  const actor = findActor(state, intent.actorId);
  if (!actor) return { accepted: false, reason: "actor_not_found" };
  if (!isActorSelectable(actor)) return { accepted: false, reason: "actor_unavailable" };
  if (!actor.ready && !actor.selecting) return { accepted: false, reason: "actor_not_ready" };
  const targetCheck = validateTargets(state, actor, intent);
  if (!targetCheck.accepted) return targetCheck;
  if (actor.recastTurns[intent.abilityId]) return { accepted: false, reason: "on_cooldown" };

  queueActionForActor(state, actor, { abilityId: intent.abilityId, targetIds: intent.targetIds });
  const ability = state.abilities[intent.abilityId];
  if (ability?.recastTurns) {
    actor.recastTurns[intent.abilityId] = ability.recastTurns;
  }
  return { accepted: true };
}

export function computeRewards(state: CombatState): RewardSummary {
  const mode = state.config.speedMode;
  const rareChance = state.config.rareBase * (1 + mode.rareBonus) + state.pity;
  const summary: RewardSummary = {
    feeRefund: state.config.baseFee,
    rewardMultiplier: mode.rewardMultiplier,
    expBonus: mode.expBonus,
    rareChance,
    pityApplied: state.pity,
  };
  state.log.push({ type: "reward", rareChance, pityApplied: state.pity });
  return summary;
}

export function applyKillPity(state: CombatState): void {
  state.pity += state.config.pityRampPerKill;
}

export function clearPity(state: CombatState): void {
  state.pity = 0;
}
