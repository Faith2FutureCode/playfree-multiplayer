import test from "node:test";
import assert from "node:assert/strict";
import { PowerUpType } from "../../powerups";
import { addPowerUp, usePowerUpAt } from "../helpers";
import { registerMapHandlers } from "../handlers/mapItems";
import { registerLevelEntryHandlers } from "../handlers/levelEntry";
import {
  applyWorldPickup,
  useInventoryPowerUpWithFeedback,
  useMapPowerUpWithFeedback,
} from "../acquisition";
import {
  clearPendingOnDeathOrRespawn,
  consumePending,
  initializeInventory,
  prepareForLevelStart,
  applyPendingFlags,
} from "../stateTransitions";

const hooks = {
  breakRock: () => true,
  lockAirship: () => true,
  sleepHammerBros: () => {},
};

registerMapHandlers();
registerLevelEntryHandlers();

test("addPowerUp fills inventory then reports full", () => {
  const state = initializeInventory(hooks);
  for (let i = 0; i < 28; i++) {
    assert.equal(addPowerUp(state, PowerUpType.Mushroom), "ok");
  }
  assert.equal(addPowerUp(state, PowerUpType.Mushroom), "full");
});

test("usePowerUpAt on empty slot returns empty without mutation", () => {
  const state = initializeInventory(hooks);
  const result = usePowerUpAt({ state }, 0);
  assert.equal(result, "empty");
  assert.equal(state.slots[0], null);
});

test("map hammer consumes item and records broken rock", () => {
  let calledTarget: string | null = null;
  const state = initializeInventory({
    ...hooks,
    breakRock: (targetId: string) => {
      calledTarget = targetId;
      return true;
    },
  });
  state.slots[0] = PowerUpType.Hammer;
  const result = usePowerUpAt({ state, targetId: "rock-1" }, 0);
  assert.equal(result, "ok");
  assert.equal(state.slots[0], null);
  assert.equal(calledTarget, "rock-1");
  assert.deepEqual(state.mapState.brokenRocks, ["rock-1"]);
});

test("map-target item without target is invalid and not consumed", () => {
  const state = initializeInventory(hooks);
  state.slots[0] = PowerUpType.Anchor;
  const result = usePowerUpAt({ state }, 0);
  assert.equal(result, "invalid");
  assert.equal(state.slots[0], PowerUpType.Anchor);
});

test("anchor locks airship, records map state, and sets pending flag", () => {
  let locked: string | null = null;
  const state = initializeInventory({
    ...hooks,
    lockAirship: (targetId: string) => {
      locked = targetId;
      return true;
    },
  });
  state.slots[0] = PowerUpType.Anchor;
  const result = usePowerUpAt({ state, targetId: "airship-3" }, 0);
  assert.equal(result, "ok");
  assert.equal(state.slots[0], null);
  assert.equal(locked, "airship-3");
  assert.deepEqual(state.mapState.lockedAirships, ["airship-3"]);
  const pending = consumePending(state);
  assert.equal(pending.airshipLock, true);
  assert.equal(state.pending.airshipLock, false);
});

test("music box queues hammer bros sleep turns", () => {
  let slept = 0;
  const state = initializeInventory({
    ...hooks,
    sleepHammerBros: (turns: number) => {
      slept += turns;
    },
  });
  state.slots[0] = PowerUpType.MusicBox;
  const result = usePowerUpAt({ state }, 0);
  assert.equal(result, "ok");
  assert.equal(state.slots[0], null);
  assert.equal(slept, 3);
  assert.equal(state.pending.hammerBrosSleep, 3);
  assert.equal(state.mapState.sleepingHammerBrosTurns, 3);
});

test("prepareForLevelStart closes inventory and clears pending level flags", () => {
  const state = initializeInventory(hooks);
  state.isOpen = true;
  state.pending.suit = PowerUpType.FireFlower;
  state.pending.flight = true;
  state.pending.invincibility = true;
  state.pending.cloudSkip = true;

  prepareForLevelStart(state);

  assert.equal(state.isOpen, false);
  assert.equal(state.pending.suit, null);
  assert.equal(state.pending.flight, false);
  assert.equal(state.pending.invincibility, false);
  assert.equal(state.pending.cloudSkip, false);
});

test("applyPendingFlags returns and clears level-entry flags", () => {
  const state = initializeInventory(hooks);
  state.pending.suit = PowerUpType.TanookiSuit;
  state.pending.flight = true;
  state.pending.invincibility = true;

  const pending = applyPendingFlags(state);

  assert.equal(pending.suit, PowerUpType.TanookiSuit);
  assert.equal(pending.flight, true);
  assert.equal(pending.invincibility, true);
  assert.equal(state.pending.suit, null);
  assert.equal(state.pending.flight, false);
  assert.equal(state.pending.invincibility, false);
});

test("world pickup queues suit via dispatcher and returns feedback", () => {
  const state = initializeInventory(hooks);
  const result = applyWorldPickup(state, PowerUpType.FireFlower);

  assert.equal(result.result, "ok");
  assert.equal(state.pending.suit, PowerUpType.FireFlower);
  assert.equal(result.pending.suit, PowerUpType.FireFlower);
  assert.ok(result.message?.includes("Fire Flower"));
  assert.equal(result.sfx, "powerup-queue");
});

test("inventory use queues suit and returns feedback", () => {
  const state = initializeInventory(hooks);
  state.slots[0] = PowerUpType.SuperLeaf;

  const result = useInventoryPowerUpWithFeedback({ state }, 0);

  assert.equal(result.result, "ok");
  assert.equal(state.slots[0], null);
  assert.equal(state.pending.suit, PowerUpType.SuperLeaf);
  assert.ok(result.message?.includes("Super Leaf"));
  assert.equal(result.sfx, "powerup-queue");
});

test("inventory map-target item needs target feedback", () => {
  const state = initializeInventory(hooks);
  state.slots[0] = PowerUpType.Hammer;

  const result = useInventoryPowerUpWithFeedback({ state }, 0);

  assert.equal(result.result, "invalid");
  assert.ok(result.message?.includes("target"));
  assert.equal(state.slots[0], PowerUpType.Hammer);
});

test("map power-up with target returns success message", () => {
  const state = initializeInventory({
    ...hooks,
    breakRock: (targetId: string) => targetId === "rock-1",
  });
  state.slots[0] = PowerUpType.Hammer;

  const result = useMapPowerUpWithFeedback({ state }, 0, "rock-1");

  assert.equal(result.result, "ok");
  assert.ok(result.message?.includes("rock-1"));
  assert.equal(state.slots[0], null);
});

test("clearPendingOnDeathOrRespawn drops queued effects", () => {
  const state = initializeInventory(hooks);
  state.pending.suit = PowerUpType.Mushroom;
  state.pending.invincibility = true;

  const cleared = clearPendingOnDeathOrRespawn(state);

  assert.equal(cleared.suit, PowerUpType.Mushroom);
  assert.equal(cleared.invincibility, true);
  assert.equal(state.pending.suit, null);
  assert.equal(state.pending.invincibility, false);
});
