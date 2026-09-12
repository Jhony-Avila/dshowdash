const VERSION = "1.0.0";
const MODULE_ID = "app-shell/layout-v2";
const FLAG = "as6.shell_layout_v2";
const CSS_ID = "lv2-css";
const CSS_HREF = `/components/app-shell/layout-v2/shell-layout-v2.css?v=${VERSION}`;
const LOCAL_KEY = "dshow.avst.flags.v1";
const RESOLVE_URL = `/api/feature-flags?action=resolve&flag=${encodeURIComponent(FLAG)}`;
const RESOLVE_TIMEOUT_MS = 1500;
const BOOT_TIMEOUT_MS = 9e4;
const SIDEBAR_PREF_KEYS = ["dshowdash-layout-sidebarCollapsed", "dsd-sidebar-collapsed"];
const TABLET_SESSION_KEY = "lv2.tablet.auto-collapsed";
const COMPACT = /* @__PURE__ */ new Set(["mobile-portrait", "mobile-landscape"]);
const state = {
  active: false,
  mode: "wide",
  abort: null,
  observers: [],
  listeners: 0,
  a11y: [],
  toggle: null,
  scrim: null,
  tooltip: null,
  lock: null,
  lastFocus: null,
  raf: 0,
  resolved: null,
  source: "none"
};
const q = (s, root = document) => root.querySelector(s);
const html = () => document.documentElement;
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
const setAttr = (el, nome, valor) => {
  if (valor === null) {
    if (el.hasAttribute(nome)) el.removeAttribute(nome);
  } else if (el.getAttribute(nome) !== valor) el.setAttribute(nome, valor);
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
function patchA11y(el, attrs) {
  if (state.a11y.some((p) => p.el === el)) return;
  const prev = {};
  for (const k of Object.keys(attrs)) prev[k] = el.getAttribute(k);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  state.a11y.push({ el, attrs: prev });
}
function desfazerA11y() {
  for (const p of state.a11y) for (const [k, v] of Object.entries(p.attrs)) {
    if (v === null) p.el.removeAttribute(k);
    else p.el.setAttribute(k, v);
  }
  state.a11y = [];
}
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
function garantirCss() {
  if (document.getElementById(CSS_ID)) return;
  const l = document.createElement("link");
  l.id = CSS_ID;
  l.rel = "stylesheet";
  l.href = CSS_HREF;
  document.head.appendChild(l);
}
const regiao = (nome) => q(`[data-region="${nome}"]`);
function regiaoVisivel(el) {
  if (!el) return false;
  if (el.classList.contains("dsd-shell__region--hidden") || el.getAttribute("data-visibility") === "hidden" || el.hidden) return false;
  return Array.from(el.children).some((c) => getComputedStyle(c).display !== "none" || c.classList.contains("nav-rail--desktop") || c.classList.contains("dsd-sidebar"));
}
function modoAtual() {
  const dev = document.body.getAttribute("data-device");
  if (dev) return COMPACT.has(dev) ? "compact" : dev === "tablet" ? "tablet" : "wide";
  if (document.body.classList.contains("dsd-mobile")) return "compact";
  if (document.body.classList.contains("dsd-tablet")) return "tablet";
  return "wide";
}
function syncModo() {
  const m = modoAtual();
  const anterior = state.mode;
  setAttr(html(), "data-lv2-mode", m);
  if (m === anterior && html().hasAttribute("data-lv2-mode")) {
    if (m === "tablet") tabletInicialRecolhido();
    return;
  }
  state.mode = m;
  if (m !== "compact") fecharGaveta(false);
  if (m === "tablet") tabletInicialRecolhido();
  syncToggleHeader();
}
function tabletInicialRecolhido() {
  let feito = false;
  try {
    feito = sessionStorage.getItem(TABLET_SESSION_KEY) === "1";
  } catch {
  }
  if (feito) return;
  const toggle = q(".dsd-sidebar__toggle");
  if (!toggle) return;
  try {
    sessionStorage.setItem(TABLET_SESSION_KEY, "1");
  } catch {
  }
  let prefs = [];
  try {
    prefs = SIDEBAR_PREF_KEYS.map((k) => localStorage.getItem(k));
  } catch {
    prefs = [null, null];
  }
  if (prefs.some((p) => p !== null)) return;
  if (document.body.classList.contains("sidebar-collapsed")) return;
  toggle.click();
  setTimeout(() => {
    try {
      for (const k of SIDEBAR_PREF_KEYS) localStorage.removeItem(k);
    } catch {
    }
  }, 400);
}
function criarToggleHeader() {
  if (state.toggle && state.toggle.isConnected) return;
  const left = q(".site-header .header-left");
  if (!left) return;
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "lv2-nav-toggle";
  btn.setAttribute("aria-label", "Abrir navega\xE7\xE3o");
  btn.setAttribute("aria-expanded", "false");
  btn.setAttribute("aria-controls", "sidebar");
  btn.setAttribute("data-lv2-own", "");
  btn.setAttribute("data-mh2-priority", "1");
  btn.innerHTML = '<svg class="lv2-ico-open" viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg><svg class="lv2-ico-close" viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>';
  left.insertBefore(btn, left.firstChild);
  state.toggle = btn;
  on(btn, "click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    alternarGaveta();
  });
}
function syncToggleHeader() {
  if (!state.toggle) criarToggleHeader();
  if (!state.toggle) return;
  const left = q(".site-header .header-left");
  if (left && state.toggle.parentElement !== left) left.insertBefore(state.toggle, left.firstChild);
  else if (left && left.firstElementChild !== state.toggle) left.insertBefore(state.toggle, left.firstChild);
}
function criarScrim() {
  if (state.scrim && state.scrim.isConnected) return;
  const s = document.createElement("div");
  s.className = "lv2-scrim";
  s.setAttribute("data-lv2-own", "");
  s.hidden = true;
  (document.getElementById("app-shell") || document.body).appendChild(s);
  state.scrim = s;
  on(s, "click", (e) => {
    e.preventDefault();
    fecharGaveta(true);
  });
}
function focaveisGaveta() {
  const roots = [regiao("nav-rail"), regiao("sidebar")].filter(Boolean);
  const lista = [];
  for (const r of roots) for (const el of Array.from(r.querySelectorAll('button:not([disabled]),a[href],input:not([disabled]),[role="button"],[tabindex]:not([tabindex="-1"])'))) if (visivel(el)) lista.push(el);
  return lista;
}
function gavetaAberta() {
  return html().getAttribute("data-lv2-drawer") === "open";
}
function alternarGaveta() {
  if (gavetaAberta()) fecharGaveta(true);
  else abrirGaveta();
}
function openDrawer() {
  if (state.active && state.mode === "compact") abrirGaveta();
}
function closeDrawer() {
  fecharGaveta(false);
}
function travarFundo() {
  state.lock = { y: window.scrollY };
  html().style.setProperty("--lv2-lock-top", `-${Math.round(state.lock.y)}px`);
}
function destravarFundo() {
  const lock = state.lock;
  state.lock = null;
  html().style.removeProperty("--lv2-lock-top");
  if (lock) window.scrollTo({ top: lock.y, left: 0, behavior: "instant" });
}
function abrirGaveta() {
  if (state.mode !== "compact" || gavetaAberta()) return;
  criarScrim();
  if (html().hasAttribute("data-mh2-more-open")) q(".mh2-more-close")?.click();
  state.lastFocus = document.activeElement || state.toggle;
  travarFundo();
  html().setAttribute("data-lv2-drawer", "open");
  if (state.scrim) state.scrim.hidden = false;
  state.toggle?.setAttribute("aria-expanded", "true");
  state.toggle?.setAttribute("aria-label", "Fechar navega\xE7\xE3o");
  const sb = regiao("sidebar");
  if (sb) sb.scrollTop = 0;
  const primeiro = focaveisGaveta().find((el) => !el.matches("input")) || focaveisGaveta()[0];
  if (primeiro) primeiro.focus({ preventScroll: true });
}
function fecharGaveta(devolverFoco) {
  if (!gavetaAberta()) return;
  html().removeAttribute("data-lv2-drawer");
  if (state.scrim) state.scrim.hidden = true;
  state.toggle?.setAttribute("aria-expanded", "false");
  state.toggle?.setAttribute("aria-label", "Abrir navega\xE7\xE3o");
  destravarFundo();
  if (document.body.classList.contains("sidebar-mobile-open")) q(".dsd-sidebar-overlay")?.click();
  if (devolverFoco && state.toggle) state.toggle.focus({ preventScroll: true });
  state.lastFocus = null;
}
function prenderFoco(e) {
  const lista = focaveisGaveta();
  if (!lista.length) {
    e.preventDefault();
    state.toggle?.focus();
    return;
  }
  const primeiro = lista[0], ultimo = lista[lista.length - 1];
  const ativo = document.activeElement;
  const dentro = !!ativo && lista.includes(ativo);
  if (e.shiftKey && (ativo === primeiro || !dentro)) {
    e.preventDefault();
    ultimo.focus({ preventScroll: true });
  } else if (!e.shiftKey && (ativo === ultimo || !dentro)) {
    e.preventDefault();
    primeiro.focus({ preventScroll: true });
  }
}
function tecladoGlobal(e) {
  const ke = e;
  if (!gavetaAberta()) return;
  if (ke.key === "Escape") {
    ke.stopPropagation();
    fecharGaveta(true);
    return;
  }
  if (ke.key === "Tab") prenderFoco(ke);
}
function criarTooltip() {
  if (state.tooltip && state.tooltip.isConnected) return;
  const t = document.createElement("div");
  t.className = "lv2-tooltip";
  t.id = "lv2-tooltip";
  t.setAttribute("role", "tooltip");
  t.setAttribute("data-lv2-own", "");
  t.hidden = true;
  document.body.appendChild(t);
  state.tooltip = t;
}
function mostrarTooltip(el) {
  if (state.mode === "compact" || !document.body.classList.contains("sidebar-collapsed")) return;
  const texto = el.getAttribute("aria-label") || el.closest("[data-tooltip]")?.getAttribute("data-tooltip") || (el.textContent || "").trim();
  if (!texto || !state.tooltip) return;
  const r = el.getBoundingClientRect();
  state.tooltip.textContent = texto;
  state.tooltip.style.top = `${Math.round(r.top + r.height / 2)}px`;
  state.tooltip.style.left = `${Math.round(r.right + 8)}px`;
  state.tooltip.hidden = false;
  el.setAttribute("aria-describedby", "lv2-tooltip");
}
function esconderTooltip() {
  if (state.tooltip) state.tooltip.hidden = true;
}
function alvoTooltip(t) {
  const el = t;
  if (!el || !el.closest) return null;
  return el.closest(".dsd-shell__region--sidebar .dsd-sidebar__link, .dsd-shell__region--sidebar .dsd-sidebar__group-button, .dsd-shell__region--sidebar .dsd-sidebar__toggle");
}
function syncRegioes() {
  setAttr(html(), "data-lv2-rail", regiaoVisivel(regiao("nav-rail")) ? "on" : "off");
  setAttr(html(), "data-lv2-sidebar", regiaoVisivel(regiao("sidebar")) ? "on" : "off");
}
function syncImersivo() {
  const main = regiao("main");
  const imersivo = !!main && !!q('[data-shell-titlebar="own"], .vc-root[data-vc], [data-avst-react-root]', main);
  setAttr(html(), "data-lv2-immersive", imersivo ? "on" : null);
}
function syncPerfil() {
  setAttr(html(), "data-lv2-role", q(".user-menu-component")?.getAttribute("data-role") || null);
}
function syncRodape() {
  const footer = regiao("footer");
  const linha = footer ? q(".dsd-footer__bottom", footer) || q(".dsd-footer, .app-footer", footer) : null;
  const borda = footer ? parseFloat(getComputedStyle(q(".dsd-footer, .app-footer", footer) || footer).borderTopWidth) || 0 : 0;
  const h = linha ? Math.round(linha.getBoundingClientRect().height + borda) : 0;
  const atual = parseFloat(html().style.getPropertyValue("--lv2-footer-h")) || 0;
  if (h > 0 && Math.abs(h - atual) >= 1) html().style.setProperty("--lv2-footer-h", `${h}px`);
}
function syncNomesSidebar() {
  const sb = regiao("sidebar");
  if (!sb) return;
  for (const a of Array.from(sb.querySelectorAll(".dsd-sidebar__link, .dsd-sidebar__group-button"))) {
    if (a.getAttribute("aria-label")) continue;
    const texto = (q(".dsd-sidebar__item-text, .dsd-sidebar__group-title", a)?.textContent || a.closest("[data-tooltip]")?.getAttribute("data-tooltip") || a.textContent || "").trim().replace(/\s+/g, " ");
    if (texto) patchA11y(a, { "aria-label": texto });
  }
}
function syncScroll() {
  if (window.scrollY > 8) html().setAttribute("data-lv2-scrolled", "");
  else html().removeAttribute("data-lv2-scrolled");
}
function agendarSync() {
  if (state.raf) return;
  state.raf = requestAnimationFrame(() => {
    state.raf = 0;
    if (!state.active) return;
    syncModo();
    syncRegioes();
    syncImersivo();
    syncPerfil();
    syncRodape();
    syncNomesSidebar();
  });
}
function activate() {
  if (state.active) return true;
  const shell = document.getElementById("app-shell");
  if (!shell || !regiao("main")) return false;
  state.active = true;
  state.abort = new AbortController();
  html().setAttribute("data-shell-layout-v2", "on");
  garantirCss();
  criarScrim();
  criarTooltip();
  state.mode = "wide";
  html().removeAttribute("data-lv2-mode");
  syncModo();
  syncRegioes();
  syncImersivo();
  syncPerfil();
  syncRodape();
  syncNomesSidebar();
  syncScroll();
  observe(document.body, agendarSync, { attributes: true, attributeFilter: ["data-device", "class"], childList: true });
  for (const nome of ["nav-rail", "sidebar", "footer"]) {
    const r = regiao(nome);
    if (r) observe(r, agendarSync, { attributes: true, attributeFilter: ["class", "style", "hidden", "data-visibility"], childList: true, subtree: nome === "sidebar" });
  }
  const main = regiao("main");
  if (main) observe(main, agendarSync, { childList: true, subtree: true, attributes: true, attributeFilter: ["data-shell-titlebar", "data-vc"] });
  const left = q(".site-header .header-left");
  if (left) observe(left, agendarSync, { childList: true, subtree: true, attributes: true, attributeFilter: ["data-role"] });
  on(window, "resize", agendarSync, { passive: true });
  on(window, "scroll", syncScroll, { passive: true });
  on(window, "hashchange", () => {
    fecharGaveta(false);
    syncScroll();
    agendarSync();
  });
  on(document, "keydown", tecladoGlobal, { capture: true });
  on(document, "click", (e) => {
    if (!gavetaAberta()) return;
    const t = e.target;
    const ctrl = t.closest && t.closest(".dsd-shell__region--nav-rail .navrail-btn, .dsd-shell__region--sidebar .dsd-sidebar__link");
    if (ctrl) setTimeout(() => fecharGaveta(false), 0);
  });
  on(document, "touchmove", (e) => {
    if (!gavetaAberta()) return;
    const t = e.target;
    const sb = regiao("sidebar"), nr = regiao("nav-rail");
    if (sb && sb.contains(t) || nr && nr.contains(t)) return;
    e.preventDefault();
  }, { passive: false, capture: true });
  on(document, "mouseover", (e) => {
    const el = alvoTooltip(e.target);
    if (el) mostrarTooltip(el);
  }, { passive: true });
  on(document, "mouseout", (e) => {
    if (alvoTooltip(e.target)) esconderTooltip();
  }, { passive: true });
  on(document, "focusin", (e) => {
    const el = alvoTooltip(e.target);
    if (el) mostrarTooltip(el);
    else esconderTooltip();
  });
  on(document, "focusout", () => esconderTooltip());
  on(document, "scroll", () => esconderTooltip(), { capture: true, passive: true });
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
  fecharGaveta(false);
  desfazerA11y();
  for (const el of Array.from(document.querySelectorAll('[aria-describedby="lv2-tooltip"]'))) el.removeAttribute("aria-describedby");
  if (state.toggle) {
    state.toggle.remove();
    state.toggle = null;
  }
  if (state.scrim) {
    state.scrim.remove();
    state.scrim = null;
  }
  if (state.tooltip) {
    state.tooltip.remove();
    state.tooltip = null;
  }
  document.getElementById(CSS_ID)?.remove();
  for (const p of ["--lv2-lock-top", "--lv2-footer-h"]) html().style.removeProperty(p);
  for (const a of ["data-shell-layout-v2", "data-lv2-mode", "data-lv2-rail", "data-lv2-sidebar", "data-lv2-role", "data-lv2-drawer", "data-lv2-scrolled", "data-lv2-immersive"]) html().removeAttribute(a);
  state.mode = "wide";
  state.lock = null;
  state.lastFocus = null;
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
    drawerOpen: gavetaAberta(),
    listeners: state.listeners,
    observers: state.observers.length,
    a11yPatches: state.a11y.length,
    rail: html().getAttribute("data-lv2-rail"),
    sidebar: html().getAttribute("data-lv2-sidebar"),
    immersive: html().getAttribute("data-lv2-immersive"),
    role: html().getAttribute("data-lv2-role"),
    footerH: html().style.getPropertyValue("--lv2-footer-h")
  };
}
function esperarShell() {
  return new Promise((res) => {
    const pronto = () => !!document.getElementById("app-shell") && !!q('[data-region="main"]') && !!q(".site-header");
    if (pronto()) {
      res(true);
      return;
    }
    let mo = null;
    const t = setTimeout(() => {
      mo?.disconnect();
      res(false);
    }, BOOT_TIMEOUT_MS);
    mo = new MutationObserver(() => {
      if (pronto()) {
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
  if (w.__shellLayoutV2) return;
  w.__shellLayoutV2 = { VERSION, MODULE_ID, FLAG, activate, deactivate, info, resolve, openDrawer, closeDrawer };
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
var index_default = { VERSION, MODULE_ID, FLAG, activate, deactivate, info, resolve, openDrawer, closeDrawer };
export {
  FLAG,
  MODULE_ID,
  VERSION,
  activate,
  closeDrawer,
  deactivate,
  index_default as default,
  info,
  openDrawer,
  resolve
};
