import { clampCursor, moveCursor } from "./navigation";
import { usePowerUpAt } from "./helpers";
import { InventoryInputResult, InventoryState, PowerUpUseContext } from "./types";

export interface InventoryInputBindings {
  open: string;
  close: string;
  confirm: string;
  cancel: string;
  up: string;
  down: string;
  left: string;
  right: string;
}

export type InventoryCommand = "open" | "close" | "toggle" | "confirm" | "cancel" | "up" | "down" | "left" | "right";

export interface InventoryInputContext {
  isOverworld: boolean;
  targetId?: string;
  now?: number;
}

export function handleNavigationInput(
  state: InventoryState,
  direction: "up" | "down" | "left" | "right"
): InventoryInputResult {
  if (!state.isOpen) return "blocked";

  const delta =
    direction === "up"
      ? { x: 0, y: -1 }
      : direction === "down"
      ? { x: 0, y: 1 }
      : direction === "left"
      ? { x: -1, y: 0 }
      : { x: 1, y: 0 };

  moveCursor(state, delta);
  clampCursor(state);
  return "moved";
}

function isDebounced(state: InventoryState, now: number) {
  return now - state.lastConfirmAt < state.confirmCooldownMs;
}

export function handleInventoryCommand(
  state: InventoryState,
  command: InventoryCommand,
  context: InventoryInputContext
): InventoryInputResult {
  const now = context.now ?? Date.now();
  const isOverworld = !!context.isOverworld;

  if (command === "open") {
    if (!isOverworld || state.isOpen) return "blocked";
    state.isOpen = true;
    return "opened";
  }

  if (command === "close" || command === "cancel") {
    if (!state.isOpen) return "blocked";
    state.isOpen = false;
    return "closed";
  }

  if (command === "toggle") {
    if (state.isOpen) {
      state.isOpen = false;
      return "closed";
    }
    if (!isOverworld) return "blocked";
    state.isOpen = true;
    return "opened";
  }

  if (!state.isOpen || !isOverworld) {
    return "blocked";
  }

  if (command === "confirm") {
    if (isDebounced(state, now)) {
      return "blocked";
    }
    state.lastConfirmAt = now;
    const target: PowerUpUseContext = { state, targetId: context.targetId };
    return usePowerUpAt(target, state.cursor) ?? "invalid";
  }

  if (command === "up" || command === "down" || command === "left" || command === "right") {
    return handleNavigationInput(state, command);
  }

  return "invalid";
}
