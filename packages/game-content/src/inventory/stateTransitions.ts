import { InventoryState, PendingFlags } from "./types";

const PENDING_DEFAULTS: PendingFlags = {
  suit: null,
  flight: false,
  invincibility: false,
  cloudSkip: false,
  airshipLock: false,
  hammerBrosSleep: 0,
};

export function consumePending(state: InventoryState): PendingFlags {
  const pending = { ...state.pending };
  state.pending = { ...PENDING_DEFAULTS };
  return pending;
}

export function applyPendingFlags(state: InventoryState): PendingFlags {
  // Wire into level entry; actual player state changes happen elsewhere.
  return consumePending(state);
}

export function clearPendingOnDeathOrRespawn(state: InventoryState): PendingFlags {
  // Drops any queued level-entry effects when the player dies before level start.
  return consumePending(state);
}

export function closeInventory(state: InventoryState) {
  state.isOpen = false;
}

export function prepareForLevelStart(state: InventoryState): PendingFlags {
  closeInventory(state);
  return applyPendingFlags(state);
}

export function initializeInventory(mapHooks: InventoryState["mapHooks"]): InventoryState {
  return {
    slots: Array(28).fill(null),
    cursor: 0,
    isOpen: false,
    lastConfirmAt: 0,
    confirmCooldownMs: 150,
    pending: { ...PENDING_DEFAULTS },
    mapState: {
      brokenRocks: [],
      lockedAirships: [],
      sleepingHammerBrosTurns: 0,
    },
    mapHooks,
  };
}
