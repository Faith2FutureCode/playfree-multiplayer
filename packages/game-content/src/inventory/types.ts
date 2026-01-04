import { PowerUpType } from "../powerups";

export type InventorySlot = PowerUpType | null;

export interface PendingFlags {
  suit: PowerUpType | null;
  flight: boolean;
  invincibility: boolean;
  cloudSkip: boolean;
  airshipLock: boolean;
  hammerBrosSleep: number;
}

export interface MapHooks {
  breakRock: (targetId: string) => boolean;
  lockAirship: (targetId: string) => boolean;
  sleepHammerBros: (turns: number) => void;
}

export interface InventoryMapState {
  brokenRocks: string[];
  lockedAirships: string[];
  sleepingHammerBrosTurns: number;
}

export interface InventoryState {
  slots: InventorySlot[];
  cursor: number;
  isOpen: boolean;
  lastConfirmAt: number;
  confirmCooldownMs: number;
  pending: PendingFlags;
  mapState: InventoryMapState;
  mapHooks: MapHooks;
}

export type AddPowerUpResult = "ok" | "full";
export type RemovePowerUpResult = "ok" | "empty";
export type UsePowerUpResult = "ok" | "empty" | "invalid";

export interface PowerUpUseContext {
  state: InventoryState;
  targetId?: string;
}

export type InventoryInputResult =
  | "opened"
  | "closed"
  | "moved"
  | "used"
  | "blocked"
  | UsePowerUpResult;
