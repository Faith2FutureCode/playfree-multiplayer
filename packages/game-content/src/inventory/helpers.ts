import { PowerUpType, POWERUP_METADATA } from "../powerups";
import {
  AddPowerUpResult,
  InventoryState,
  RemovePowerUpResult,
  PowerUpUseContext,
  UsePowerUpResult,
} from "./types";
import { dispatchPowerUpUse } from "./dispatcher";

export function addPowerUp(state: InventoryState, powerUp: PowerUpType): AddPowerUpResult {
  const slot = state.slots.findIndex((entry) => entry === null);
  if (slot === -1) {
    return "full";
  }
  state.slots[slot] = powerUp;
  return "ok";
}

export function removePowerUpAt(state: InventoryState, index: number): RemovePowerUpResult {
  if (!state.slots[index]) {
    return "empty";
  }
  state.slots[index] = null;
  return "ok";
}

export function usePowerUpAt(context: PowerUpUseContext, index: number): UsePowerUpResult {
  const powerUp = context.state.slots[index];
  if (!powerUp) {
    return "empty";
  }

  const meta = POWERUP_METADATA[powerUp];
  if (meta.usage === "map-target" && !context.targetId) {
    return "invalid";
  }

  const handled = dispatchPowerUpUse(context, index);
  if (handled === "invalid") {
    return "invalid";
  }
  context.state.slots[index] = null;
  return handled;
}
