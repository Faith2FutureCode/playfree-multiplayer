// Lightweight in-page demo harness for the combat engine.
// Exposes helpers on window.combatDemo without touching gameplay.
import {
  BASIC_ATTACK_ID,
  createCombatState,
  resolveNextSlotWave,
  submitActionIntent,
  tickATB,
  computeRewards,
  applyKillPity,
  clearPity,
  SPEED_MODES,
} from "./packages/game-core/dist/index.js";

const demoAbilities = {
  slash: {
    id: "slash",
    name: "Slash",
    category: "attack",
    shape: "single",
    damageType: "physical",
    potency: 2,
  },
  blast: {
    id: "blast",
    name: "Blast",
    category: "attack",
    shape: "single",
    damageType: "magic",
    potency: 2.2,
    ignoresRowModifiers: true,
  },
  line: {
    id: "line",
    name: "Line Drive",
    category: "attack",
    shape: "row",
    damageType: "physical",
    potency: 1.5,
  },
};

const BOSS_SPRITE =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAIAAAABQCAYAAADRAH3kAAADIklEQVR4nO2cL1DjQBTGl84pdHTVCRSiGERVNQKFCLaq4nQUAlWNqKptRdWJ6irEGSpQEajqamxO3GQuLNlks/933/ebYTqTZl52+r73Jdm3C2MAAAAAAAAAAAAAAID0uXB1oX3xXt0tr7Wv5ypOfvWrkomT38/Z9vdadzhKcbbli/bvMNINAOLGiQD2xXvV/EwlTn4///LpO44KcADiWBcAX2WqVRdaHL5aVavXVBxV4ADEgQCIY1UAInsdaruhxRHZ9FD7NhVHBzgAcawJoK+qZKsutDh91Slbvabi6AIHIA4EQBwrvYAhD1Vd8/E+47T1AtpseVo+CWMtynHr8SH23tUfQC8AaGPcAVRm1tqq13cc3gFEVTvUAVZ/noXnvy5PrcdFLgAHANr8MB3QRK8+xDiiKpxemYjefQ2bwAGIAwEQx/gtgBqiV71YkBbAJJtqrZ4Bfsizotqel8LnIDiAYxa34tdGW3SJAM8ARMizotXBIQDikL4FvB0uhd89PjgciCPabgUkHeDtcNmZfMYY2+xKttmVjkbkDv5WQEoAMonnSVEITRGQEcDQxPOkKgISAtBNfk1qImCMgABMJb8mJRHkWVGNVpMxZvgIM2KMsdVkXNV/vgdkEtPVX5OSC3ybB2iKYHE8Ofv/AcAPnRNBTTGs21crBYut6q/Z7Er2+GBwNYgnpGcC5+P/Clif4m6Bgn9sz8sLpalgiCEdtHsBlMVQno++h6CN0WYQZTHERt0UstYNhBjiwEk7GGIIi2ZL2Pl6AFdiuJl9Wn0VvJl9WovtEucCgAOEhRMB+Eq6LReIufr5FUHWBIBKjwOjAggx6aZdIKXqZ8yAAEJMOo8pEcScfBFKAogh6Ty6Ikgx+YwNEECMSeepkzhECKkkXrQzqFMAzfUAkyydxSIyQkgl8X18EwClRSBUkty7OZRS0sFXpBOP7eHhcTy/aheu8mvg4WPfe87s552384AcyvsC+n7k+ntf5wE5kt8YArrREoCo2vjjvs4D/cABiKMtgFCqHdWvBhyAOEYE4PuJH9WvDhwAAAAAAAAAAAAAAAAK/AU49nSsA7oYfgAAAABJRU5ErkJggg==";

const HERO_SPRITES = [
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAYCAYAAAD6S912AAAAvElEQVR4nGNgGHGAEZvg/xMB/4k2wGIDihlMlLoIHdDHQEaLDYwfGQIYPjIEMIj6nGOAsdH56N5lYMARhgwMDAwfTiwgGI4CFgkY+llgjIqKihMwdkdHhwUhw3CBwR8pLNgEYeHns0EDp8YtATfg6pDDcvB7mT5hKGCRwOgW1fOfi+EIAwMDA8OuZSXwMHKL6vnPwMDAEDYJVZxmLhz8BsLDkJLshgwwAlVDwwajULhx4wgjsfKDPwypbiAAfNg3r52eDtUAAAAASUVORK5CYII=",
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAYCAYAAAD6S912AAAAuElEQVR4nGNgGHGAEZtgxYn//4k1oMOCEcUMJkpdhA6obiBWLzMwMDB8OLHgPwMDA4OKTx3DnS1NcHFkvoBFAoZ+ggbiA9gMZIExKioqTsDYHR0dFoQMwwUGf6SwYBOEhZ/PBg2cGrcE3ICrQw7Lwe9l+oShgEUCo1tUz38uhiMMDAwMDLuWlcDDyC2q5z8DAwND2CRUcZq5cPAbCA9DSrIbMsAIVA0NG4xC4caNI4zEyg/+MKS6gQAf5zS1LohltgAAAABJRU5ErkJggg==",
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAYCAYAAAD6S912AAAAt0lEQVR4nGNgGHGAEZvg/4ot/4k2oMMHxQwmSl2EDqhuIFYvMzAwMHw4seA/AwMDg4pPHcOdLU1wcWS+gEUChn6CBuID2AxkgTEqKipOwNgdHR0WhAzDBQZ/pLBgE4SFn88GDZwatwTcgKtDDsvB72X6hKGARQKjW1TPfy6GIwwMDAwMu5aVwMPILarnPwMDA0PYJFRxmrlw8BsID0NKshsywAhUDQ0bjELhxo0jjMTKD/4wpLqBABx3NLXKAu/8AAAAAElFTkSuQmCC",
];

const demoPlayers = [
  {
    id: "p1",
    name: "Hero 1",
    subgroup: 1,
    slot: 1,
    row: "front",
    stats: {
      maxHp: 120,
      hp: 120,
      maxMp: 20,
      mp: 20,
      speed: 110,
      str: 24,
      mag: 8,
      def: 12,
      res: 10,
      acc: 10,
      eva: 5,
      crit: 5,
    },
  },
  {
    id: "p2",
    name: "Hero 2",
    subgroup: 1,
    slot: 2,
    row: "back",
    stats: {
      maxHp: 100,
      hp: 100,
      maxMp: 30,
      mp: 30,
      speed: 105,
      str: 16,
      mag: 18,
      def: 10,
      res: 12,
      acc: 10,
      eva: 6,
      crit: 5,
    },
  },
  {
    id: "p3",
    name: "Hero 3",
    subgroup: 1,
    slot: 3,
    row: "front",
    stats: {
      maxHp: 110,
      hp: 110,
      maxMp: 15,
      mp: 15,
      speed: 100,
      str: 20,
      mag: 10,
      def: 11,
      res: 10,
      acc: 10,
      eva: 5,
      crit: 5,
    },
  },
  {
    id: "p4",
    name: "Hero 4",
    subgroup: 1,
    slot: 4,
    row: "back",
    stats: {
      maxHp: 95,
      hp: 95,
      maxMp: 25,
      mp: 25,
      speed: 98,
      str: 15,
      mag: 17,
      def: 10,
      res: 12,
    acc: 10,
    eva: 6,
    crit: 5,
    },
  },
];

const bossCatalog = [
  {
    id: "boss",
    name: "Demo Boss",
    baseStats: {
      maxHp: 600,
      hp: 600,
      maxMp: 0,
      mp: 0,
      speed: 95,
      str: 20,
      mag: 12,
      def: 14,
      res: 12,
      acc: 12,
      eva: 6,
      crit: 5,
    },
    affixes: [],
  },
  {
    id: "wyrm",
    name: "Sand Wyrm",
    baseStats: {
      maxHp: 750,
      hp: 750,
      maxMp: 0,
      mp: 0,
      speed: 100,
      str: 24,
      mag: 14,
      def: 16,
      res: 12,
      acc: 12,
      eva: 6,
      crit: 5,
    },
    affixes: ["sandstorm"],
  },
];

const roster = demoPlayers.map((p, idx) => ({ ...p, status: idx < 3 ? "ready" : "pending" }));
let selectedBossId = bossCatalog[0].id;
let selectedMode = "4s";
let phase = "lobby"; // lobby -> combat -> results
let snapshotInfo = null;
let resultsInfo = null;
let autoTimer = null;
let heroAtb = {};
let atbTimer = null;
let __startTransition = null;

function stopAuto() {
  if (autoTimer) {
    clearInterval(autoTimer);
    autoTimer = null;
  }
}

function cloneParticipant(p) {
  const { ready, status, ...rest } = p;
  return { ...rest, stats: { ...rest.stats } };
}

function createDemoState(mode = "4s", bossId = bossCatalog[0].id, party = roster.filter((r) => r.status === "ready").map(cloneParticipant)) {
  const boss = bossCatalog.find((b) => b.id === bossId) || bossCatalog[0];
  return createCombatState({
    speedModeId: mode,
    bossLevel: 1,
    baseFee: 10,
    rareBase: 0.1,
    pityRampPerKill: 0.02,
    players: party,
    boss,
    abilities: demoAbilities,
  });
}

let state = createDemoState(selectedMode, selectedBossId);
let now = performance.now();

function tick(deltaMs = 500) {
  if (phase !== "combat") return [];
  now += deltaMs;
  return tickATB(state, deltaMs, now);
}

function intent(actorId, abilityId = BASIC_ATTACK_ID, targetIds = ["boss"]) {
  if (phase !== "combat") return { accepted: false, reason: "not_in_combat" };
  const actor = state.players.find((p) => p.id === actorId);
  if (!actor) return { accepted: false, reason: "actor_not_found" };
  return submitActionIntent(state, {
    actorId,
    abilityId,
    targetIds,
    slot: actor.slot,
    subgroup: actor.subgroup,
  });
}

function wave() {
  if (phase !== "combat") return [];
  return resolveNextSlotWave(state);
}

function rewards() {
  if (phase !== "combat" && phase !== "results") return null;
  return computeRewards(state);
}

function pity() {
  if (phase !== "combat") return state.pity;
  applyKillPity(state);
  return state.pity;
}

function reset(mode = "4s") {
  window.__combatDemoStopAtb?.();
  state = createDemoState(mode, selectedBossId);
  now = performance.now();
  phase = "combat";
  snapshotInfo = { partySize: state.players.length, boss: state.boss.name, mode };
  resultsInfo = null;
  heroAtb = Object.fromEntries(state.players.map((p) => [p.id, 0]));
  window.__combatDemoStartAtb?.();
  return state;
}

function startRun() {
  const party = roster.filter((r) => r.status !== "declined").map(cloneParticipant);
  if (party.length === 0) return { started: false, reason: "no_ready_players" };
  stopAuto();
  window.__combatDemoStopAtb?.();
  state = createDemoState(selectedMode, selectedBossId, party);
  now = performance.now();
  phase = "transition";
  snapshotInfo = { partySize: party.length, boss: state.boss.name, mode: selectedMode };
  resultsInfo = null;
  heroAtb = Object.fromEntries(party.map((p) => [p.id, 0]));
  const doTransition =
    window.__combatDemoStartTransition ||
    __startTransition ||
    ((cb) => {
      cb?.();
    });
  doTransition(() => {
    phase = "combat";
    window.__combatDemoStartAtb?.();
    render();
  });
  // failsafe: ensure combat starts even if transition callback is interrupted
  setTimeout(() => {
    if (phase === "transition") {
      phase = "combat";
      window.__combatDemoStartAtb?.();
      render();
    }
  }, 2000);
  return { started: true };
}

function finishRun(outcome) {
  if (phase !== "combat") return;
  const summary = outcome === "victory" ? computeRewards(state) : null;
  resultsInfo = { outcome, summary };
  phase = "results";
  return summary;
}

window.combatDemo = {
  state: () => state,
  tick,
  intent,
  wave,
  rewards,
  pity,
  clear: () => clearPity(state),
  reset,
  modes: SPEED_MODES,
};

console.info("Combat demo ready: window.combatDemo.tick(), .intent(), .wave(), .rewards()");

// -----------------------------
// Minimal on-page demo UI
// -----------------------------
(function initDemoUi() {
  const style = document.createElement("style");
  style.textContent = `
    .combat-demo-toggle {
      position: fixed;
      bottom: 16px;
      right: 16px;
      z-index: 1200;
      background: #111a30;
      color: #e6f0ff;
      border: 1px solid rgba(255,255,255,0.2);
      padding: 8px 12px;
      font: 13px/1.2 "VT323", monospace;
      cursor: pointer;
      box-shadow: 0 6px 20px rgba(0,0,0,0.45);
    }
    .combat-demo-panel {
      position: fixed;
      bottom: 64px;
      right: 16px;
      width: 320px;
      max-height: 420px;
      z-index: 1200;
      background: #0c1224;
      color: #e6f0ff;
      border: 1px solid rgba(255,255,255,0.2);
      box-shadow: 0 10px 28px rgba(0,0,0,0.55);
      display: none;
      flex-direction: column;
      font: 12px/1.4 "VT323", monospace;
    }
    .combat-demo-panel.visible { display: flex; }
    .combat-demo-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 8px 10px;
      background: #101831;
      font-weight: 700;
      letter-spacing: 0.5px;
    }
    .combat-demo-body { padding: 8px 10px; gap: 6px; display: flex; flex-direction: column; max-height: 360px; overflow-y: auto; }
    .combat-demo-row { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
    .combat-demo-row button, .combat-demo-row select {
      background: #182342;
      color: #e6f0ff;
      border: 1px solid rgba(255,255,255,0.15);
      padding: 6px 8px;
      font: 12px/1.2 "VT323", monospace;
      cursor: pointer;
    }
    .ready-dot {
      width: 10px;
      height: 10px;
      border-radius: 999px;
      border: 1px solid rgba(255,255,255,0.4);
      margin-right: 6px;
      flex-shrink: 0;
      display: inline-block;
    }
    .ready-dot.ready { background: #2dd36f; }
    .ready-dot.pending { background: #e8c94f; }
    .ready-dot.declined { background: #d33232; }
    .decline-btn {
      background: none;
      border: 1px solid rgba(255,255,255,0.2);
      color: #d98b8b;
      cursor: pointer;
      padding: 2px 6px;
      font: 11px/1.1 "Press Start 2P", "VT323", monospace;
      margin-left: 4px;
    }
    .boss-scene {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      opacity: 0;
      transition: opacity 250ms ease;
      z-index: 1000;
      overflow: hidden;
      mix-blend-mode: normal;
    }
    .boss-scene.visible { opacity: 1; }
    .boss-bg {
      position: absolute;
      inset: 0;
      background: repeating-linear-gradient(0deg, #0a0d16 0px, #0a0d16 4px, #0f1626 4px, #0f1626 8px);
      animation: stripes 4s linear infinite;
      filter: contrast(1.2) brightness(0.9);
    }
    .boss-parallax {
      position: absolute;
      inset: 0;
      background: repeating-linear-gradient(90deg, rgba(255,255,255,0.06) 0 32px, transparent 32px 64px);
      mix-blend-mode: screen;
      opacity: 0.35;
      animation: parallax 6s linear infinite;
    }
    .boss-floor {
      position: absolute;
      left: 0;
      right: 0;
      bottom: 18%;
      height: 4px;
      background: linear-gradient(90deg, rgba(255,255,255,0.35), rgba(255,255,255,0.1), rgba(255,255,255,0.35));
      box-shadow: 0 0 18px rgba(90,120,255,0.3);
    }
    .boss-scan {
      position: absolute;
      inset: 0;
      background: repeating-linear-gradient(0deg, rgba(255,255,255,0.04) 0 1px, transparent 1px 3px);
      mix-blend-mode: overlay;
      opacity: 0.6;
      animation: scan 6s linear infinite;
    }
    .boss-flash {
      position: absolute;
      inset: 0;
      background: white;
      opacity: 0;
      pointer-events: none;
    }
    .boss-flash.flash { animation: flash 320ms ease; }
    .context-spiral {
      position: absolute;
      inset: -10%;
      background: repeating-conic-gradient(from 45deg, #0c1224 0deg 15deg, #111a30 15deg 30deg, #182342 30deg 45deg, #0c1224 45deg 60deg);
      opacity: 0;
      pointer-events: none;
      transform: scale(1);
      mix-blend-mode: screen;
      z-index: 5;
    }
    .context-spiral.animate {
      animation: spiralCollapse 1s ease-in forwards;
    }
    @keyframes spiralCollapse {
      0% { opacity: 0.9; transform: scale(1.05) rotate(0deg); }
      60% { opacity: 0.8; transform: scale(0.5) rotate(320deg); }
      100% { opacity: 0; transform: scale(0.05) rotate(540deg); }
    }
    .boss-actors {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: flex-end;
      justify-content: space-between;
      padding: 10% 8% 12% 8%;
      color: #fefefe;
      text-shadow: 1px 1px 0 #000, -1px -1px 0 #000;
      filter: drop-shadow(0 4px 6px rgba(0,0,0,0.6));
      gap: 16px;
    }
    .boss-boss {
      width: 220px;
      height: 140px;
      background-size: contain;
      background-repeat: no-repeat;
      background-position: center;
      image-rendering: pixelated;
      transform: scale(1.35);
      align-self: flex-end;
      animation: bossBob 3s ease-in-out infinite;
    }
    .boss-party {
      display: grid;
      gap: 10px;
      justify-items: end;
      font: 14px/1 "Press Start 2P", "VT323", monospace;
      align-self: flex-end;
    }
    .boss-party .row { display: flex; gap: 6px; }
    .boss-party .tiny {
      width: 20px;
      height: 24px;
      background-size: contain;
      background-repeat: no-repeat;
      background-position: center;
      image-rendering: pixelated;
      border: 1px solid rgba(12, 16, 32, 0.5);
      box-shadow: 0 0 4px rgba(0,0,0,0.35);
      animation: heroBob 2.6s ease-in-out infinite;
    }
    .boss-hud {
      position: absolute;
      left: 8px;
      right: 8px;
      bottom: 10px;
      padding: 10px 12px;
      background: linear-gradient(180deg, #0b1f7a, #0a1a63);
      border: 2px solid #3e5ff6;
      color: #e7f1ff;
      font: 12px/1.4 "Press Start 2P", "VT323", monospace;
      box-shadow: 0 0 14px rgba(0,0,0,0.65);
      display: grid;
      grid-template-columns: 1.2fr 1fr;
      gap: 12px;
      opacity: 0;
      transform: translateY(8px);
      transition: opacity 400ms ease, transform 400ms ease;
    }
    .boss-scene.hud-live .boss-hud { opacity: 1; transform: translateY(0); }
    .boss-hud .hud-title { font-weight: 700; color: #ffd54f; margin-bottom: 4px; }
    .boss-hud .hud-name { font-size: 13px; color: #f5fbff; text-shadow: 1px 1px 0 #0a0f2c; }
    .boss-hud .hud-meta { font-size: 11px; color: #c6d7ff; margin-top: 2px; }
    .hud-bar {
      position: relative;
      height: 7px;
      background: #0a1020;
      border: 1px solid #2746a8;
      overflow: hidden;
      box-shadow: inset 0 0 4px rgba(0,0,0,0.5);
    }
    .hud-bar .fill {
      position: absolute;
      left: 0;
      top: 0;
      bottom: 0;
      width: 0;
      background: linear-gradient(90deg, #4fe1ff, #0ad1ff);
    }
    .hud-section { display: flex; flex-direction: column; gap: 6px; }
    .party-rows { display: flex; flex-direction: column; gap: 4px; }
    .party-row { display: flex; justify-content: space-between; align-items: center; color: #f8fbff; }
    .party-row .party-name { color: #ffd54f; }
    .party-row .party-hp { color: #e7f1ff; font-size: 11px; }
    .party-row.ko { opacity: 0.55; }
    .cmd-row { display: flex; align-items: center; gap: 8px; margin-top: 2px; }
    .cmd-atb {
      flex: 1;
      height: 7px;
      background: #0a1020;
      border: 1px solid #2746a8;
      overflow: hidden;
      box-shadow: inset 0 0 4px rgba(0,0,0,0.5);
      position: relative;
    }
    .cmd-atb .fill {
      position: absolute;
      left: 0; top: 0; bottom: 0;
      width: 0;
      background: linear-gradient(90deg, #5ff3c5, #2ad1ff);
    }
    .cmd-buttons { display: flex; gap: 4px; }
    .cmd-buttons button {
      background: #182342;
      color: #e6f0ff;
      border: 1px solid rgba(255,255,255,0.25);
      padding: 4px 6px;
      font: 11px/1.2 "Press Start 2P", "VT323", monospace;
      cursor: pointer;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .cmd-buttons button:disabled {
      opacity: 0.35;
      cursor: default;
    }
    @keyframes stripes {
      from { background-position-y: 0px; }
      to { background-position-y: -64px; }
    }
    @keyframes parallax {
      from { background-position-x: 0; }
      to { background-position-x: -256px; }
    }
    @keyframes scan {
      from { transform: translateY(0); }
      to { transform: translateY(-6px); }
    }
    @keyframes flash {
      0% { opacity: 0; }
      10% { opacity: 0.7; }
      100% { opacity: 0; }
    }
    @keyframes bossBob {
      0%,100% { transform: scale(1.35) translateY(0); }
      50% { transform: scale(1.35) translateY(-4px); }
    }
    @keyframes heroBob {
      0%,100% { transform: translateY(0); }
      50% { transform: translateY(-3px); }
    }
    .boss-effects {
      position: absolute;
      inset: 0;
      pointer-events: none;
    }
    .dmg-float {
      position: absolute;
      color: #f7f7ff;
      font: 12px/1.1 "Press Start 2P", "VT323", monospace;
      text-shadow: 1px 1px 0 #000, -1px -1px 0 #000;
      animation: floatUp 900ms ease-out forwards;
    }
    .dmg-float.crit { color: #ffea6b; }
    .dmg-float.heal { color: #6bff9d; }
    .hit-spark {
      position: absolute;
      width: 12px;
      height: 12px;
      border-radius: 999px;
      background: radial-gradient(circle, #fff, rgba(255,255,255,0));
      animation: spark 300ms ease-out forwards;
      opacity: 0.9;
    }
    @keyframes floatUp {
      0% { transform: translateY(0) scale(1); opacity: 1; }
      100% { transform: translateY(-28px) scale(1.05); opacity: 0; }
    }
    @keyframes spark {
      0% { transform: scale(0.6); opacity: 0.9; }
      100% { transform: scale(1.6); opacity: 0; }
    }
    .combat-demo-stats { font-family: "VT323", monospace; display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
    .combat-demo-stats div { white-space: pre-line; }
    .combat-demo-log {
      background: #0a0f1f;
      border: 1px solid rgba(255,255,255,0.15);
      padding: 6px;
      min-height: 80px;
      max-height: 120px;
      overflow: auto;
      font-size: 11px;
      line-height: 1.3;
      white-space: pre-line;
    }
    .combat-demo-mute {
      background: none;
      border: none;
      color: #9bb3ff;
      cursor: pointer;
      font: 12px/1.2 "VT323", monospace;
    }
    .combat-demo-section {
      background: #0a1020;
      border: 1px solid rgba(255,255,255,0.08);
      padding: 8px;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .combat-demo-list {
      display: grid;
      grid-template-columns: 1fr;
      gap: 4px;
    }
    .combat-demo-pill {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 6px 8px;
      background: #101831;
      border: 1px solid rgba(255,255,255,0.1);
      color: #e6f0ff;
      font: 12px/1.2 "VT323", monospace;
    }
    .combat-demo-pill .label { display: flex; gap: 6px; align-items: center; }
    .combat-demo-pill button {
      background: #182342;
      border: 1px solid rgba(255,255,255,0.15);
      color: #e6f0ff;
      cursor: pointer;
      padding: 4px 8px;
    }
  `;
  document.head.appendChild(style);

  const bossScene = document.createElement("div");
  bossScene.className = "boss-scene";
  bossScene.innerHTML = `
    <div class="boss-bg"></div>
    <div class="boss-parallax"></div>
    <div class="boss-floor"></div>
    <div class="context-spiral"></div>
    <div class="boss-actors">
      <div class="boss-boss"></div>
      <div class="boss-party">
        <div class="row">
          <div class="tiny"></div><div class="tiny"></div>
        </div>
        <div class="row">
          <div class="tiny"></div><div class="tiny"></div>
        </div>
      </div>
    </div>
    <div class="boss-effects"></div>
    <div class="boss-hud">
      <div class="hud-section">
        <div class="hud-title">Boss</div>
        <div class="hud-name boss-name">???</div>
        <div class="hud-meta boss-hp-text">HP --/--</div>
        <div class="hud-bar boss-bar"><div class="fill boss-hp-fill"></div></div>
      </div>
      <div class="hud-section">
        <div class="hud-title">Party</div>
        <div class="party-rows"></div>
      </div>
    </div>
    <div class="boss-scan"></div>
    <div class="boss-flash"></div>
  `;
  const gameShellHost = document.querySelector(".game-shell") || document.body;
  const gameCanvas =
    (gameShellHost && gameShellHost.querySelector("#c")) ||
    (gameShellHost && gameShellHost.querySelector("canvas")) ||
    document.querySelector("#c") ||
    document.querySelector("canvas");
  if (gameShellHost && !window.__bossSceneHostPositioned) {
    const computedPos = getComputedStyle(gameShellHost).position;
    if (computedPos === "static") gameShellHost.style.position = "relative";
    window.__bossSceneHostPositioned = true;
  }
  gameShellHost.appendChild(bossScene);
  function syncBossSceneToCanvas() {
    if (!bossScene || !gameShellHost) return;
    const shellRect = gameShellHost.getBoundingClientRect();
    const canvasRect = gameCanvas?.getBoundingClientRect?.() || shellRect;
    if (!shellRect.width || !canvasRect.width) return;
    const width = Math.min(canvasRect.width, shellRect.width);
    const height = Math.min(canvasRect.height, shellRect.height);
    const left = Math.max(0, canvasRect.left - shellRect.left);
    const top = Math.max(0, canvasRect.top - shellRect.top);
    bossScene.style.width = `${width}px`;
    bossScene.style.height = `${height}px`;
    bossScene.style.left = `${left}px`;
    bossScene.style.top = `${top}px`;
    bossScene.style.maxWidth = `${width}px`;
    bossScene.style.maxHeight = `${height}px`;
    bossScene.style.right = "auto";
    bossScene.style.bottom = "auto";
  }
  syncBossSceneToCanvas();
  window.addEventListener("resize", syncBossSceneToCanvas);
  if (typeof ResizeObserver !== "undefined") {
    const ro = new ResizeObserver(syncBossSceneToCanvas);
    if (gameCanvas) ro.observe(gameCanvas);
    if (gameShellHost) ro.observe(gameShellHost);
  }
  const bossFlash = bossScene.querySelector(".boss-flash");
  const bossNameEl = bossScene.querySelector(".boss-name");
  const bossHpTextEl = bossScene.querySelector(".boss-hp-text");
  const bossHpFillEl = bossScene.querySelector(".boss-hp-fill");
  const partyRowsEl = bossScene.querySelector(".party-rows");
  const bossSpriteEl = bossScene.querySelector(".boss-boss");
  const heroSpriteEls = Array.from(bossScene.querySelectorAll(".boss-party .tiny"));
  const effectsLayer = bossScene.querySelector(".boss-effects");
  const spiralEl = bossScene.querySelector(".context-spiral");

  bossSpriteEl.style.backgroundImage = `url(${BOSS_SPRITE})`;
  heroSpriteEls.forEach((el, idx) => {
    el.style.backgroundImage = `url(${HERO_SPRITES[idx % HERO_SPRITES.length]})`;
  });

  const toggle = document.createElement("button");
  toggle.className = "combat-demo-toggle";
  toggle.textContent = "Combat Demo";

  const panel = document.createElement("div");
  panel.className = "combat-demo-panel";

  const header = document.createElement("div");
  header.className = "combat-demo-header";
  const title = document.createElement("div");
  title.textContent = "Boss Demo";
  const closeBtn = document.createElement("button");
  closeBtn.className = "combat-demo-mute";
  closeBtn.textContent = "×";
  closeBtn.title = "Hide";
  header.append(title, closeBtn);

  const body = document.createElement("div");
  body.className = "combat-demo-body";

  const stageRow = document.createElement("div");
  stageRow.className = "combat-demo-row";
  const stageLabel = document.createElement("div");
  stageLabel.textContent = "Stage: Lobby";
  const snapshotLabel = document.createElement("div");
  snapshotLabel.style.marginLeft = "auto";
  stageRow.append(stageLabel, snapshotLabel);

  const lobbySection = document.createElement("div");
  lobbySection.className = "combat-demo-section";
  const lobbyTitle = document.createElement("div");
  lobbyTitle.textContent = "Lobby / Voting";
  const lobbyControls = document.createElement("div");
  lobbyControls.className = "combat-demo-row";
  const bossSel = document.createElement("select");
  bossCatalog.forEach((b) => {
    const opt = document.createElement("option");
    opt.value = b.id;
    opt.textContent = b.name;
    bossSel.appendChild(opt);
  });
  bossSel.value = selectedBossId;
  const modeSel = document.createElement("select");
  Object.keys(SPEED_MODES).forEach((id) => {
    const opt = document.createElement("option");
    opt.value = id;
    opt.textContent = id;
    if (id === selectedMode) opt.selected = true;
    modeSel.appendChild(opt);
  });
  const startBtn = document.createElement("button");
  startBtn.textContent = "Start (majority)";
  lobbyControls.append(bossSel, modeSel, startBtn);
  const rosterList = document.createElement("div");
  rosterList.className = "combat-demo-list";
  lobbySection.append(lobbyTitle, lobbyControls, rosterList);

  const controlRow = document.createElement("div");
  controlRow.className = "combat-demo-row";
  const stepBtn = document.createElement("button");
  stepBtn.textContent = "Step";
  const autoBtn = document.createElement("button");
  autoBtn.textContent = "Auto: Off";
  const resetBtn = document.createElement("button");
  resetBtn.textContent = "Reset";
  controlRow.append(stepBtn, autoBtn, resetBtn);

  const stats = document.createElement("div");
  stats.className = "combat-demo-stats";
  const bossStat = document.createElement("div");
  const playersStat = document.createElement("div");
  stats.append(bossStat, playersStat);

  const logBox = document.createElement("div");
  logBox.className = "combat-demo-log";

  const returnBtn = document.createElement("button");
  returnBtn.textContent = "Return to Lobby";
  returnBtn.style.alignSelf = "flex-start";

  body.append(stageRow, lobbySection, controlRow, stats, logBox, returnBtn);
  panel.append(header, body);
  document.body.append(toggle, panel);

  let transitionTimer = null;
  let lastLogIndex = 0;

  function hideBossScene() {
    bossScene.classList.remove("visible", "start", "active");
    bossFlash.classList.remove("flash");
    clearTimeout(transitionTimer);
  }

  function startBossSceneTransition(onDone) {
    bossScene.classList.remove("active");
    bossScene.classList.add("visible", "start");
    bossScene.classList.remove("hud-live");
    bossFlash.classList.add("flash");
    if (spiralEl) {
      spiralEl.classList.remove("animate");
      void spiralEl.offsetWidth; // reflow to restart animation
      spiralEl.classList.add("animate");
    }
    clearTimeout(transitionTimer);
    transitionTimer = setTimeout(() => {
      bossScene.classList.remove("start");
      bossScene.classList.add("active");
      bossFlash.classList.remove("flash");
      bossScene.classList.add("hud-live");
      if (onDone) onDone();
    }, 1200);
  }
  window.__combatDemoStartTransition = startBossSceneTransition;
  __startTransition = startBossSceneTransition;

  function startAtbLoop() {
    stopAtbLoop();
    atbTimer = setInterval(() => {
      if (phase !== "combat") return;
      tick(300);
      state.players.forEach((p) => {
        const rate = Math.max(3, (p.stats.speed || 100) / 35);
        heroAtb[p.id] = Math.min(100, (heroAtb[p.id] ?? 0) + rate);
      });
      renderBossHud();
    }, 320);
  }

  function stopAtbLoop() {
    if (atbTimer) {
      clearInterval(atbTimer);
      atbTimer = null;
    }
  }

  window.__combatDemoStartAtb = startAtbLoop;
  window.__combatDemoStopAtb = stopAtbLoop;

  function findTargetEl(targetId) {
    if (!targetId) return null;
    if (state?.boss?.id === targetId) return bossSpriteEl;
    const idx = state?.players?.findIndex((p) => p.id === targetId) ?? -1;
    if (idx >= 0 && heroSpriteEls[idx]) return heroSpriteEls[idx];
    return null;
  }

  function addEffectEl(el) {
    effectsLayer.appendChild(el);
    setTimeout(() => {
      el.remove();
    }, 1200);
  }

  function showHitSpark(targetId) {
    const elRef = findTargetEl(targetId);
    if (!elRef) return;
    const rect = elRef.getBoundingClientRect();
    const spark = document.createElement("div");
    spark.className = "hit-spark";
    const x = rect.left + rect.width * (0.3 + Math.random() * 0.4);
    const y = rect.top + rect.height * (0.25 + Math.random() * 0.5);
    spark.style.left = `${x}px`;
    spark.style.top = `${y}px`;
    addEffectEl(spark);
  }

  function showDamageFloat(targetId, amount, crit = false, heal = false) {
    const elRef = findTargetEl(targetId);
    if (!elRef) return;
    const rect = elRef.getBoundingClientRect();
    const float = document.createElement("div");
    float.className = crit ? "dmg-float crit" : heal ? "dmg-float heal" : "dmg-float";
    const val = Math.round(Math.abs(amount));
    float.textContent = heal ? `+${val}` : `${val}`;
    const x = rect.left + rect.width * 0.5 + (Math.random() * 10 - 5);
    const y = rect.top + rect.height * 0.1;
    float.style.left = `${x}px`;
    float.style.top = `${y}px`;
    addEffectEl(float);
  }

  function renderBossHud() {
    bossNameEl.textContent = state.boss?.name || "Boss";
    const bossHp = state.boss?.stats.hp ?? 0;
    const bossMax = state.boss?.stats.maxHp || 1;
    const hpPct = Math.max(0, Math.min(1, bossHp / bossMax));
    bossHpTextEl.textContent = `HP ${bossHp}/${bossMax}`;
    bossHpFillEl.style.width = `${(hpPct * 100).toFixed(1)}%`;
    partyRowsEl.innerHTML = state.players
      .map((p) => {
        const pct = Math.max(0, Math.min(1, p.stats.hp / p.stats.maxHp));
        const ko = p.dead || p.kicked;
        const suffix = ko ? " (out)" : "";
        const atb = heroAtb[p.id] ?? 0;
        const ready = atb >= 100 && !ko;
        return `
          <div class="party-row${ko ? " ko" : ""}">
            <span class="party-name">${p.name}</span>
            <span class="party-hp">${p.stats.hp}/${p.stats.maxHp}${suffix}</span>
          </div>
          <div class="hud-bar"><div class="fill" style="width:${(pct * 100).toFixed(1)}%;"></div></div>
          <div class="cmd-row">
            <div class="cmd-atb"><div class="fill" style="width:${Math.min(100, atb).toFixed(1)}%;"></div></div>
            <div class="cmd-buttons">
              <button class="cmd-btn" data-hero="${p.id}" data-cmd="attack" ${ready ? "" : "disabled"}>Fight</button>
              <button class="cmd-btn" data-hero="${p.id}" data-cmd="abilities" ${ready ? "" : "disabled"}>Abilities</button>
              <button class="cmd-btn" data-hero="${p.id}" data-cmd="items" ${ready ? "" : "disabled"}>Items</button>
            </div>
          </div>
        `;
      })
      .join("");
    partyRowsEl.querySelectorAll(".cmd-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const heroId = btn.dataset.hero;
        const cmd = btn.dataset.cmd;
        if (!heroId || !cmd) return;
        issueCommand(heroId, cmd);
      });
    });
  }

  function issueCommand(heroId, cmd) {
    if (phase !== "combat") return;
    const atb = heroAtb[heroId] ?? 0;
    if (atb < 100) return;
    const hero = state.players.find((p) => p.id === heroId);
    if (!hero || hero.dead || hero.kicked) return;
    const finish = () => {
      heroAtb[heroId] = 0;
      render();
    };
    if (cmd === "items") {
      // simple heal to lowest HP ally
      const target = [...state.players].filter((p) => !p.dead && !p.kicked).sort((a, b) => a.stats.hp - b.stats.hp)[0];
      if (target) {
        const heal = Math.max(10, Math.round(target.stats.maxHp * 0.15));
        target.stats.hp = Math.min(target.stats.maxHp, target.stats.hp + heal);
        state.log.push({ type: "damage", sourceId: heroId, targetId: target.id, amount: -heal, heal: true });
        showDamageFloat(target.id, -heal, false, true);
      }
      finish();
      return;
    }
    const abilityId = cmd === "abilities" ? "blast" : "slash";
    intent(heroId, abilityId, [state.boss.id]);
    resolveNextSlotWave(state);
    checkOutcome();
    finish();
  }

  function checkOutcome() {
    if (phase !== "combat") return false;
    if (state.boss.dead || state.boss.stats.hp <= 0) {
      stopAuto();
      finishRun("victory");
      render();
      return true;
    }
    const allOut = state.players.every((p) => p.dead || p.kicked);
    if (allOut) {
      stopAuto();
      finishRun("defeat");
      render();
      return true;
    }
    return false;
  }

  function render() {
    const s = state;
    stageLabel.textContent = `Stage: ${phase}`;
    snapshotLabel.textContent = snapshotInfo
      ? `Snapshot: ${snapshotInfo.partySize}p · ${snapshotInfo.boss} · ${snapshotInfo.mode}`
      : "";
    bossScene.classList.toggle("hud-live", phase === "combat");

    rosterList.innerHTML = "";
    roster.forEach((p) => {
      const row = document.createElement("div");
      row.className = "combat-demo-pill";
      const label = document.createElement("div");
      label.className = "label";
      const dot = document.createElement("div");
      dot.className = `ready-dot ${p.status}`;
      const labelText = document.createElement("div");
      labelText.textContent = `${p.name} (${p.slot})`;
      label.append(dot, labelText);
      const btn = document.createElement("button");
      const actionLabel = p.status === "ready" ? "Not Ready" : "Ready";
      btn.textContent = actionLabel;
      btn.style.opacity = p.status === "ready" ? "1" : p.status === "declined" ? "0.5" : "0.8";
      btn.disabled = phase !== "lobby";
      btn.addEventListener("click", () => {
        if (phase !== "lobby") return;
        if (p.status === "ready") {
          p.status = "pending";
        } else {
          p.status = "ready";
        }
        render();
      });
      const declineBtn = document.createElement("button");
      declineBtn.className = "decline-btn";
      declineBtn.textContent = "×";
      declineBtn.title = "Decline";
      declineBtn.disabled = phase !== "lobby";
      declineBtn.addEventListener("click", () => {
        if (phase !== "lobby") return;
        p.status = "declined";
        render();
      });
      row.append(label, btn, declineBtn);
      rosterList.appendChild(row);
    });
    startBtn.disabled = phase !== "lobby";
    startBtn.textContent = "Start";
    bossSel.disabled = phase !== "lobby";
    modeSel.disabled = phase !== "lobby";
    stepBtn.disabled = phase !== "combat";
    autoBtn.disabled = phase !== "combat";
    resetBtn.disabled = phase !== "combat";
    autoBtn.textContent = autoTimer ? "Auto: On" : "Auto: Off";
    bossStat.textContent =
      phase === "combat" ? `Boss HP: ${s.boss.stats.hp}/${s.boss.stats.maxHp}` : `Boss: ${s.boss?.name || "n/a"}`;
    playersStat.textContent = s.players
      .map((p) => `${p.name}: ${p.stats.hp}/${p.stats.maxHp}${p.dead || p.kicked ? " (out)" : ""}`)
      .join("\n");
    let recent = [];
    if (phase === "combat") {
      recent = [...s.log].slice(-8).map((l) => {
        if (l.type === "damage") return `DMG ${l.sourceId}->${l.targetId}: ${l.amount}`;
        if (l.type === "action") return `ACT ${l.actorId}:${l.abilityId}`;
        if (l.type === "timeout") return `TIMEOUT ${l.actorId} (${l.strikes})`;
        if (l.type === "kick") return `KICK ${l.actorId}`;
        if (l.type === "rescale") return `RESCALE hp x${l.hpScale.toFixed(2)} (${l.activePlayers}p)`;
        if (l.type === "status") return `${l.apply ? "ADD" : "REM"} ${l.statusId} on ${l.targetId}`;
        if (l.type === "reward") return `REWARD rare:${(l.rareChance * 100).toFixed(1)}%`;
        return l.type;
      });
    } else if (phase === "results" && resultsInfo) {
      const lines = [`Result: ${resultsInfo.outcome}`];
      if (resultsInfo.summary) {
        lines.push(
          `Rare: ${(resultsInfo.summary.rareChance * 100).toFixed(1)}%`,
          `Reward x${resultsInfo.summary.rewardMultiplier}`,
          `EXP +${(resultsInfo.summary.expBonus * 100).toFixed(0)}%`,
          `Fee refund: ${resultsInfo.summary.feeRefund}`
        );
      }
      recent = lines;
    } else {
      recent = ["Click Start when majority ready to enter boss."];
    }
    logBox.textContent = recent.join("\n");
    if (phase === "combat") {
      const newLogs = [...s.log].slice(lastLogIndex);
      newLogs.forEach((l) => {
        if (l.type === "damage") {
          showHitSpark(l.targetId);
          const isHeal = l.amount < 0 || l.heal;
          showDamageFloat(l.targetId, l.amount, l.crit, isHeal);
        }
      });
      lastLogIndex = s.log.length;
    } else {
      lastLogIndex = s.log.length;
    }
    renderBossHud();
  }

  function autoIntentAndWave(deltaMs = 500) {
    if (phase !== "combat") return;
    tick(deltaMs);
    for (const p of state.players) {
      if (p.kicked || p.dead) continue;
      if (p.ready || p.selecting) {
        const abilityId = p.id === "p2" ? "blast" : "slash";
        intent(p.id, abilityId, [state.boss.id]);
      }
    }
    // boss auto attacks front row if ready
    const bossActor = state.boss;
    const target = state.players.find((p) => !p.dead && !p.kicked);
    if (bossActor.ready && target) {
      submitActionIntent(state, {
        actorId: bossActor.id,
        abilityId: BASIC_ATTACK_ID,
        targetIds: [target.id],
        slot: bossActor.slot,
        subgroup: bossActor.subgroup,
      });
    }
    resolveNextSlotWave(state);
    checkOutcome();
    render();
  }

  function toggleAuto() {
    if (phase !== "combat") return;
    if (autoTimer) {
      clearInterval(autoTimer);
      autoTimer = null;
      autoBtn.textContent = "Auto: Off";
      return;
    }
    autoBtn.textContent = "Auto: On";
    autoTimer = setInterval(() => {
      if (state.boss.dead || state.players.every((p) => p.dead || p.kicked)) {
        toggleAuto();
        return;
      }
      autoIntentAndWave(400);
    }, 450);
  }

  stepBtn.addEventListener("click", () => autoIntentAndWave(500));
  autoBtn.addEventListener("click", toggleAuto);
  resetBtn.addEventListener("click", () => {
    const mode = modeSel.value;
    reset(mode);
    render();
  });
  startBtn.addEventListener("click", () => {
    selectedBossId = bossSel.value;
    selectedMode = modeSel.value;
    startRun();
    render();
  });
  bossSel.addEventListener("change", () => {
    selectedBossId = bossSel.value;
  });
  modeSel.addEventListener("change", () => {
    selectedMode = modeSel.value;
  });
  toggle.addEventListener("click", () => {
    panel.classList.toggle("visible");
  });
  closeBtn.addEventListener("click", () => panel.classList.remove("visible"));
  returnBtn.addEventListener("click", () => {
    stopAuto();
    stopAtbLoop();
    phase = "lobby";
    resultsInfo = null;
    snapshotInfo = null;
    state = createDemoState(selectedMode, selectedBossId);
    render();
  });

  render();
})();
