import { PowerUpType } from "../../powerups";
import { registerHandler } from "../dispatcher";
import { PowerUpUseContext, UsePowerUpResult } from "../types";

function setPendingSuit(context: PowerUpUseContext, suit: PowerUpType): UsePowerUpResult {
  context.state.pending.suit = suit;
  return "ok";
}

function queueFlag(context: PowerUpUseContext, flag: keyof PowerUpUseContext["state"]["pending"]): UsePowerUpResult {
  // @ts-expect-error intentional narrow assignment for pending flags
  context.state.pending[flag] = true;
  return "ok";
}

export function registerLevelEntryHandlers() {
  registerHandler("apply-suit-mushroom", (ctx) => setPendingSuit(ctx, PowerUpType.Mushroom));
  registerHandler("apply-suit-fire", (ctx) => setPendingSuit(ctx, PowerUpType.FireFlower));
  registerHandler("apply-suit-leaf", (ctx) => setPendingSuit(ctx, PowerUpType.SuperLeaf));
  registerHandler("apply-suit-tanooki", (ctx) => setPendingSuit(ctx, PowerUpType.TanookiSuit));
  registerHandler("apply-suit-frog", (ctx) => setPendingSuit(ctx, PowerUpType.FrogSuit));
  registerHandler("apply-suit-hammer", (ctx) => setPendingSuit(ctx, PowerUpType.HammerSuit));
  registerHandler("queue-pwing", (ctx) => queueFlag(ctx, "flight"));
  registerHandler("queue-star", (ctx) => queueFlag(ctx, "invincibility"));
  registerHandler("queue-cloud", (ctx) => queueFlag(ctx, "cloudSkip"));
}
