const VERSION = "1.1.0";
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
const GRUPOS = [
  { id: "aparencia", titulo: "Apar\xEAncia", chaves: ["dsd-theme-toggle", "hie-trigger-btn", "hie-reset-btn", "hie-done-btn"] },
  { id: "comunicacao", titulo: "Comunica\xE7\xE3o", chaves: ["whatsapp-integration", "email-integration", "instagram-messenger-integration", "wechat-integration"] },
  { id: "negocios", titulo: "Neg\xF3cios", chaves: ["panel-pipedrive", "panel-bling", "panel-mercado-livre", "panel-loja-integrada", "panel-asaas"] },
  { id: "google", titulo: "Google", chaves: ["panel-google-drive", "panel-calendar", "panel-adwords"] },
  { id: "utilidades", titulo: "Utilidades", chaves: ["panel-chatgpt", "panel-maps", "currency-rotator", "weather-sp", "real-time-clock"] },
  { id: "outros", titulo: "Outros", chaves: [] }
];
const CARDS = /* @__PURE__ */ new Set(["currency-rotator", "weather-sp", "real-time-clock"]);
const ROTULOS = {
  "hie-trigger-btn": "Personalizar componentes",
  "hie-reset-btn": "Restaurar ordem",
  "hie-done-btn": "Concluir edi\xE7\xE3o",
  "currency-rotator": "Cota\xE7\xF5es",
  "weather-sp": "Clima S\xE3o Paulo",
  "real-time-clock": "Hor\xE1rio",
  "email-integration": "E-mail",
  "instagram-messenger-integration": "Instagram / Messenger",
  "panel-calendar": "Google Calendar",
  "panel-maps": "Mapas"
};
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
  scrim: null,
  grupos: /* @__PURE__ */ new Map(),
  lock: null,
  fabObservado: null,
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
const humanize = (s) => s.replace(/^panel-/, "").replace(/-integration$/, "").replace(/[-_]+/g, " ").replace(/\b\w/, (c) => c.toUpperCase());
const setAttr = (el, nome, valor) => {
  if (valor === null) {
    if (el.hasAttribute(nome)) el.removeAttribute(nome);
  } else if (el.getAttribute(nome) !== valor) el.setAttribute(nome, valor);
};
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
function chaveDe(el) {
  return el.getAttribute("data-component-key") || el.id || (el.classList.length ? el.classList[0] : el.tagName.toLowerCase());
}
function grupoDe(chave) {
  for (const g of GRUPOS) if (g.chaves.includes(chave)) return g.id;
  return "outros";
}
function prioridadeDe(el) {
  const decl = el.getAttribute("data-mh2-priority") || q("[data-mh2-priority]", el)?.getAttribute("data-mh2-priority");
  if (decl === "1" || decl === "2" || decl === "3") return Number(decl);
  const key = el.getAttribute("data-component-key");
  if (key && PRIORIDADE[key]) return PRIORIDADE[key];
  for (const cls of Array.from(el.classList)) if (PRIORIDADE[cls]) return PRIORIDADE[cls];
  return 3;
}
function rotuloDe(el, chave) {
  if (ROTULOS[chave]) return ROTULOS[chave];
  const alvo = (el.matches('button,a,[role="button"]') ? el : q('button,a,[role="button"],[aria-label],[title]', el)) || el;
  let txt = alvo.getAttribute("aria-label") || alvo.getAttribute("title") || el.getAttribute("data-component-label") || "";
  txt = txt.replace(/\s*[—–-]\s*clique.*$/i, "").replace(/^(Abrir|Mudar para|Ir para)\s+/i, "").trim().replace(/\s+/g, " ");
  if (txt) return txt.charAt(0).toUpperCase() + txt.slice(1);
  const label = el.getAttribute("data-component-label");
  if (label) return label;
  const t = (el.textContent || "").trim().replace(/\s+/g, " ");
  return t || humanize(chave);
}
function criarMais(right) {
  if (state.more && state.more.isConnected) return;
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "mh2-more";
  btn.setAttribute("aria-label", "Mais a\xE7\xF5es");
  btn.setAttribute("aria-haspopup", "dialog");
  btn.setAttribute("aria-expanded", "false");
  btn.setAttribute("aria-controls", "mh2-more-menu");
  btn.setAttribute("data-mh2-own", "");
  btn.innerHTML = '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" focusable="false"><circle cx="5" cy="12" r="2" fill="currentColor"/><circle cx="12" cy="12" r="2" fill="currentColor"/><circle cx="19" cy="12" r="2" fill="currentColor"/></svg>';
  const scrim = document.createElement("div");
  scrim.className = "mh2-scrim";
  scrim.setAttribute("data-mh2-own", "");
  scrim.hidden = true;
  const menu = document.createElement("div");
  menu.id = "mh2-more-menu";
  menu.className = "mh2-more-menu";
  menu.setAttribute("role", "dialog");
  menu.setAttribute("aria-modal", "true");
  menu.setAttribute("aria-label", "Mais a\xE7\xF5es");
  menu.setAttribute("data-mh2-own", "");
  menu.hidden = true;
  const head = document.createElement("div");
  head.className = "mh2-more-head";
  const titulo = document.createElement("span");
  titulo.className = "mh2-more-title";
  titulo.id = "mh2-more-title";
  titulo.textContent = "Mais";
  const fechar = document.createElement("button");
  fechar.type = "button";
  fechar.className = "mh2-more-close";
  fechar.setAttribute("aria-label", "Fechar menu");
  fechar.innerHTML = '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>';
  head.appendChild(titulo);
  head.appendChild(fechar);
  menu.setAttribute("aria-labelledby", "mh2-more-title");
  const corpo = document.createElement("div");
  corpo.className = "mh2-more-body";
  menu.appendChild(head);
  menu.appendChild(corpo);
  right.appendChild(btn);
  right.appendChild(scrim);
  right.appendChild(menu);
  state.more = btn;
  state.menu = menu;
  state.scrim = scrim;
  state.grupos = /* @__PURE__ */ new Map();
  on(btn, "click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    alternarMais();
  });
  on(fechar, "click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    fecharMais(true);
  });
  on(scrim, "click", (e) => {
    e.preventDefault();
    fecharMais(true);
  });
  on(menu, "click", (e) => {
    const t = e.target;
    const item = t.closest(".mh2-more-item");
    if (!item) return;
    const ctrl = t.closest('button, a[href], [role="button"]');
    if (ctrl && item.contains(ctrl)) setTimeout(() => fecharMais(false), 0);
  });
  on(menu, "keydown", (e) => {
    const ke = e;
    if (ke.key === "Escape") {
      e.stopPropagation();
      fecharMais(true);
      return;
    }
    if (ke.key === "Tab") prenderFoco(ke);
  });
  on(btn, "keydown", (e) => {
    if (e.key === "Escape" && state.menu && !state.menu.hidden) {
      e.stopPropagation();
      fecharMais(true);
    }
  });
  on(document, "focusin", (e) => {
    if (!state.menu || state.menu.hidden) return;
    const t = e.target;
    if (state.menu.contains(t) || btn.contains(t)) return;
    fecharMais(false);
  });
  on(document, "touchmove", (e) => {
    if (!state.menu || state.menu.hidden) return;
    const t = e.target;
    if (state.menu.contains(t)) return;
    e.preventDefault();
  }, { passive: false, capture: true });
}
function focaveis(root) {
  return Array.from(root.querySelectorAll('button:not([disabled]),a[href],[role="button"],[tabindex]:not([tabindex="-1"])')).filter((el) => {
    if (el.closest("[hidden]")) return false;
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  });
}
function prenderFoco(e) {
  if (!state.menu) return;
  const lista = focaveis(state.menu);
  if (!lista.length) return;
  const primeiro = lista[0], ultimo = lista[lista.length - 1];
  const ativo = document.activeElement;
  if (e.shiftKey && (ativo === primeiro || !state.menu.contains(ativo))) {
    e.preventDefault();
    ultimo.focus({ preventScroll: true });
  } else if (!e.shiftKey && ativo === ultimo) {
    e.preventDefault();
    primeiro.focus({ preventScroll: true });
  }
}
function alternarMais() {
  if (!state.menu) return;
  if (state.menu.hidden) abrirMais();
  else fecharMais(true);
}
function travarFundo() {
  const main = q('[data-region="main"]');
  const flow = document.documentElement.getAttribute("data-mh2-flow") === "on";
  state.lock = { y: window.scrollY, mainTop: main ? main.scrollTop : 0, flow };
  document.documentElement.style.setProperty("--mh2-lock-top", `-${Math.round(state.lock.y)}px`);
  document.documentElement.setAttribute("data-mh2-more-open", "");
}
function destravarFundo() {
  const lock = state.lock;
  state.lock = null;
  document.documentElement.removeAttribute("data-mh2-more-open");
  for (const p of ["--mh2-lock-top", "--mh2-footer-h", "--mh2-navrail-h"]) document.documentElement.style.removeProperty(p);
  if (!lock) return;
  const main = q('[data-region="main"]');
  if (lock.flow) window.scrollTo({ top: lock.y, left: 0, behavior: "instant" });
  if (main && main.scrollTop !== lock.mainTop) main.scrollTop = lock.mainTop;
}
function abrirMais() {
  if (!state.menu || !state.more || !state.scrim) return;
  state.scrim.hidden = false;
  state.menu.hidden = false;
  state.menu.scrollTop = 0;
  state.more.setAttribute("aria-expanded", "true");
  travarFundo();
  const primeiro = focaveis(state.menu).find((el) => !el.classList.contains("mh2-more-close")) || q(".mh2-more-close", state.menu);
  if (primeiro) primeiro.focus({ preventScroll: true });
}
function fecharMais(devolverFoco) {
  if (!state.menu || !state.more || state.menu.hidden) return;
  state.menu.hidden = true;
  if (state.scrim) state.scrim.hidden = true;
  state.more.setAttribute("aria-expanded", "false");
  destravarFundo();
  if (devolverFoco) state.more.focus({ preventScroll: true });
}
function grupoEl(id) {
  const existente = state.grupos.get(id);
  if (existente && existente.isConnected) return existente;
  const def = GRUPOS.find((g) => g.id === id) || GRUPOS[GRUPOS.length - 1];
  const sec = document.createElement("section");
  sec.className = "mh2-more-group";
  sec.setAttribute("data-mh2-group", def.id);
  sec.setAttribute("data-mh2-own", "");
  sec.setAttribute("aria-labelledby", `mh2-more-group-${def.id}`);
  const h = document.createElement("h3");
  h.className = "mh2-more-group-title";
  h.id = `mh2-more-group-${def.id}`;
  h.textContent = def.titulo;
  const grade = document.createElement("div");
  grade.className = "mh2-more-grid";
  grade.setAttribute("role", "group");
  sec.appendChild(h);
  sec.appendChild(grade);
  const corpo = q(".mh2-more-body", state.menu);
  const ordem = GRUPOS.map((g) => g.id);
  const depois = Array.from(corpo.children).find((c) => ordem.indexOf(c.getAttribute("data-mh2-group") || "") > ordem.indexOf(def.id));
  corpo.insertBefore(sec, depois || null);
  state.grupos.set(def.id, sec);
  return sec;
}
function moverParaMais(el) {
  if (!state.menu || state.moved.some((m) => m.el === el)) return;
  const chave = chaveDe(el);
  const grupo = grupoDe(chave);
  const wrap = document.createElement("div");
  wrap.className = "mh2-more-item" + (CARDS.has(chave) ? " mh2-more-item--card" : "");
  wrap.setAttribute("data-mh2-own", "");
  wrap.setAttribute("data-mh2-key", chave);
  const rot = document.createElement("span");
  rot.className = "mh2-more-label";
  rot.setAttribute("aria-hidden", "true");
  rot.textContent = rotuloDe(el, chave);
  const parent = el.parentElement;
  const next = el.nextSibling;
  if (CARDS.has(chave)) {
    wrap.appendChild(rot);
    wrap.appendChild(el);
  } else {
    wrap.appendChild(el);
    wrap.appendChild(rot);
  }
  const grade = q(".mh2-more-grid", grupoEl(grupo));
  grade.appendChild(wrap);
  state.moved.push({ el, parent, next, wrap, chave, grupo });
  if (el.matches(".header-component-wrapper")) garantirSemantica(el);
}
function devolverTodos() {
  for (const m of state.moved.slice().reverse()) {
    if (m.next && m.next.parentNode === m.parent) m.parent.insertBefore(m.el, m.next);
    else m.parent.appendChild(m.el);
    m.wrap.remove();
  }
  state.moved = [];
  state.grupos = /* @__PURE__ */ new Map();
}
function garantirSemantica(wrapper) {
  const raiz = wrapper.firstElementChild;
  if (!raiz || raiz.matches('button,a[href],input,select,textarea,[role="button"],[tabindex]')) return;
  if (q('button,a[href],[role="button"],[tabindex]', raiz)) return;
  if (getComputedStyle(raiz).cursor !== "pointer") return;
  patchA11y(raiz, { role: "button", tabindex: "0", "aria-label": raiz.getAttribute("aria-label") || raiz.getAttribute("title") || humanize(wrapper.getAttribute("data-component-key") || "A\xE7\xE3o"), "data-mh2-a11y-btn": "" });
}
function patchA11y(el, attrs) {
  if (state.a11y.some((p) => p.el === el)) return;
  const prev = {};
  for (const k of Object.keys(attrs)) prev[k] = el.getAttribute(k);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  state.a11y.push({ el, attrs: prev });
}
function desfazerSemantica() {
  for (const p of state.a11y) for (const [k, v] of Object.entries(p.attrs)) {
    if (v === null) p.el.removeAttribute(k);
    else p.el.setAttribute(k, v);
  }
  state.a11y = [];
}
function teclaAtiva(e) {
  const ke = e;
  if (ke.key !== "Enter" && ke.key !== " ") return;
  const t = ke.target;
  if (!t || !t.matches || !t.matches("[data-mh2-a11y-btn]")) return;
  ke.preventDefault();
  t.click();
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
    right.appendChild(state.scrim);
    right.appendChild(state.menu);
  }
  if (state.more) state.more.hidden = state.moved.length === 0;
}
function desfazerCompacto() {
  fecharMais(false);
  devolverTodos();
  desfazerSemantica();
  if (state.more) {
    state.more.remove();
    state.more = null;
  }
  if (state.scrim) {
    state.scrim.remove();
    state.scrim = null;
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
function syncFlow() {
  const html = document.documentElement;
  const flow = state.mode === "compact" && state.containers.length === 0 && !!q('[data-region="main"]') && !!q('[data-region="footer"]');
  setAttr(html, "data-mh2-flow", flow ? "on" : null);
  const nav = q('[data-region="nav-rail"]');
  let navVisivel = false;
  if (nav) for (const c of Array.from(nav.children)) {
    const cs = getComputedStyle(c);
    if (cs.display !== "none" && cs.visibility !== "hidden" && c.getBoundingClientRect().height > 0) {
      navVisivel = true;
      break;
    }
  }
  setAttr(html, "data-shell-navrail", navVisivel ? "on" : "off");
  const footer = q('[data-region="footer"]');
  const linha = footer ? q(".dsd-footer__bottom", footer) || q(".dsd-footer, .app-footer", footer) : null;
  const borda = footer ? parseFloat(getComputedStyle(q(".dsd-footer, .app-footer", footer) || footer).borderTopWidth) || 0 : 0;
  const alturaRodape = linha ? Math.round(linha.getBoundingClientRect().height + borda) : 0;
  const atual = parseFloat(html.style.getPropertyValue("--mh2-footer-h")) || 0;
  if (alturaRodape > 0 && Math.abs(alturaRodape - atual) >= 1) html.style.setProperty("--mh2-footer-h", `${alturaRodape}px`);
  else if (alturaRodape === 0 && atual) html.style.removeProperty("--mh2-footer-h");
  const navAltura = navVisivel && nav ? Math.round(nav.getBoundingClientRect().height) : 0;
  const navAtual = parseFloat(html.style.getPropertyValue("--mh2-navrail-h")) || 0;
  if (navAltura !== navAtual) {
    if (navAltura) html.style.setProperty("--mh2-navrail-h", `${navAltura}px`);
    else html.style.removeProperty("--mh2-navrail-h");
  }
}
const BADGE_SEL = '.site-header [class*="badge"]:not([class*="mh2"])';
function syncBadges() {
  const site = q(".site-header");
  if (!site) return;
  for (const b of Array.from(document.querySelectorAll(BADGE_SEL))) {
    const n = parseInt((b.textContent || "").trim().replace(/\+$/, ""), 10);
    const pos = Number.isFinite(n) && n > 0;
    setAttr(b, "data-mh2-badge", pos ? "pos" : "zero");
  }
  for (const t of Array.from(site.querySelectorAll('[data-panel-trigger="panel-calendar"]'))) {
    const badge = q(".gcal-badge", t);
    const comContagem = !!badge && badge.getAttribute("data-mh2-badge") === "pos" && getComputedStyle(badge).display !== "none";
    setAttr(t, "data-mh2-dot", comContagem ? "off" : null);
  }
}
function syncPerfilEFab() {
  const html = document.documentElement;
  const role = q(".user-menu-component")?.getAttribute("data-role") || null;
  setAttr(html, "data-mh2-role", role);
  const fab = document.getElementById("cm-devtools");
  if (!fab) return;
  if (state.fabObservado !== fab) {
    observe(fab, agendarSync, { childList: true });
    state.fabObservado = fab;
  }
  const toggle = q(".cm-devtools-toggle", fab);
  if (toggle && !toggle.hasAttribute("role")) patchA11y(toggle, { role: "button", tabindex: "0", "aria-label": "Ferramentas de desenvolvimento", title: "Ferramentas de desenvolvimento", "data-mh2-a11y-btn": "" });
}
function syncTooltips() {
  for (const el of Array.from(document.querySelectorAll(".site-header .traffic-indicator[aria-label]"))) {
    const nome = el.getAttribute("aria-label") || "";
    if (!el.hasAttribute("data-mh2-title")) {
      if (el.getAttribute("title")) continue;
      patchA11y(el, { title: nome, "data-mh2-title": "" });
    } else if (el.getAttribute("title") !== nome) el.setAttribute("title", nome);
  }
}
function syncScroll() {
  const main = q('[data-region="main"]');
  const rolado = !!main && main.scrollTop > 8 || window.scrollY > 8;
  if (rolado) document.documentElement.setAttribute("data-mh2-scrolled", "");
  else document.documentElement.removeAttribute("data-mh2-scrolled");
}
function syncMovidos() {
  for (const m of state.moved) {
    m.wrap.hidden = getComputedStyle(m.el).display === "none";
    const rot = q(".mh2-more-label", m.wrap);
    if (rot) {
      const t = rotuloDe(m.el, m.chave);
      if (rot.textContent !== t) rot.textContent = t;
    }
  }
  for (const sec of state.grupos.values()) {
    const algum = Array.from(sec.querySelectorAll(".mh2-more-item")).some((it) => !it.hidden);
    sec.hidden = !algum;
  }
}
function agendarSync() {
  if (state.raf) return;
  state.raf = requestAnimationFrame(() => {
    state.raf = 0;
    if (!state.active) return;
    syncTicker();
    syncModo();
    syncTitulos();
    syncFlow();
    syncMovidos();
    syncBadges();
    syncPerfilEFab();
    syncTooltips();
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
  syncFlow();
  syncMovidos();
  syncBadges();
  syncPerfilEFab();
  syncTooltips();
  syncScroll();
  const ticker = tickerRegiao();
  if (ticker) observe(ticker, agendarSync, { attributes: true, attributeFilter: ["class", "style", "hidden", "aria-hidden"], childList: true, subtree: true });
  observe(document.body, agendarSync, { attributes: true, attributeFilter: ["data-device", "class"], childList: true });
  const main = q('[data-region="main"]');
  if (main) {
    observe(main, agendarSync, { childList: true, subtree: true, attributes: true, attributeFilter: ["data-shell-titlebar"] });
    on(main, "scroll", syncScroll, { passive: true });
  }
  const nav = q('[data-region="nav-rail"]');
  if (nav) observe(nav, agendarSync, { attributes: true, attributeFilter: ["class", "style", "hidden"], childList: true });
  const right = q(".site-header .header-right");
  if (right) observe(right, agendarSync, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ["class", "style", "hidden", "data-count", "data-status", "aria-label", "data-role", "data-gcal-estado"] });
  const left = q(".site-header .header-left");
  if (left) observe(left, agendarSync, { subtree: true, attributes: true, attributeFilter: ["data-role"] });
  on(window, "resize", agendarSync, { passive: true });
  on(window, "scroll", syncScroll, { passive: true });
  on(window, "hashchange", () => {
    fecharMais(false);
    syncScroll();
    agendarSync();
  });
  on(document, "keydown", teclaAtiva);
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
  state.fabObservado = null;
  if (state.abort) {
    state.abort.abort();
    state.abort = null;
  }
  state.listeners = 0;
  desfazerCompacto();
  desfazerSemantica();
  desfazerTitulos();
  for (const b of Array.from(document.querySelectorAll("[data-mh2-badge]"))) b.removeAttribute("data-mh2-badge");
  for (const t of Array.from(document.querySelectorAll("[data-mh2-dot]"))) t.removeAttribute("data-mh2-dot");
  restaurarViewport();
  document.getElementById(CSS_ID)?.remove();
  for (const p of ["--mh2-lock-top", "--mh2-footer-h", "--mh2-navrail-h"]) document.documentElement.style.removeProperty(p);
  for (const a of ["data-mobile-header-v2", "data-shell-ticker", "data-shell-navrail", "data-mh2-mode", "data-mh2-scrolled", "data-mh2-more-open", "data-mh2-flow", "data-mh2-role"]) document.documentElement.removeAttribute(a);
  state.mode = "wide";
  state.tickerVisible = null;
  state.lock = null;
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
    flow: document.documentElement.getAttribute("data-mh2-flow") === "on",
    listeners: state.listeners,
    observers: state.observers.length,
    moved: state.moved.length,
    a11yPatches: state.a11y.length,
    containersOwned: state.containers.length,
    moreOpen: !!(state.menu && !state.menu.hidden),
    groups: state.grupos.size
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
