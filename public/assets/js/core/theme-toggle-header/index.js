// theme-toggle-header/index.js — toggle de tema (sol/lua) no header.
// @version 2.0.0
// @changelog v2.0.0 — Visual corrigido no tema light (briefing UX §34): o botão agora
//   decide claro/escuro MEDINDO a luminância real do fundo do header (mesmo padrão do
//   indicador de Trânsito v2.1), com superfícies explícitas por tema — sem depender dos
//   tokens --hdr-* (que seguiam dark no light e deixavam o botão como um quadrado preto).
//   Lógica de troca/persistência/fusível intocada.
const BOOT_KEY = "dshowdash_theme_prefs";
const TM_KEY = "theme-preference";
const CM_KEY = "cm_theme";
const KOALA_KEY = "koala.theme";
const HTML = document.documentElement;
let _last = 0;
let _applying = false;
let _fused = false;
let _applyTimes = [];
let _desired = null;
let _revertTimer = null;
let _interval = null;
let _csrf = null;
const SUN = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>';
const MOON = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>';
function nowMs() {
  return typeof performance !== "undefined" && performance.now ? performance.now() : +/* @__PURE__ */ new Date();
}
function readBootPrefs() {
  try {
    return JSON.parse(localStorage.getItem(BOOT_KEY) || "{}") || {};
  } catch (e) {
    return {};
  }
}
function currentTheme() {
  const attr = HTML.getAttribute("data-theme");
  if (attr === "light" || attr === "dark") return attr;
  const t = readBootPrefs().theme;
  if (t === "light" || t === "dark") return t;
  return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}
function teardown() {
  try {
    document.removeEventListener("click", onToggleEvent, true);
  } catch (e) {
  }
  try {
    document.removeEventListener("pointerdown", onToggleEvent, true);
  } catch (e) {
  }
  if (_interval) {
    try {
      clearInterval(_interval);
    } catch (e) {
    }
    _interval = null;
  }
  if (_revertTimer) {
    try {
      clearTimeout(_revertTimer);
    } catch (e) {
    }
    _revertTimer = null;
  }
}
function applyTheme(t) {
  if (_fused || _applying) return;
  if (HTML.getAttribute("data-theme") === t) return;
  const now = nowMs();
  _applyTimes.push(now);
  while (_applyTimes.length && now - _applyTimes[0] > 1e3) _applyTimes.shift();
  if (_applyTimes.length > 5) {
    _fused = true;
    teardown();
    try {
      console.error("[theme-toggle] FUSIVEL disparado (>5 reaplicacoes/1s) — modulo desligado para nao travar a pagina.");
    } catch (e) {
    }
    return;
  }
  _applying = true;
  try {
    HTML.classList.remove("theme-light", "theme-dark", "theme-auto");
    HTML.classList.add("theme-" + t);
    HTML.setAttribute("data-theme", t);
    try {
      const p = readBootPrefs();
      p.theme = t;
      localStorage.setItem(BOOT_KEY, JSON.stringify(p));
    } catch (e) {
    }
    try {
      localStorage.setItem(TM_KEY, t);
    } catch (e) {
    }
    try {
      localStorage.setItem(CM_KEY, t);
    } catch (e) {
    }
    try {
      localStorage.setItem(KOALA_KEY, t);
    } catch (e) {
    }
    try {
      const TM = window.ThemeManager;
      if (TM && typeof TM.setTheme === "function") TM.setTheme(t);
    } catch (e) {
    }
  } finally {
    _applying = false;
  }
}
function scheduleAntiRevert(desired) {
  if (_fused) return;
  _desired = desired;
  if (_revertTimer) {
    clearTimeout(_revertTimer);
  }
  _revertTimer = setTimeout(() => {
    _revertTimer = null;
    if (_fused) return;
    if (_desired && HTML.getAttribute("data-theme") !== _desired) {
      applyTheme(_desired);
      paintAll();
    }
  }, 500);
}
function fetchCsrf(cb) {
  if (_csrf) {
    cb(_csrf);
    return;
  }
  try {
    fetch("/api/auth/check.php", { credentials: "same-origin", headers: { "Accept": "application/json" } }).then((r) => r && r.ok ? r.json() : null).then((d) => {
      const s = d && (d.data || d);
      const tok = s && (s.session && s.session.csrf_token || s.csrf_token);
      _csrf = tok || null;
      cb(_csrf);
    }).catch(() => cb(null));
  } catch (e) {
    cb(null);
  }
}
function persistServer(t) {
  fetchCsrf((csrf) => {
    if (!csrf) return;
    try {
      fetch("/api/user/preferences", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json", "X-CSRF-Token": csrf },
        body: JSON.stringify({ key: "theme", value: t })
      }).then((r) => {
        if (r && r.status === 403) {
          _csrf = null;
        }
      }).catch(() => {
      });
    } catch (e) {
    }
  });
}
// ── Tema visual do BOTÃO por medição (mesmo padrão do Trânsito v2.1) ──
// Lê a cor de fundo real na região do header e decide claro/escuro pela
// luminância — independente de como o app aplica o tema.
function temaClaro() {
  try {
    let no = document.querySelector(".header-right") || document.body;
    let cor = "";
    while (no && no !== HTML) {
      const b = getComputedStyle(no).backgroundColor;
      if (b && b !== "transparent" && !/rgba\([^)]*,\s*0\)$/.test(b)) {
        cor = b;
        break;
      }
      no = no.parentElement;
    }
    if (!cor) cor = getComputedStyle(document.body).backgroundColor || "";
    const m = cor.match(/rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)/);
    if (!m) return false;
    return 0.2126 * +m[1] + 0.7152 * +m[2] + 0.0722 * +m[3] > 140;
  } catch (e) {
    return false;
  }
}
let _temaVisual = null;
function aplicarTemaVisual(forcar) {
  const claro = temaClaro();
  if (!forcar && claro === _temaVisual) return;
  _temaVisual = claro;
  const valor = claro ? "claro" : "escuro";
  const list = document.querySelectorAll("[data-dsd-theme-toggle]");
  for (let i = 0; i < list.length; i++) list[i].setAttribute("data-tema", valor);
}
function paintAll() {
  const dark = currentTheme() === "dark";
  const list = document.querySelectorAll("[data-dsd-theme-toggle]");
  for (let i = 0; i < list.length; i++) {
    const b = list[i];
    b.innerHTML = dark ? SUN : MOON;
    b.setAttribute("aria-pressed", String(dark));
    b.setAttribute("aria-label", dark ? "Mudar para tema claro" : "Mudar para tema escuro");
    b.setAttribute("title", dark ? "Tema claro" : "Tema escuro");
  }
}
function injectStyleOnce() {
  if (document.getElementById("dsd-theme-toggle-style")) return;
  const st = document.createElement("style");
  st.id = "dsd-theme-toggle-style";
  st.textContent = '.dsd-theme-toggle{--tt-bg:#15151d;--tt-bg-hover:#1e1e29;--tt-border:rgba(255,255,255,.12);--tt-border-hover:rgba(129,140,248,.5);--tt-fg:rgba(255,255,255,.72);--tt-fg-forte:rgba(255,255,255,.95);--tt-foco:#818cf8;position:relative;z-index:20;display:inline-flex;align-items:center;justify-content:center;width:36px;height:36px;padding:0;margin:0 4px;border-radius:10px;cursor:pointer;border:1px solid var(--tt-border);background:var(--tt-bg);color:var(--tt-fg);transition:background .15s ease,color .15s ease,border-color .15s ease,box-shadow .15s ease;}.dsd-theme-toggle[data-tema="claro"]{--tt-bg:#ffffff;--tt-bg-hover:#f4f5fa;--tt-border:rgba(15,23,42,.14);--tt-border-hover:rgba(79,70,229,.45);--tt-fg:rgba(15,23,42,.62);--tt-fg-forte:rgba(15,23,42,.92);--tt-foco:#4f46e5;}.dsd-theme-toggle:hover{color:var(--tt-fg-forte);background:var(--tt-bg-hover);border-color:var(--tt-border-hover);box-shadow:0 1px 4px rgba(0,0,0,.12);}.dsd-theme-toggle:focus-visible{outline:2px solid var(--tt-foco);outline-offset:2px;}.dsd-theme-toggle svg{display:block;pointer-events:none;}';
  document.head.appendChild(st);
}
function makeButton() {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "dsd-theme-toggle";
  btn.setAttribute("data-dsd-theme-toggle", "1");
  return btn;
}
function ensureToggle() {
  const right = document.querySelector(".header-right");
  if (!right) return false;
  if (!right.querySelector("[data-dsd-theme-toggle]")) {
    injectStyleOnce();
    right.insertBefore(makeButton(), right.firstChild);
    paintAll();
    aplicarTemaVisual(true);
  }
  return true;
}
function onToggleEvent(ev) {
  if (_fused) return;
  const target = ev.target;
  const b = target && target.closest ? target.closest("[data-dsd-theme-toggle]") : null;
  if (!b) return;
  ev.preventDefault();
  ev.stopPropagation();
  const now = nowMs();
  if (now - _last < 250) return;
  _last = now;
  const desired = currentTheme() === "dark" ? "light" : "dark";
  applyTheme(desired);
  paintAll();
  // feedback visual imediato do próprio botão; a medição confirma no próximo tick
  const list = document.querySelectorAll("[data-dsd-theme-toggle]");
  for (let i = 0; i < list.length; i++) list[i].setAttribute("data-tema", desired === "light" ? "claro" : "escuro");
  _temaVisual = desired === "light";
  setTimeout(() => aplicarTemaVisual(true), 300);
  persistServer(desired);
  scheduleAntiRevert(desired);
}
function start() {
  document.addEventListener("click", onToggleEvent, true);
  document.addEventListener("pointerdown", onToggleEvent, true);
  window.addEventListener("storage", (e) => {
    if (e.key === BOOT_KEY || e.key === TM_KEY) paintAll();
  });
  try {
    localStorage.setItem(KOALA_KEY, currentTheme());
  } catch (e) {
  }
  ensureToggle();
  _interval = setInterval(() => {
    if (_fused) return;
    if (document.hidden) return;
    try {
      localStorage.setItem(KOALA_KEY, currentTheme());
    } catch (e) {
    }
    ensureToggle();
    aplicarTemaVisual(false);
  }, 1e3);
}
if (document.readyState === "complete") {
  start();
} else {
  window.addEventListener("load", start);
}
