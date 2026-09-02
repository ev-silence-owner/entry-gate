const PHI_MS = 1618;
const GOLDEN_TOTAL_MS = 60_000;
const GOLDEN_MIN_EXIT_MS = 10_000;
const PHASES = {
  entry: { start: 0, end: 6472 },
  deepening: { start: 6472, end: 16944 },
  silence: { start: 16944, end: 49304 },
  return: { start: 49304, end: 60000 },
};
const THEMES = [
  { id: "ember", name: "Ember Silence" },
  { id: "graphite", name: "Graphite Drift" },
  { id: "midnight", name: "Midnight Paper" },
  { id: "ion", name: "Ion Haze" },
];
const THOUGHTS = [
  { id: "memory", label: "Wspomnienie" },
  { id: "ahead", label: "Coś, co jeszcze się nie wydarzyło" },
  { id: "sensation", label: "Odczucie" },
  { id: "outer", label: "Dźwięk albo obraz" },
  { id: "none", label: "Nic szczególnego" },
];

const THEME_KEY = "silence.theme.v1";
const LOG_KEY = "silence.golden.v1";
const SPIRAL =
  "M50 108 a 13 13 0 0 1 13 -13 a 21 21 0 0 1 21 21 a 34 34 0 0 1 -34 34";

const app = document.getElementById("app");
const timers = [];


function phaseAt(ms) {
  if (ms >= PHASES.return.start) return "return";
  if (ms >= PHASES.silence.start) return "silence";
  if (ms >= PHASES.deepening.start) return "deepening";
  return "entry";
}

function isTheme(value) {
  return THEMES.some((item) => item.id === value);
}

function getTheme() {
  try {
    const raw = localStorage.getItem(THEME_KEY);
    return isTheme(raw) ? raw : "ember";
  } catch {
    return "ember";
  }
}

function setTheme(id) {
  if (!isTheme(id)) return;
  localStorage.setItem(THEME_KEY, id);
}

function readLog() {
  try {
    const parsed = JSON.parse(localStorage.getItem(LOG_KEY) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveRecord(record) {
  const next = [record, ...readLog().filter((row) => row.sessionId !== record.sessionId)];
  localStorage.setItem(LOG_KEY, JSON.stringify(next));
}

function lastRecord() {
  return readLog()[0] ?? null;
}

function sessionSeconds(record) {
  if (!record) return 0;
  const ms = record.elapsedMs ?? record.userExitedAtMs ?? record.totalDurationMs;
  return Math.max(0, Math.round(ms / 1000));
}

function pathOf() {
  const path = location.pathname.replace(/\/+$/, "") || "/";
  return path === "/index.html" ? "/" : path;
}

function go(path) {
  if (pathOf() === path) {
    render();
    return;
  }
  history.pushState({}, "", path);
  render();
}

function clearSessionTimers() {
  for (const id of timers) window.clearTimeout(id);
  timers.length = 0;
}

function later(ms, fn) {
  timers.push(window.setTimeout(fn, ms));
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&")
    .replaceAll("<", "<")
    .replaceAll(">", ">")
    .replaceAll('"', """);
}

function renderSilence() {
  const theme = getTheme();
  app.innerHTML = `
    <div class="gs-screen" data-phase="entry" data-silence-theme="${theme}" lang="pl">
      <h1 class="sr-only">Golden Silence</h1>
      <button type="button" class="gs-hit" aria-label="Pole ciszy. Dotknij, aby wyjść, gdy będziesz gotowa lub gotów. Nie ma wyniku.">
        <div class="gs-anchor">
          <div class="gs-form gs-form--entry" aria-hidden="true">
            <div class="gs-form-body">
              <svg class="gs-spiral" viewBox="0 0 100 162" aria-hidden="true" focusable="false">
                <path d="${SPIRAL}" fill="none" stroke="currentColor" stroke-width="1.1" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </div>
          </div>
        </div>
        <div class="gs-copy" aria-live="polite">
          <p class="gs-line gs-line--empty" aria-hidden="true">&nbsp;</p>
        </div>
      </button>
      <a class="sr-only" href="/quiet">Opuść tę sesję</a>
    </div>
  `;

  const screen = app.querySelector(".gs-screen");
  const form = app.querySelector(".gs-form");
  const copy = app.querySelector(".gs-copy");
  const hit = app.querySelector(".gs-hit");
  const leave = app.querySelector("a.sr-only");

  let start = 0;
  let armed = false;
  let finished = false;
  let phase = "entry";

  function setLine(text, opacity) {
    if (!text) {
      copy.innerHTML = `<p class="gs-line gs-line--empty" aria-hidden="true">&nbsp;</p>`;
      return;
    }
    copy.innerHTML = `<p class="gs-line" style="opacity:${opacity}">${escapeHtml(text)}</p>`;
  }

  function fadeLine() {
    const line = copy.querySelector(".gs-line");
    if (line) line.style.opacity = "0";
  }

  function setPhase(next) {
    phase = next;
    screen.dataset.phase = next;
    form.className = `gs-form gs-form--${next} gs-form--live`;
  }

  function finish(exited) {
    if (finished) return;
    finished = true;
    const elapsed = Math.min(
      GOLDEN_TOTAL_MS,
      Math.max(0, Math.round(performance.now() - start)),
    );
    saveRecord({
      kind: "golden-silence",
      schemaVersion: 1,
      sessionId: crypto.randomUUID(),
      silenceTheme: getTheme(),
      totalDurationMs: GOLDEN_TOTAL_MS,
      elapsedMs: elapsed,
      userExitedAtMs: exited ? elapsed : null,
      phaseAtExit: phaseAt(elapsed),
      completedAt: new Date().toISOString(),
    });
    screen.classList.add("gs-screen--leaving");
    later(PHI_MS, () => go("/aha"));
  }

  function onTap() {
    if (!armed || finished) return;
    if (performance.now() - start < GOLDEN_MIN_EXIT_MS) return;
    finish(true);
  }

  hit.addEventListener("pointerdown", (event) => {
    if (event.button !== 0) return;
    event.preventDefault();
    onTap();
  });
  hit.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    onTap();
  });
  leave.addEventListener("click", (event) => {
    event.preventDefault();
    go("/quiet");
  });

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      start = performance.now();
      armed = true;
      later(PHI_MS, () => {
        form.classList.add("gs-form--live");
        setLine("Pozwól sobie na ciszę", 0.6);
      });
      later(PHASES.deepening.start, () => {
        setPhase("deepening");
        fadeLine();
      });
      later(PHASES.deepening.start + PHI_MS, () => setLine(""));
      later(PHASES.silence.start, () => setPhase("silence"));
      later(PHASES.return.start, () => setPhase("return"));
      later(PHASES.return.start + 3000, () => setLine("Wracasz gotowa/gotów", 0.7));
      later(GOLDEN_TOTAL_MS, () => finish(false));
    });
  });
}

function renderAha() {
  const record = lastRecord();
  const theme = record?.silenceTheme && isTheme(record.silenceTheme)
    ? record.silenceTheme
    : getTheme();
  const seconds = sessionSeconds(record);
  const picked = record?.thoughtId ?? "";

  app.innerHTML = `
    <div class="gs-screen" data-phase="return" data-silence-theme="${theme}" lang="pl">
      <main class="aha-panel">
        <h1 class="aha-title">Punkt wyjścia</h1>
        <p class="aha-lede">Pozostałaś/eś w ciszy przez ${seconds} sekund. To jest Twój punkt wyjścia.</p>
        <p class="aha-ask">Jeśli jedna myśl była najgłośniejsza, nazwij ją. Nie musisz.</p>
        <ul class="aha-list">
          ${THOUGHTS.map(
            (option) => `
            <li>
              <button type="button" class="aha-choice${picked === option.id ? " aha-choice--on" : ""}" data-thought="${option.id}" aria-pressed="${picked === option.id}">
                ${escapeHtml(option.label)}
              </button>
            </li>`,
          ).join("")}
        </ul>
        <div class="aha-actions">
          <button type="button" class="gs-continue" data-to="/quiet">Dalej</button>
          <a class="aha-skip" href="/">Jeszcze raz</a>
          <button type="button" class="aha-skip" data-to="/quiet">Zostań w ciszy</button>
        </div>
        <fieldset class="gs-themes">
          <legend>Motyw ciszy</legend>
          <div class="gs-theme-row">
            ${THEMES.map(
              (item) => `
              <button type="button" class="gs-theme${theme === item.id ? " gs-theme--on" : ""}" data-silence-theme="${item.id}" aria-pressed="${theme === item.id}" aria-label="${escapeHtml(item.name)}">
                <span class="gs-theme-swatch"></span>
                <span class="gs-theme-name">${escapeHtml(item.name)}</span>
              </button>`,
            ).join("")}
          </div>
        </fieldset>
        <p class="aha-note">Czas w ciszy nie jest wynikiem, profilem ani diagnozą. Zostaje na tym urządzeniu.</p>
      </main>
    </div>
  `;

  const screen = app.querySelector(".gs-screen");

  app.querySelectorAll("[data-thought]").forEach((button) => {
    button.addEventListener("click", () => {
      const current = lastRecord();
      if (current) saveRecord({ ...current, thoughtId: button.dataset.thought });
      app.querySelectorAll("[data-thought]").forEach((node) => {
        const on = node === button;
        node.classList.toggle("aha-choice--on", on);
        node.setAttribute("aria-pressed", String(on));
      });
    });
  });

  app.querySelectorAll(".gs-theme").forEach((button) => {
    button.addEventListener("click", () => {
      const id = button.dataset.silenceTheme;
      setTheme(id);
      screen.dataset.silenceTheme = id;
      app.querySelectorAll(".gs-theme").forEach((node) => {
        const on = node === button;
        node.classList.toggle("gs-theme--on", on);
        node.setAttribute("aria-pressed", String(on));
      });
    });
  });

  app.querySelectorAll("[data-to]").forEach((node) => {
    node.addEventListener("click", (event) => {
      event.preventDefault();
      go(node.dataset.to);
    });
  });
  app.querySelector('a[href="/"]').addEventListener("click", (event) => {
    event.preventDefault();
    go("/");
  });
}

function renderQuiet() {
  const theme = getTheme();
  app.innerHTML = `
    <div class="gs-screen" data-phase="return" data-silence-theme="${theme}" lang="pl">
      <h1 class="sr-only">Cisza</h1>
      <a class="sr-only" href="/">Wróć</a>
    </div>
  `;
  app.querySelector("a").addEventListener("click", (event) => {
    event.preventDefault();
    go("/");
  });
}

function render() {
  clearSessionTimers();
  const path = pathOf();
  if (path === "/aha") {
    renderAha();
    return;
  }
  if (path === "/quiet") {
    renderQuiet();
    return;
  }
  renderSilence();
}

window.addEventListener("popstate", render);
render();
