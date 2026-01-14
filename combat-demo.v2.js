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

const roster = demoPlayers.map((p, idx) => ({ ...p, ready: idx < 3 }));
let selectedBossId = bossCatalog[0].id;
let selectedMode = "4s";
let phase = "lobby"; // lobby -> combat -> results
let snapshotInfo = null;
let resultsInfo = null;
let autoTimer = null;

function stopAuto() {
  if (autoTimer) {
    clearInterval(autoTimer);
    autoTimer = null;
  }
}

function cloneParticipant(p) {
  const { ready, ...rest } = p;
  return { ...rest, stats: { ...rest.stats } };
}

function createDemoState(mode = "4s", bossId = bossCatalog[0].id, party = roster.filter((r) => r.ready).map(cloneParticipant)) {
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
  state = createDemoState(mode, selectedBossId);
  now = performance.now();
  phase = "combat";
  snapshotInfo = { partySize: state.players.length, boss: state.boss.name, mode };
  resultsInfo = null;
  return state;
}

function startRun() {
  const party = roster.filter((r) => r.ready).map(cloneParticipant);
  if (party.length === 0) return { started: false, reason: "no_ready_players" };
  stopAuto();
  state = createDemoState(selectedMode, selectedBossId, party);
  now = performance.now();
  phase = "combat";
  snapshotInfo = { partySize: party.length, boss: state.boss.name, mode: selectedMode };
  resultsInfo = null;
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
    .combat-demo-body { padding: 8px 10px; gap: 6px; display: flex; flex-direction: column; }
    .combat-demo-row { display: flex; align-items: center; gap: 6px; }
    .combat-demo-row button, .combat-demo-row select {
      background: #182342;
      color: #e6f0ff;
      border: 1px solid rgba(255,255,255,0.15);
      padding: 6px 8px;
      font: 12px/1.2 "VT323", monospace;
      cursor: pointer;
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

    rosterList.innerHTML = "";
    roster.forEach((p) => {
      const row = document.createElement("div");
      row.className = "combat-demo-pill";
      const label = document.createElement("div");
      label.className = "label";
      label.textContent = `${p.name} (${p.slot})`;
      const btn = document.createElement("button");
      btn.textContent = p.ready ? "Ready" : "Not Ready";
      btn.style.opacity = p.ready ? "1" : "0.7";
      btn.disabled = phase !== "lobby";
      btn.addEventListener("click", () => {
        if (phase !== "lobby") return;
        p.ready = !p.ready;
        render();
      });
      row.append(label, btn);
      rosterList.appendChild(row);
    });
    const readyCount = roster.filter((p) => p.ready).length;
    const majority = readyCount >= Math.ceil(roster.length / 2);
    startBtn.disabled = !majority || phase !== "lobby";
    startBtn.textContent = majority ? "Start (majority)" : `Need ${Math.ceil(roster.length / 2) - readyCount} more`;
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
    phase = "lobby";
    resultsInfo = null;
    snapshotInfo = null;
    state = createDemoState(selectedMode, selectedBossId);
    render();
  });

  render();
})();
