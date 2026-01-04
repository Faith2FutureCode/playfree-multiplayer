import { PowerUpType, POWERUP_METADATA } from "../powerups";
import { dispatchPowerUpEffect } from "./dispatcher";
import { usePowerUpAt } from "./helpers";
import { InventoryState, PendingFlags, PowerUpUseContext, UsePowerUpResult } from "./types";

export interface PowerUpAcquisitionResult {
  result: UsePowerUpResult;
  pending: PendingFlags;
  message: string | null;
  sfx: "powerup-queue" | "powerup-invalid" | null;
}

function snapshotPending(state: InventoryState): PendingFlags {
  return { ...state.pending };
}

export function applyWorldPickup(state: InventoryState, powerUp: PowerUpType): PowerUpAcquisitionResult {
  const context: PowerUpUseContext = { state };
  const meta = POWERUP_METADATA[powerUp];
  if (meta.usage !== "level-entry") {
    return {
      result: "invalid",
      pending: snapshotPending(state),
      message: `Cannot apply ${meta.name} in a level`,
      sfx: "powerup-invalid",
    };
  }
  const result = dispatchPowerUpEffect(context, powerUp);
  const ok = result === "ok";
  return {
    result,
    pending: snapshotPending(state),
    message: ok ? `${meta.name} readied for level start` : `Cannot queue ${meta.name}`,
    sfx: ok ? "powerup-queue" : "powerup-invalid",
  };
}

export function useInventoryPowerUpWithFeedback(
  context: PowerUpUseContext,
  index: number
): PowerUpAcquisitionResult {
  const powerUp = context.state.slots[index];
  if (!powerUp) {
    return {
      result: "empty",
      pending: snapshotPending(context.state),
      message: "Empty slot",
      sfx: "powerup-invalid",
    };
  }

  const meta = POWERUP_METADATA[powerUp];
  if (meta.usage === "map-target" && !context.targetId) {
    return {
      result: "invalid",
      pending: snapshotPending(context.state),
      message: `${meta.name} needs a target`,
      sfx: "powerup-invalid",
    };
  }
  const result = usePowerUpAt(context, index);
  const ok = result === "ok";
  return {
    result,
    pending: snapshotPending(context.state),
    message: ok ? `${meta.name} queued for level start` : `Cannot use ${meta.name}`,
    sfx: ok ? "powerup-queue" : "powerup-invalid",
  };
}

export function useMapPowerUpWithFeedback(
  context: PowerUpUseContext,
  index: number,
  targetId: string
): PowerUpAcquisitionResult {
  const powerUp = context.state.slots[index];
  if (!powerUp) {
    return {
      result: "empty",
      pending: snapshotPending(context.state),
      message: "Empty slot",
      sfx: "powerup-invalid",
    };
  }
  const meta = POWERUP_METADATA[powerUp];
  if (meta.usage !== "map-target") {
    return {
      result: "invalid",
      pending: snapshotPending(context.state),
      message: `${meta.name} cannot be used on the map`,
      sfx: "powerup-invalid",
    };
  }
  const result = usePowerUpAt({ ...context, targetId }, index);
  const ok = result === "ok";
  return {
    result,
    pending: snapshotPending(context.state),
    message: ok ? `${meta.name} used on ${targetId}` : `Cannot use ${meta.name} on ${targetId}`,
    sfx: ok ? "powerup-queue" : "powerup-invalid",
  };
}
