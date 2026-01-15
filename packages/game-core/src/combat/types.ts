export type SpeedModeId = "5s" | "4s" | "3s" | "2s";

export interface SpeedModeConfig {
  id: SpeedModeId;
  actionWindowMs: number;
  graceMs: number;
  feeMultiplier: number;
  rewardMultiplier: number;
  expBonus: number;
  rareBonus: number;
}

export type Row = "front" | "back";

export interface AttributeSet {
  maxHp: number;
  hp: number;
  maxMp: number;
  mp: number;
  speed: number;
  str: number;
  mag: number;
  def: number;
  res: number;
  acc: number;
  eva: number;
  crit: number;
}

export interface StatusEffect {
  id: string;
  durationTurns: number;
  stacks?: number;
  modifiers?: Partial<AttributeSet>;
  tags?: string[];
}

export interface StatusInstance {
  effect: StatusEffect;
  remainingTurns: number;
  sourceId?: string;
}

export interface Ability {
  id: string;
  name: string;
  category: "attack" | "ability" | "item";
  shape: "single" | "row" | "cone" | "party" | "multi";
  element?: string;
  costMp?: number;
  damageType?: "physical" | "magic" | "hybrid";
  potency?: number;
  recastTurns?: number;
  castMs?: number;
  statusEffects?: StatusEffect[];
  targetLimit?: number;
  personalCooldownMs?: number;
  ignoresRowModifiers?: boolean;
}

export interface ActorSnapshot {
  id: string;
  name: string;
  subgroup: number;
  slot: number;
  row: Row;
  stats: AttributeSet;
  loadoutId?: string;
}

export interface ActorState extends ActorSnapshot {
  atb: number;
  ready: boolean;
  dead: boolean;
  kicked: boolean;
  timeoutStrikes: number;
  selecting?: SelectionWindow;
  lockedAction?: ActionIntent;
  recastTurns: Record<string, number>;
  statuses: StatusInstance[];
}

export interface SelectionWindow {
  startedAt: number;
  deadline: number;
  abilityLock?: string;
}

export interface ActionIntent {
  actorId: string;
  abilityId: string;
  targetIds: string[];
  prelocked?: boolean;
}

export interface QueuedAction extends ActionIntent {
  slot: number;
  subgroup: number;
}

export interface IntentResult {
  accepted: boolean;
  reason?: string;
}

export interface BossTemplate {
  id: string;
  name: string;
  baseStats: AttributeSet;
  affixes?: string[];
}

export interface BossState extends ActorState {
  level: number;
  affixes: string[];
  phase: number;
}

export interface CombatConfig {
  sessionId: string;
  speedMode: SpeedModeConfig;
  bossLevel: number;
  baseFee: number;
  rareBase: number;
  pityRampPerKill: number;
  seed: string;
}

export type AbilityMap = Record<string, Ability>;

export interface CombatState {
  config: CombatConfig;
  boss: BossState;
  players: ActorState[];
  activePlayers: number;
  slotCursor: number;
  pendingActions: QueuedAction[];
  pity: number;
  abilities: AbilityMap;
  log: CombatLogEntry[];
}

export type CombatLogEntry =
  | { type: "action"; actorId: string; abilityId: string; targets: string[] }
  | { type: "damage"; sourceId: string; targetId: string; amount: number; abilityId: string }
  | { type: "status"; targetId: string; statusId: string; apply: boolean }
  | { type: "timeout"; actorId: string; strikes: number }
  | { type: "kick"; actorId: string }
  | { type: "rescale"; hpScale: number; activePlayers: number }
  | { type: "reward"; rareChance: number; pityApplied: number };

export interface RewardSummary {
  feeRefund: number;
  rewardMultiplier: number;
  expBonus: number;
  rareChance: number;
  pityApplied: number;
}
