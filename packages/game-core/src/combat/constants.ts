import { SpeedModeConfig, SpeedModeId } from "./types.js";

export const SPEED_MODES: Record<SpeedModeId, SpeedModeConfig> = Object.freeze({
  "5s": { id: "5s", actionWindowMs: 5000, graceMs: 500, feeMultiplier: 1, rewardMultiplier: 1, expBonus: 0, rareBonus: 0 },
  "4s": { id: "4s", actionWindowMs: 4000, graceMs: 500, feeMultiplier: 2, rewardMultiplier: 1.05, expBonus: 0.05, rareBonus: 0.05 },
  "3s": { id: "3s", actionWindowMs: 3000, graceMs: 500, feeMultiplier: 4, rewardMultiplier: 1.1, expBonus: 0.1, rareBonus: 0.1 },
  "2s": { id: "2s", actionWindowMs: 2000, graceMs: 500, feeMultiplier: 10, rewardMultiplier: 1.5, expBonus: 0.25, rareBonus: 0.25 },
});

export const DEFAULT_TIMEOUT_MS = 10000;
export const DEFAULT_ATB_SPEED = 100;
export const MAX_SLOT = 4;

export const LEVEL_CURVE = Object.freeze({
  hp: 1.08,
  atk: 1.05,
  def: 1.05,
  speed: 1.02,
});

export const PER_HIT_CAP_PERCENT = 0.45;

export const BASIC_ATTACK_ID = "basic-attack";

export const ROW_OUTGOING_PHYSICAL: Record<"front" | "back", number> = {
  front: 1.1,
  back: 0.9,
};

export const ROW_INCOMING_PHYSICAL: Record<"front" | "back", number> = {
  front: 1.1,
  back: 0.9,
};
