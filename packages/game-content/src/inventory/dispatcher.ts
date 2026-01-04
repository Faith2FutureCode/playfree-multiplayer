import { POWERUP_METADATA, PowerUpType } from "../powerups";
import { PowerUpUseContext, UsePowerUpResult } from "./types";

type Handler = (context: PowerUpUseContext, powerUp: PowerUpType) => UsePowerUpResult;

const handlers: Record<string, Handler> = {};

export function registerHandler(id: string, handler: Handler) {
  handlers[id] = handler;
}

export function dispatchPowerUpEffect(
  context: PowerUpUseContext,
  powerUp: PowerUpType
): UsePowerUpResult {
  const meta = POWERUP_METADATA[powerUp];
  const handler = handlers[meta.effectHandlerId];
  if (!handler) {
    return "invalid";
  }
  return handler(context, powerUp);
}

export function dispatchPowerUpUse(context: PowerUpUseContext, index: number): UsePowerUpResult {
  const powerUp = context.state.slots[index];
  if (!powerUp) {
    return "empty";
  }
  return dispatchPowerUpEffect(context, powerUp);
}
