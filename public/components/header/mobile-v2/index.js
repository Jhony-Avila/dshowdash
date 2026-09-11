const VERSION = "1.0.0";
const MODULE_ID = "header/mobile-v2";
const FLAG = "as6.mobile_header_v2";
const CSS_ID = "mh2-css";
const CSS_HREF = `/components/header/mobile-v2/mobile-header-v2.css?v=${VERSION}`;
const LOCAL_KEY = "dshow.avst.flags.v1";
const RESOLVE_URL = `/api/feature-flags?action=resolve&flag=${encodeURIComponent(FLAG)}`;
const RESOLVE_TIMEOUT_MS = 1500;
const BOOT_TIMEOUT_MS = 9e4;
const PRIORIDADE = {
  "user-menu": 1,
  "notifications": 2,
  "traffic-indicator": 2
};
const MODOS_COMPACTOS = /* @__PURE__ */ new Set(["mobile-portrait", "mobile-landscape", "tablet"]);
const state = {
  active: false,
  mode: "wide",
  abort: null,
  observers: [],
  listeners: 0,
  moved: [],
  a11y: [],
  containers: [],
  metaOriginal: null,
  more: null,
  menu: null,
  raf: 0,
  tickerVisible: null,
  resolved: null,
  source: "none"
};
const q = (s, root = document) => root.querySelector(s);
const on = (t, ev, fn, opts = {}) => {
  if (!state.abort) return;
  t.addEventListener(ev, fn, { ...opts, signal: state.abort.signal });
  state.listeners++;
};
const observe = (target, cb, init) => {
  const mo = new MutationObserver(cb);
  mo.observe(target, init);
  state.observers.push(mo);
  return mo;
};
const visivel = (el) => {
  if (!el) return false;
  for (let n = el; n && n.nodeType === 1; n = n.parentElement) {
    const cs = getComputedStyle(n);
    if (cs.display === "none" || cs.visibility === "hidden") return false;
    if (n.hidden) return false;
  }
  const b = el.getBoundingClientRect();
  return b.width > 0 && b.height > 0;
};
const humanize = (s) => s.replace(/^panel-/, "").replace(/-integration$/, "").replace(/[-_]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
function overrideLocal() {
  try {
    const local = JSON.parse(localStorage.getItem(LOCAL_KEY) ?? "{}");
    if (Object.prototype.hasOwnProperty.call(local, FLAG)) return !!local[FLAG];
  } catch {
  }
  return null;
}
async function resolve() {
  const local = overrideLocal();
  if (local !== null) {
    state.source = "local";
    state.resolved = local;
    return local;
  }
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), RESOLVE_TIMEOUT_MS);
  try {
    const r = await fetch(RESOLVE_URL, { credentials: "include", cache: "no-store", signal: ctrl.signal, headers: { Accept: "application/json" } });
    if (!r.ok) {
      state.source = "default";
      state.resolved = false;
      return false;
    }
    const corpo = await r.json();
    const f = corpo?.data?.flag ?? corpo?.flag;
    const ligada = !!(f && f.enabled === true);
    state.source = "remote";
    state.resolved = ligada;
    return ligada;
  } catch {
    state.source = "default";
    state.resolved = false;
    return false;
  } finally {
    clearTimeout(t);
  }
}
function aplicarViewport() {
  const meta = q('meta[name="viewport"]');
  if (!meta) return;
  if (state.metaOriginal === null) state.metaOriginal = meta.getAttribute("content");
  const atual = meta.getAttribute("content") || "";
  if (!/viewport-fit\s*=/.test(atual)) meta.setAttribute("content", (atual ? atual.replace(/\s*$/, "") + ", " : "") + "viewport-fit=cover");
}
function restaurarViewport() {
  const meta = q('meta[name="viewport"]');
  if (meta && state.metaOriginal !== null) meta.setAttribute("content", state.metaOriginal);
  state.metaOriginal = null;
}
function garantirCss() {
  if (document.getElementById(CSS_ID)) return;
  const l = document.createElement("link");
  l.id = CSS_ID;
  l.rel = "stylesheet";
  l.href = CSS_HREF;
  document.head.appendChild(l);
}
function tickerRegiao() {
  return q('[data-region="ticker"]') || document.getElementById("ticker");
}
function tickerEfetivamenteVisivel() {
  const r = tickerRegiao();
  if (!r) return false;
  if (r.classList.contains("dsd-shell__region--hidden") || r.hidden || r.getAttribute("aria-hidden") === "true") return false;
  const cs = getComputedStyle(r);
  if (cs.display === "none" || cs.visibility === "hidden") return false;
  if (/(^|\s)(ticker--disabled|ticker--hidden|is-empty|ticker--empty)(\s|$)/.test(r.className)) return false;
  const cont = q(".ticker-content-container, .ticker-wrapper", r);
  if (cont && r.classList.contains("news-ticker-component") && cont.childElementCount === 0) return false;
  return true;
}
function syncTicker() {
  const v = tickerEfetivamenteVisivel();
  if (v !== state.tickerVisible) {
    state.tickerVisible = v;
    document.documentElement.setAttribute("data-shell-ticker", v ? "on" : "off");
  }
}
function modoAtual() {
  const dev = document.body.getAttribute("data-device");
  if (dev) return MODOS_COMPACTOS.has(dev) ? "compact" : "wide";
  if (document.body.classList.contains("dsd-mobile") || document.body.classList.contains("dsd-tablet")) return "compact";
  return "wide";
}
function prioridadeDe(el) {
  const decl = el.getAttribute("data-mh2-priority") || q("[data-mh2-priority]", el)?.getAttribute("data-mh2-priority");
  if (decl === "1" || decl === "2" || decl === "3") return Number(decl);
  const key = el.getAttribute("data-component-key");
  if (key && PRIORIDADE[key]) return PRIORIDADE[key];
  for (const cls of Array.from(el.classList)) if (PRIORIDADE[cls]) return PRIORIDADE[cls];
  return 3;
}
function rotuloDe(el) {
  const alvo = (el.matches('button,a,[role="button"]') ? el : q('button,a,[role="button"],[aria-label],[title]', el)) || el;
  const txt = alvo.getAttribute("aria-label") || alvo.getAttribute("title") || (alvo.textContent || "").trim().replace(/\s+/g, " ");
  if (txt) return txt.replace(/^Abrir\s+/i, "").slice(0, 28);
  const key = el.getAttribute("data-component-key");
  return key ? humanize(key) : "A\xE7\xE3o";
}
function criarMais(right) {
  if (state.more && state.more.isConnected) return;
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "mh2-more";
  btn.setAttribute("aria-label", "Mais a\xE7\xF5es");
  btn.setAttribute("aria-haspopup", "true");
  btn.setAttribute("aria-expanded", "false");
  btn.setAttribute("aria-controls", "mh2-more-menu");
  btn.setAttribute("data-mh2-own", "");
  btn.innerHTML = '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" focusable="false"><circle cx="5" cy="12" r="2" fill="currentColor"/><circle cx="12" cy="12" r="2" fill="currentColor"/><circle cx="19" cy="12" r="2" fill="currentColor"/></svg>';
  const menu = document.createElement("div");
  menu.id = "mh2-more-menu";
  menu.className = "mh2-more-menu";
  menu.setAttribute("role", "group");
  menu.setAttribute("aria-label", "Mais a\xE7\xF5es");
  menu.setAttribute("data-mh2-own", "");
  menu.hidden = true;
  right.appendChild(btn);
  right.appendChild(menu);
  state.more = btn;
  state.menu = menu;
  on(btn, "click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    alternarMais();
  });
  on(menu, "click", () => {
    setTimeout(() => fecharMais(false), 0);
  });
  on(menu, "keydown", (e) => {
    if (e.key === "Escape") {
      e.stopPropagation();
      fecharMais(true);
    }
  });
  on(btn, "keydown", (e) => {
    if (e.key === "Escape" && state.menu && !state.menu.hidden) {
      e.stopPropagation();
      fecharMais(true);
    }
  });
  on(document, "pointerdown", (e) => {
    if (!state.menu || state.menu.hidden) return;
    const t = e.target;
    if (state.menu.contains(t) || btn.contains(t)) return;
    fecharMais(false);
  }, { capture: true });
  on(document, "focusin", (e) => {
    if (!state.menu || state.menu.hidden) return;
    const t = e.target;
    if (state.menu.contains(t) || btn.contains(t)) return;
    fecharMais(false);
  });
}
function alternarMais() {
  if (!state.menu) return;
  if (state.menu.hidden) abrirMais();
  else fecharMais(true);
}
function abrirMais() {
  if (!state.menu || !state.more) return;
  state.menu.hidden = false;
  state.more.setAttribute("aria-expanded", "true");
  document.documentElement.setAttribute("data-mh2-more-open", "");
  const primeiro = q('button:not([disabled]),a[href],[role="button"],[tabindex]:not([tabindex="-1"])', state.menu);
  if (primeiro) primeiro.focus({ preventScroll: true });
}
function fecharMais(devolverFoco) {
  if (!state.menu || !state.more || state.menu.hidden) return;
  state.menu.hidden = true;
  state.more.setAttribute("aria-expanded", "false");
  document.documentElement.removeAttribute("data-mh2-more-open");
  if (devolverFoco) state.more.focus({ preventScroll: true });
}
function moverParaMais(el) {
  if (!state.menu || state.moved.some((m) => m.el === el)) return;
  const wrap = document.createElement("div");
  wrap.className = "mh2-more-item";
  wrap.setAttribute("data-mh2-own", "");
  const rot = document.createElement("span");
  rot.className = "mh2-more-label";
  rot.setAttribute("aria-hidden", "true");
  rot.textContent = rotuloDe(el);
  if (rot.textContent === (el.textContent || "").trim().replace(/\s+/g, " ").slice(0, 28)) rot.hidden = true;
  const parent = el.parentElement;
  const next = el.nextSibling;
  wrap.appendChild(el);
  wrap.appendChild(rot);
  state.menu.appendChild(wrap);
  state.moved.push({ el, parent, next, wrap });
}
function devolverTodos() {
  for (const m of state.moved.slice().reverse()) {
    if (m.next && m.next.parentNode === m.parent) m.parent.insertBefore(m.el, m.next);
    else m.parent.appendChild(m.el);
    m.wrap.remove();
  }
  state.moved = [];
}
function garantirSemantica(wrapper) {
  const raiz = wrapper.firstElementChild;
  if (!raiz || raiz.matches('button,a[href],input,select,textarea,[role="button"],[tabindex]')) return;
  if (q('button,a[href],[role="button"],[tabindex]', raiz)) return;
  if (getComputedStyle(raiz).cursor !== "pointer") return;
  const prev = { role: raiz.getAttribute("role"), tabindex: raiz.getAttribute("tabindex"), "aria-label": raiz.getAttribute("aria-label") };
  raiz.setAttribute("role", "button");
  raiz.setAttribute("tabindex", "0");
  if (!raiz.getAttribute("aria-label")) raiz.setAttribute("aria-label", raiz.getAttribute("title") || humanize(wrapper.getAttribute("data-component-key") || "A\xE7\xE3o"));
  on(raiz, "keydown", (e) => {
    const k = e.key;
    if (k === "Enter" || k === " ") {
      e.preventDefault();
      raiz.click();
    }
  });
  state.a11y.push({ el: raiz, attrs: prev });
}
function desfazerSemantica() {
  for (const p of state.a11y) for (const [k, v] of Object.entries(p.attrs)) {
    if (v === null) p.el.removeAttribute(k);
    else p.el.setAttribute(k, v);
  }
  state.a11y = [];
}
function comporCompacto() {
  const right = q(".site-header .header-right");
  const left = q(".site-header .header-left");
  if (!right) return;
  criarMais(right);
  const candidatos = [];
  for (const el of Array.from(right.children)) {
    if (el.hasAttribute("data-mh2-own")) continue;
    if (getComputedStyle(el).display === "none") continue;
    candidatos.push(el);
  }
  if (left) for (const el of Array.from(left.children)) {
    if (!el.hasAttribute("data-mh2-own") && prioridadeDe(el) === 3 && getComputedStyle(el).display !== "none") candidatos.push(el);
  }
  for (const el of candidatos) {
    const p = prioridadeDe(el);
    if (p === 3) moverParaMais(el);
    else if (el.matches(".header-component-wrapper")) garantirSemantica(el);
  }
  if (left) for (const el of Array.from(left.querySelectorAll(".header-component-wrapper"))) garantirSemantica(el);
  if (state.more && right.lastElementChild !== state.menu) {
    right.appendChild(state.more);
    right.appendChild(state.menu);
  }
  if (state.menu && state.menu.childElementCount === 0 && state.more) state.more.hidden = true;
  else if (state.more) state.more.hidden = false;
}
function desfazerCompacto() {
  fecharMais(false);
  devolverTodos();
  desfazerSemantica();
  if (state.more) {
    state.more.remove();
    state.more = null;
  }
  if (state.menu) {
    state.menu.remove();
    state.menu = null;
  }
}
function syncModo() {
  const m = modoAtual();
  document.documentElement.setAttribute("data-mh2-mode", m);
  if (m === state.mode && (m === "wide" || state.more && state.more.isConnected)) {
    if (m === "compact") comporCompacto();
    return;
  }
  state.mode = m;
  if (m === "compact") comporCompacto();
  else desfazerCompacto();
}
function syncTitulos() {
  const main = q('[data-region="main"]');
  if (!main) return;
  const vistos = /* @__PURE__ */ new Set();
  for (const c of Array.from(main.querySelectorAll(".dsd-container"))) {
    vistos.add(c);
    const own = !!q('[data-shell-titlebar="own"]', c);
    const titulo = q(".dsd-container__header .dsd-container__title", c);
    if (own) {
      if (c.getAttribute("data-shell-titlebar") !== "owned") {
        c.setAttribute("data-shell-titlebar", "owned");
        state.containers.push(c);
      }
      if (titulo && !titulo.getAttribute("role")) {
        titulo.setAttribute("role", "heading");
        titulo.setAttribute("aria-level", "1");
        titulo.setAttribute("data-mh2-heading", "");
      }
    } else if (c.getAttribute("data-shell-titlebar") === "owned") {
      c.removeAttribute("data-shell-titlebar");
      if (titulo && titulo.hasAttribute("data-mh2-heading")) {
        titulo.removeAttribute("role");
        titulo.removeAttribute("aria-level");
        titulo.removeAttribute("data-mh2-heading");
      }
      state.containers = state.containers.filter((x) => x !== c);
    }
  }
  state.containers = state.containers.filter((c) => c.isConnected && vistos.has(c) && c.getAttribute("data-shell-titlebar") === "owned");
}
function desfazerTitulos() {
  for (const c of state.containers) {
    c.removeAttribute("data-shell-titlebar");
    const t = q(".dsd-container__header .dsd-container__title", c);
    if (t && t.hasAttribute("data-mh2-heading")) {
      t.removeAttribute("role");
      t.removeAttribute("aria-level");
      t.removeAttribute("data-mh2-heading");
    }
  }
  state.containers = [];
}
function syncScroll() {
  const main = q('[data-region="main"]');
  const rolado = !!main && main.scrollTop > 8;
  if (rolado) document.documentElement.setAttribute("data-mh2-scrolled", "");
  else document.documentElement.removeAttribute("data-mh2-scrolled");
}
function syncMovidos() {
  for (const m of state.moved) m.wrap.hidden = getComputedStyle(m.el).display === "none";
}
function agendarSync() {
  if (state.raf) return;
  state.raf = requestAnimationFrame(() => {
    state.raf = 0;
    if (!state.active) return;
    syncTicker();
    syncModo();
    syncTitulos();
    syncMovidos();
  });
}
function activate() {
  if (state.active) return true;
  const site = q(".site-header");
  if (!site) return false;
  state.active = true;
  state.abort = new AbortController();
  document.documentElement.setAttribute("data-mobile-header-v2", "on");
  garantirCss();
  aplicarViewport();
  syncTicker();
  syncModo();
  syncTitulos();
  syncMovidos();
  syncScroll();
  const ticker = tickerRegiao();
  if (ticker) observe(ticker, agendarSync, { attributes: true, attributeFilter: ["class", "style", "hidden", "aria-hidden"], childList: true, subtree: true });
  observe(document.body, agendarSync, { attributes: true, attributeFilter: ["data-device", "class"] });
  const main = q('[data-region="main"]');
  if (main) {
    observe(main, agendarSync, { childList: true, subtree: true, attributes: true, attributeFilter: ["data-shell-titlebar"] });
    on(main, "scroll", syncScroll, { passive: true });
  }
  const right = q(".site-header .header-right");
  if (right) observe(right, agendarSync, { childList: true, subtree: true, attributes: true, attributeFilter: ["class", "style", "hidden"] });
  on(window, "resize", agendarSync, { passive: true });
  on(window, "hashchange", () => {
    syncScroll();
    agendarSync();
  });
  return true;
}
function deactivate() {
  if (!state.active) return;
  state.active = false;
  if (state.raf) {
    cancelAnimationFrame(state.raf);
    state.raf = 0;
  }
  for (const mo of state.observers) mo.disconnect();
  state.observers = [];
  if (state.abort) {
    state.abort.abort();
    state.abort = null;
  }
  state.listeners = 0;
  desfazerCompacto();
  desfazerTitulos();
  restaurarViewport();
  document.getElementById(CSS_ID)?.remove();
  for (const a of ["data-mobile-header-v2", "data-shell-ticker", "data-mh2-mode", "data-mh2-scrolled", "data-mh2-more-open"]) document.documentElement.removeAttribute(a);
  state.mode = "wide";
  state.tickerVisible = null;
}
function info() {
  return {
    version: VERSION,
    moduleId: MODULE_ID,
    flag: FLAG,
    active: state.active,
    resolved: state.resolved,
    source: state.source,
    mode: state.mode,
    tickerVisible: state.tickerVisible,
    listeners: state.listeners,
    observers: state.observers.length,
    moved: state.moved.length,
    a11yPatches: state.a11y.length,
    containersOwned: state.containers.length,
    moreOpen: !!(state.menu && !state.menu.hidden)
  };
}
function esperarShell() {
  return new Promise((res) => {
    if (q(".site-header") && q('[data-region="main"]')) {
      res(true);
      return;
    }
    let mo = null;
    const t = setTimeout(() => {
      mo?.disconnect();
      res(false);
    }, BOOT_TIMEOUT_MS);
    mo = new MutationObserver(() => {
      if (q(".site-header") && q('[data-region="main"]')) {
        clearTimeout(t);
        mo?.disconnect();
        res(true);
      }
    });
    mo.observe(document.documentElement, { childList: true, subtree: true });
  });
}
async function boot() {
  const w = window;
  if (w.__mobileHeaderV2) return;
  w.__mobileHeaderV2 = { VERSION, MODULE_ID, FLAG, activate, deactivate, info, resolve };
  const pronto = await esperarShell();
  if (!pronto) return;
  const ligada = await resolve();
  if (!ligada) return;
  requestAnimationFrame(() => {
    activate();
  });
}
if (typeof window !== "undefined" && typeof document !== "undefined") {
  if (document.readyState === "complete") void boot();
  else window.addEventListener("load", () => {
    void boot();
  }, { once: true });
}
var index_default = { VERSION, MODULE_ID, FLAG, activate, deactivate, info, resolve };
export {
  FLAG,
  MODULE_ID,
  VERSION,
  activate,
  deactivate,
  index_default as default,
  info,
  resolve
};
