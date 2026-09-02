const PHI = 1.618;
const LOG_KEY = "silence.effectlog.v1";
const MODEL = "silence-baseline-v2.1.0";

const GESTURE = {
  deliberate: "A considered touch",
  exploratory: "An exploring touch",
  habitual: "A quick touch",
  emergency_exit: "A delayed or edge touch",
};

const QUADRANT = {
  center: "the field",
  top: "the upper region",
  bottom: "the lower region",
  left: "the left region",
  right: "the right region",
  edge: "an edge",
  unknown: "an unplaced region",
};

const HYPOTHESIS = {
  ready: "Arrived with intent",
  uncertain: "Arrived exploring",
  searching: "Arrived quickly",
  fleeing: "Arrived late, or attention was elsewhere",
};

const TIME = {
  night: "Night",
  dawn: "Dawn",
  morning: "Morning",
  afternoon: "Afternoon",
  evening: "Evening",
};

const state = {
  view: "zero",
  hint: 0,
  pending: null,
  current: null,
  log: readLog(),
  notes: false,
  point: false,
  heldOpen: {},
};

let startAt = 0;
let locked = false;
let timers = [];
let tickId = 0;

function readLog() {
  try {
    const raw = localStorage.getItem(LOG_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((e) => !e.deleted) : [];
  } catch {
    return [];
  }
}

function writeLog(log) {
  localStorage.setItem(LOG_KEY, JSON.stringify(log));
  state.log = log.filter((e) => !e.deleted);
}

function clamp01(n) {
  return Math.min(1, Math.max(0, n));
}

function round3(n) {
  return Math.round(n * 1000) / 1000;
}

function normalizeLocation(x, y, w, h) {
  if (w <= 0 || h <= 0) return "unknown";
  const nx = x / w;
  const ny = y / h;
  const pw = 1 / PHI;
  const ph = 1 / PHI;
  const ox = (1 - pw) / 2;
  const oy = (1 - ph) / 2;
  if (nx >= ox && nx <= ox + pw && ny >= oy && ny <= oy + ph) return "center";
  if (nx < 0.1 || nx > 0.9 || ny < 0.1 || ny > 0.9) return "edge";
  if (ny < 0.33) return "top";
  if (ny > 0.66) return "bottom";
  if (nx < 0.33) return "left";
  if (nx > 0.66) return "right";
  return "unknown";
}

function normalizeTTA(delta) {
  if (delta < 50) return { tta: delta, isValid: false, flag: "AUTOMATED_TAP" };
  if (delta > 30000) return { tta: delta, isValid: false, flag: "TIMEOUT" };
  if (delta > 5000) return { tta: delta, isValid: true, flag: "HESITATION" };
  return { tta: delta, isValid: true };
}

function inferGesture(tta, quadrant, presence) {
  if (tta > 200 && tta < 1000 && quadrant === "center" && presence > 80) {
    return "deliberate";
  }
  if (tta < 200) return "habitual";
  if (tta > 1000 && tta < 3000 && (quadrant === "edge" || quadrant === "unknown")) {
    return "exploratory";
  }
  if (tta > 5000 || (presence < 50 && quadrant === "edge")) return "emergency_exit";
  return "exploratory";
}

function hypothesize(gesture, tta) {
  if (gesture === "deliberate") return "ready";
  if (gesture === "emergency_exit") return "fleeing";
  if (gesture === "habitual" && tta < 100) return "searching";
  return "uncertain";
}

function latencyOf(tta) {
  if (tta < 200) return "fast";
  if (tta <= 1000) return "normal";
  if (tta <= 5000) return "slow";
  return "timeout";
}

function timeOfDay() {
  const h = new Date().getHours();
  if (h >= 5 && h < 7) return "dawn";
  if (h >= 7 && h < 12) return "morning";
  if (h >= 12 && h < 17) return "afternoon";
  if (h >= 17 && h < 21) return "evening";
  return "night";
}

function deviceType() {
  const ua = navigator.userAgent;
  const coarse = matchMedia("(pointer: coarse)").matches;
  const w = innerWidth;
  if (/iPad|Tablet/i.test(ua) || (coarse && w >= 768 && w <= 1366)) return "tablet";
  if (/Mobi|Android/i.test(ua) || (coarse && w < 768)) return "phone";
  return "web";
}

function presence() {
  if (document.visibilityState === "hidden") return 0;
  if (typeof document.hasFocus === "function" && !document.hasFocus()) return 55;
  return 100;
}

function minimalUA() {
  const ua = navigator.userAgent;
  if (/iPhone/i.test(ua)) return "Apple phone";
  if (/iPad/i.test(ua)) return "Apple tablet";
  if (/Android/i.test(ua) && /Mobile/i.test(ua)) return "Android phone";
  if (/Mac/i.test(ua)) return "Mac";
  if (/Win/i.test(ua)) return "Windows";
  if (/Linux/i.test(ua)) return "Linux";
  return "web";
}

function uuid() {
  return crypto.randomUUID();
}

async function sha256Hex(input) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function formatTta(ms) {
  const n = Math.round(ms);
  return n >= 1000 ? `${(n / 1000).toFixed(1)} s` : `${n} ms`;
}

function formatClock(iso) {
  return new Date(iso).toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

function formatDwell(ms) {
  const t = Math.max(0, Math.floor(ms / 1000));
  return `${String(Math.floor(t / 60)).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`;
}

function shortHash(h) {
  return h.length <= 16 ? h : `${h.slice(0, 16)}…`;
}

function numberWord(n) {
  return ["Zero", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten"][n] ?? String(n);
}

function clearTimers() {
  for (const id of timers) clearTimeout(id);
  timers = [];
  if (tickId) {
    clearInterval(tickId);
    tickId = 0;
  }
}

function armZero() {
  clearTimers();
  locked = false;
  state.hint = 0;
  startAt = performance.now();
  timers.push(setTimeout(() => { if (!locked) { state.hint = 1; paint(); } }, 1000));
  timers.push(setTimeout(() => { if (!locked) { state.hint = 2; paint(); } }, 3000));
  timers.push(setTimeout(() => { if (!locked) { state.hint = 3; paint(); } }, 5000));
  timers.push(setTimeout(() => { if (!locked) { state.view = "timeout"; paint(); } }, 30000));
}

function capture(x, y) {
  if (locked || state.view !== "zero") return;
  const raw = normalizeTTA(performance.now() - startAt);
  if (!raw.isValid && raw.flag === "AUTOMATED_TAP") return;
  locked = true;
  clearTimers();
  const quadrant = normalizeLocation(x, y, innerWidth, innerHeight);
  const pres = presence();
  const gesture = inferGesture(raw.tta, quadrant, pres);
  state.pending = {
    tta: raw.tta,
    ttaValid: raw.isValid,
    ttaFlag: raw.flag,
    quadrant,
    nx: round3(clamp01(x / innerWidth)),
    ny: round3(clamp01(y / innerHeight)),
    screenPresence: pres,
    deviceType: deviceType(),
    timeOfDay: timeOfDay(),
    clientTimestamp: new Date().toISOString(),
    userAgent: minimalUA(),
    gesture,
  };
  if (gesture === "emergency_exit" && (pres < 50 || quadrant === "edge")) {
    state.view = "open";
    state.pending = null;
    paint();
    return;
  }
  state.view = "consent";
  paint();
}

async function finish(record) {
  const pending = state.pending;
  if (!pending) {
    go("zero");
    return;
  }
  let effectId = null;
  if (record) {
    const genesis = await buildGenesis(pending, {
      genesisRecord: true,
      behavioralLogging: state.notes,
      locationTracking: state.point,
      analytics: false,
    });
    writeLog([genesis, ...readLog()]);
    effectId = genesis.effectId;
  }
  state.current = {
    effectId,
    recorded: Boolean(effectId),
    gesture: pending.gesture,
    enteredQuietAt: Date.now(),
  };
  state.pending = null;
  state.view = "quiet";
  paint();
  tickId = setInterval(paint, 1000);
}

async function buildGenesis(pending, consent) {
  const effectId = uuid();
  const sessionId = uuid();
  const timestamp = new Date().toISOString();
  const l0 = {
    effectId,
    sessionId,
    timeToFirstTap: Math.round(pending.tta),
    tapLocationQuadrant: pending.quadrant,
    screenPresence: pending.screenPresence,
    deviceType: pending.deviceType,
    clientTimestamp: pending.clientTimestamp,
    timestamp,
    ...(consent.locationTracking ? { tapLocationRegion: { x: pending.nx, y: pending.ny } } : {}),
  };
  const hash = await sha256Hex(JSON.stringify(l0));
  const signature = `sha256:${await sha256Hex(`silence.attest.v1:${hash}:${effectId}`)}`;
  const review = pending.tta < 100 || pending.tta > 5000;
  const record = {
    effectId,
    sessionId,
    timeToFirstTap: Math.round(pending.tta),
    tapLocationQuadrant: pending.quadrant,
    sessionGesture: pending.gesture,
    timeOfDay: pending.timeOfDay,
    deviceType: pending.deviceType,
    screenPresence: pending.screenPresence,
    timestamp,
    clientTimestamp: pending.clientTimestamp,
    userAgent: pending.userAgent,
    consent,
    hash,
    signature,
    valid: pending.ttaValid,
    descendants: [],
    l1: null,
    l2: null,
  };
  if (consent.locationTracking) {
    record.tapLocationRegion = { x: pending.nx, y: pending.ny };
  }
  if (consent.behavioralLogging) {
    record.l1 = {
      quadrant: pending.quadrant,
      sessionGesture: pending.gesture,
      timeOfDay: pending.timeOfDay,
      deviceType: pending.deviceType,
      writtenAt: timestamp,
    };
    record.l2 = {
      baselineStateHypothesis: hypothesize(pending.gesture, pending.tta),
      latencyInterpretation: latencyOf(pending.tta),
      confidence: review ? 0.42 : pending.gesture === "deliberate" ? 0.72 : 0.5,
      modelVersion: MODEL,
      rationale:
        pending.gesture === "deliberate"
          ? `The first touch landed in the field after ${Math.round(pending.tta)} ms.`
          : `The first touch landed in ${pending.quadrant} after ${Math.round(pending.tta)} ms.`,
      needsHumanReview: review,
      reviewed: false,
    };
  }
  return record;
}

function closePresence() {
  const cur = state.current;
  if (!cur?.effectId || !cur.recorded) return;
  const dwell = Date.now() - cur.enteredQuietAt;
  if (dwell < 3000) return;
  const next = readLog().map((entry) => {
    if (entry.effectId !== cur.effectId || !entry.consent.behavioralLogging) return entry;
    return {
      ...entry,
      descendants: [
        ...entry.descendants,
        { kind: "presence", parentEffectId: entry.effectId, dwellMs: dwell, timestamp: new Date().toISOString() },
      ],
    };
  });
  writeLog(next);
}

function go(view) {
  if (state.view === "quiet" && view === "zero") closePresence();
  if (view === "zero") {
    state.current = null;
    state.pending = null;
    state.view = "zero";
    paint();
    requestAnimationFrame(() => requestAnimationFrame(armZero));
    return;
  }
  state.view = view;
  paint();
}

function field(extra = "") {
  return `<div class="field ${extra}" aria-hidden="true"></div>`;
}

function nav(active) {
  return `
    <nav class="nav" aria-label="Silence">
      <button class="brand" type="button" data-go="quiet">Silence</button>
      <ul>
        <li><button type="button" class="${active === "log" ? "on" : ""}" data-go="log">Record</button></li>
        <li><button type="button" class="${active === "settings" ? "on" : ""}" data-go="settings">Settings</button></li>
        <li><button type="button" data-go="zero">Leave</button></li>
      </ul>
    </nav>`;
}

function quadrantMap(q, point) {
  const ids = ["tl", "t", "tr", "l", "c", "r", "bl", "b", "br"];
  const lit = (id) => {
    if (q === "center") return id === "c";
    if (q === "edge") return ["tl", "tr", "bl", "br"].includes(id);
    if (q === "top") return id === "t";
    if (q === "bottom") return id === "b";
    if (q === "left") return id === "l";
    if (q === "right") return id === "r";
    return false;
  };
  const cells = ids.map((id) => `<span class="${lit(id) ? "lit" : ""}"></span>`).join("");
  const p = point
    ? `<i class="dot-point" style="left:${point.x * 100}%;top:${point.y * 100}%"></i>`
    : "";
  return `<div class="grid-map" aria-hidden="true">${cells}${p}</div>`;
}

function renderZero() {
  const text = state.hint === 1 ? "Ready?" : state.hint === 2 ? "Take your time" : state.hint === 3 ? "Still here?" : "Ready?";
  const level = state.hint ? `l${state.hint}` : "off";
  return `
    <button class="tap-anywhere center" type="button" id="zero" aria-label="Screen Zero. Tap anywhere to continue.">
      <h1 class="sr-only">Ekran Zero</h1>
      ${field()}
      <p class="hint ${level}" aria-live="polite">${text}</p>
    </button>`;
}

function renderTimeout() {
  return `
    <button class="tap-anywhere center" type="button" data-go="zero" aria-label="Whenever you are ready. Tap to return.">
      ${field("rest")}
      <p class="hint l3">Whenever you are ready.</p>
    </button>`;
}

function renderOpen() {
  return `
    <button class="tap-anywhere center" type="button" data-go="zero" aria-label="The door is open. Tap to return.">
      <p class="display" style="font-size:1.875rem">The door is open.</p>
      <p class="hint l2">Nothing was kept.</p>
    </button>`;
}

function renderConsent() {
  return `
    <main class="center" style="gap:2.5rem">
      ${field("dim")}
      <div style="text-align:center;max-width:28rem">
        <h1 class="display" style="font-size:clamp(1.75rem,4vw,2.25rem);margin:0 0 1rem">This arrival can be recorded.</h1>
        <p class="lede" style="margin:0 auto">A record would hold the time until you touched the screen, and which region you touched. It would not hold your name.</p>
      </div>
      <div class="consent-box">
        <div class="row">
          <div>
            <label for="notes">Allow pattern notes</label>
            <p class="micro" id="notes-hint">Labels for this arrival, not a reading of you. They can be withdrawn.</p>
          </div>
          <input class="switch" id="notes" type="checkbox" role="switch" ${state.notes ? "checked" : ""} aria-describedby="notes-hint" />
        </div>
        <div class="row">
          <div>
            <label for="point">Remember the point I touched</label>
            <p class="micro" id="point-hint">A point on the screen, not a place in the world. Region only is the default.</p>
          </div>
          <input class="switch" id="point" type="checkbox" role="switch" ${state.point ? "checked" : ""} aria-describedby="point-hint" />
        </div>
      </div>
      <div class="actions">
        <button class="plain" type="button" id="keep">Keep a record</button>
        <span class="dot" aria-hidden="true">·</span>
        <button class="plain" type="button" id="skip">Continue in silence</button>
      </div>
    </main>`;
}

function renderQuiet() {
  const elapsed = state.current ? Date.now() - state.current.enteredQuietAt : 0;
  const showLine = elapsed >= 8000;
  const showClock = elapsed >= 12000;
  return `
    ${nav("quiet")}
    <main class="center" style="min-height:calc(100dvh - 5rem)">
      ${field("quiet")}
      <div style="text-align:center;min-height:4rem">
        <p class="hint ${showLine ? "l2" : "off"}">Nothing is required of you.</p>
        ${showClock ? `<p class="elapsed">${formatDwell(elapsed)}</p>` : ""}
      </div>
    </main>`;
}

function renderLog() {
  const log = state.log;
  const title =
    log.length === 0
      ? "No arrival has been kept."
      : log.length === 1
        ? "One arrival kept."
        : `${numberWord(log.length)} arrivals kept.`;
  const cards = log
    .map((entry) => {
      const l1 = entry.l1 && !entry.l1.archived ? entry.l1 : null;
      const l2 = entry.l2 && !entry.l2.archived ? entry.l2 : null;
      const open = state.heldOpen[entry.effectId] ? "open" : "";
      return `
        <article class="card">
          <div style="display:flex;justify-content:space-between;gap:1rem">
            <div>
              <p class="meta">${formatDate(entry.timestamp)}</p>
              <p class="clock">${formatClock(entry.timestamp)}</p>
            </div>
            ${quadrantMap(entry.tapLocationQuadrant, entry.tapLocationRegion)}
          </div>
          <dl class="facts">
            <div><dt>Time to touch</dt><dd>${formatTta(entry.timeToFirstTap)}</dd></div>
            <div><dt>Region</dt><dd>${QUADRANT[entry.tapLocationQuadrant]}</dd></div>
            <div><dt>Gesture</dt><dd>${l1 ? GESTURE[l1.sessionGesture] : "Not noted"}</dd></div>
            <div><dt>Hour</dt><dd>${TIME[entry.timeOfDay]}</dd></div>
          </dl>
          <ul class="chips">
            <li>L0 · sealed</li>
            <li>L1 · ${l1 ? "noted" : "silent"}</li>
            <li>L2 · ${l2 ? (l2.reviewed ? "read" : "held") : "silent"}</li>
          </ul>
          <p class="seal">Seal ${shortHash(entry.hash)}</p>
          <p class="micro" style="margin:0.25rem 0 0;color:var(--faint);font-size:0.6875rem">Sealed on this device. A local proof, not a server signature.</p>
          ${
            entry.descendants?.[0]
              ? `<p class="lede" style="margin-top:1rem">Sat for ${formatDwell(entry.descendants[0].dwellMs)} after arriving.</p>`
              : ""
          }
          ${
            l2
              ? `<details class="held" data-held="${entry.effectId}" ${open}>
                  <summary>Held note — not a conclusion</summary>
                  <div style="margin-top:0.75rem">
                    <p>${HYPOTHESIS[l2.baselineStateHypothesis]}.</p>
                    <p>${l2.rationale}</p>
                    <p class="micro">Confidence ${Number(l2.confidence).toFixed(2)} · ${l2.modelVersion}${l2.needsHumanReview ? " · flagged for review" : ""}</p>
                    <p class="micro">This is a working note, not a diagnosis, not a profile, and not a reason to treat you differently.</p>
                  </div>
                </details>`
              : ""
          }
        </article>`;
    })
    .join("");
  return `
    ${nav("log")}
    <main class="page">
      <header style="margin-bottom:3rem">
        <h1 class="display" style="font-size:1.875rem;margin:0">${title}</h1>
        <p class="lede">This is your EffectLog. It lives on this device. L0 is a sealed fact. L1 is a label. L2 is a held note, not a conclusion.</p>
      </header>
      ${
        log.length === 0
          ? `<p class="lede"><button class="plain" type="button" data-go="zero">Return to silence</button></p>`
          : cards
      }
    </main>`;
}

function renderSettings() {
  const log = state.log;
  const hasNotes = log.some((e) => e.l1 && !e.l1.archived);
  const hasPoints = log.some((e) => e.tapLocationRegion);
  return `
    ${nav("settings")}
    <main class="page">
      <header style="margin-bottom:3rem">
        <h1 class="display" style="font-size:1.875rem;margin:0">What is kept</h1>
        <p class="lede">Silence does not name you. Records stay on this device. You can withdraw notes, forget points, or erase every arrival.</p>
      </header>
      <p class="meta">Layers</p>
      <div class="stack" style="margin:1rem 0 2.5rem">
        <div class="layer-card"><h3>L0 — Observation</h3><p>Time to first touch, region, device kind, presence. Written once. Sealed. Kept until you erase.</p></div>
        <div class="layer-card"><h3>L1 — Notes</h3><p>A gesture label and the hour of day. Append-only. Withdrawn notes are archived, not rewritten.</p></div>
        <div class="layer-card"><h3>L2 — Held notes</h3><p>A working hypothesis with a model version. Never a diagnosis. Hidden until you choose to read it.</p></div>
      </div>
      <p class="meta">Withdraw</p>
      <div class="stack" style="margin-top:1rem">
        <button class="hairline" type="button" id="revoke" ${hasNotes ? "" : "disabled"}>Withdraw pattern notes</button>
        <button class="hairline" type="button" id="strip" ${hasPoints ? "" : "disabled"}>Forget every point</button>
        <button class="hairline" type="button" id="erase" ${log.length ? "" : "disabled"}>Erase all arrivals</button>
      </div>
      <p class="micro" style="margin-top:1rem;color:var(--faint);font-size:0.6875rem">Erase flags every Genesis as a user request. Nothing is sent onward. There is no account, and no one else can read this log.</p>
    </main>`;
}

function paint() {
  const root = document.getElementById("app");
  const views = {
    zero: renderZero,
    timeout: renderTimeout,
    open: renderOpen,
    consent: renderConsent,
    quiet: renderQuiet,
    log: renderLog,
    settings: renderSettings,
  };
  root.innerHTML = (views[state.view] ?? renderZero)();
}

document.getElementById("app").addEventListener("click", (event) => {
  const t = event.target;
  if (!(t instanceof HTMLElement)) return;
  const goTo = t.closest("[data-go]")?.getAttribute("data-go");
  if (goTo) {
    go(goTo);
    return;
  }
  if (t.id === "zero") {
    capture(event.clientX, event.clientY);
    return;
  }
  if (t.id === "keep") {
    void finish(true);
    return;
  }
  if (t.id === "skip") {
    void finish(false);
    return;
  }
  if (t.id === "revoke") {
    writeLog(readLog().map((e) => ({
      ...e,
      consent: { ...e.consent, behavioralLogging: false },
      l1: e.l1 ? { ...e.l1, archived: true } : null,
      l2: e.l2 ? { ...e.l2, archived: true } : null,
    })));
    paint();
    return;
  }
  if (t.id === "strip") {
    writeLog(readLog().map((e) => {
      const { tapLocationRegion, ...rest } = e;
      return { ...rest, consent: { ...e.consent, locationTracking: false } };
    }));
    paint();
    return;
  }
  if (t.id === "erase") {
    writeLog(readLog().map((e) => ({ ...e, deleted: true, deletionReason: "user request" })));
    paint();
  }
});

document.getElementById("app").addEventListener("change", (event) => {
  const t = event.target;
  if (!(t instanceof HTMLInputElement)) return;
  if (t.id === "notes") state.notes = t.checked;
  if (t.id === "point") state.point = t.checked;
});

document.getElementById("app").addEventListener("toggle", (event) => {
  const t = event.target;
  if (!(t instanceof HTMLDetailsElement) || !t.dataset.held) return;
  state.heldOpen[t.dataset.held] = t.open;
  if (t.open) {
    writeLog(readLog().map((e) => {
      if (e.effectId !== t.dataset.held || !e.l2) return e;
      return { ...e, l2: { ...e.l2, reviewed: true, revisedAt: new Date().toISOString() } };
    }));
  }
}, true);

document.getElementById("app").addEventListener("keydown", (event) => {
  if (state.view !== "zero") return;
  if (event.key !== "Enter" && event.key !== " ") return;
  event.preventDefault();
  capture(innerWidth / 2, innerHeight / 2);
});

paint();
requestAnimationFrame(() => requestAnimationFrame(armZero));
