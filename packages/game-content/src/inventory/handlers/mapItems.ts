import { registerHandler } from "../dispatcher";
import { PowerUpUseContext, UsePowerUpResult } from "../types";

function ensureTarget(context: PowerUpUseContext): string | null {
  return context.targetId ?? null;
}

export function registerMapHandlers() {
  registerHandler("map-hammer", (ctx): UsePowerUpResult => {
    const target = ensureTarget(ctx);
    if (!target) return "invalid";
    const ok = ctx.state.mapHooks.breakRock(target);
    if (ok) {
      if (!ctx.state.mapState.brokenRocks.includes(target)) {
        ctx.state.mapState.brokenRocks.push(target);
      }
    }
    return ok ? "ok" : "invalid";
  });

  registerHandler("map-music-box", (ctx): UsePowerUpResult => {
    ctx.state.pending.hammerBrosSleep += 3;
    ctx.state.mapHooks.sleepHammerBros(3);
    ctx.state.mapState.sleepingHammerBrosTurns = ctx.state.pending.hammerBrosSleep;
    return "ok";
  });

  registerHandler("map-anchor", (ctx): UsePowerUpResult => {
    const target = ensureTarget(ctx);
    if (!target) return "invalid";
    const ok = ctx.state.mapHooks.lockAirship(target);
    if (ok) {
      if (!ctx.state.mapState.lockedAirships.includes(target)) {
        ctx.state.mapState.lockedAirships.push(target);
      }
      ctx.state.pending.airshipLock = true;
    }
    return ok ? "ok" : "invalid";
  });
}
