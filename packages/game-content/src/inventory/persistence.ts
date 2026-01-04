import { InventoryState, InventoryMapState, InventorySlot } from "./types";
import { PowerUpType } from "../powerups";

const DEFAULT_PENDING: InventoryState["pending"] = {
  suit: null,
  flight: false,
  invincibility: false,
  cloudSkip: false,
  airshipLock: false,
  hammerBrosSleep: 0,
};

const DEFAULT_MAP_STATE: InventoryMapState = {
  brokenRocks: [],
  lockedAirships: [],
  sleepingHammerBrosTurns: 0,
};

const DEFAULT_CONFIRM_COOLDOWN = 150;

export interface InventorySaveData {
  slots: (PowerUpType | null)[];
  cursor: number;
  pending: InventoryState["pending"];
  mapState?: InventoryMapState;
  confirmCooldownMs?: number;
}

export function serializeInventory(state: InventoryState): InventorySaveData {
  return {
    slots: [...state.slots],
    cursor: state.cursor,
    pending: { ...state.pending },
    mapState: {
      brokenRocks: [...state.mapState.brokenRocks],
      lockedAirships: [...state.mapState.lockedAirships],
      sleepingHammerBrosTurns: state.mapState.sleepingHammerBrosTurns,
    },
    confirmCooldownMs: state.confirmCooldownMs,
  };
}

export function hydrateInventory(
  data: InventorySaveData,
  hooks: InventoryState["mapHooks"]
): InventoryState {
  const slots: InventorySlot[] = (data.slots ?? [])
    .slice(0, 28)
    .concat(Array(Math.max(0, 28 - (data.slots?.length ?? 0))).fill(null))
    .slice(0, 28);

  return {
    slots,
    cursor: data.cursor ?? 0,
    isOpen: false,
    lastConfirmAt: 0,
    confirmCooldownMs: data.confirmCooldownMs ?? DEFAULT_CONFIRM_COOLDOWN,
    pending: data.pending ? { ...DEFAULT_PENDING, ...data.pending } : { ...DEFAULT_PENDING },
    mapState: data.mapState
      ? {
          brokenRocks: [...(data.mapState.brokenRocks ?? [])],
          lockedAirships: [...(data.mapState.lockedAirships ?? [])],
          sleepingHammerBrosTurns: data.mapState.sleepingHammerBrosTurns ?? 0,
        }
      : { ...DEFAULT_MAP_STATE },
    mapHooks: hooks,
  };
}
