/**
 * Header Mobile V2 — composição canônica do topo (safe area → header → ticker → main).
 * @module  components/header/mobile-v2
 * @version 1.1.0  — FONTE (TS). Irmão index.js é o shipado (transpile 1:1 via
 *          scripts/header/build-mobile-header-v2.sh — nunca editar o .js à mão).
 * @created 2026-09-11 (lote as6.mobile_header_v2 — docs/AVATAR-STUDIO-5/23-MOBILE-HEADER-V2.md)
 * @changelog 1.1.1 (composição com as6.shell_layout_v2, decisão #88): com o layout v2 ON o shell é dele —
 *          este módulo não liga o próprio fluxo nem mede o rodapé; a trava de scroll do menu "Mais" usa o
 *          mesmo travamento de documento; abrir o "Mais" fecha a gaveta de navegação (e vice-versa).
 * @changelog 1.1.0 (rodada 2 — decisões #80–#87): menu "Mais" vira GAVETA própria (grupos,
 *          grade 3/2 colunas, cards p/ itens dinâmicos, fechar explícito, foco preso, scroll do
 *          fundo travado com posição preservada); badges com contador ≤ 0 não renderizam e o
 *          Google Calendar nunca mostra ponto + número ao mesmo tempo; fluxo vertical real no
 *          dashboard compacto (main e rodapé no fluxo, sem vão); FAB de devtools atrás do gate
 *          de perfil existente (data-role do user-menu) + nome acessível; chevron/avatar/tooltip.
 *
 * ADITIVO e FAIL-CLOSED (§651): com a flag `as6.mobile_header_v2` OFF este módulo
 * NÃO toca no DOM, NÃO injeta CSS e NÃO altera a meta viewport — o shell fica
 * byte a byte como hoje. A flag é resolvida pelo mecanismo oficial já existente:
 *   1) override local de dev (`localStorage['dshow.avst.flags.v1']`, mesma chave do
 *      Avatar Studio)  2) `/api/feature-flags?action=resolve&flag=…` (por usuário,
 *      credentials include, timeout curto)  3) padrão OFF.
 *
 * O que faz com a flag ON (decisões #71–#87 no doc 23):
 *   - liga `html[data-mobile-header-v2="on"]` e injeta mobile-header-v2.css, que define o
 *     CONTRATO ÚNICO de dimensões (--shell-safe-top / --shell-header-content-height /
 *     --shell-header-total-height / --shell-ticker-height / --shell-top-stack-height) e
 *     remapeia os tokens antigos como ALIASES de transição;
 *   - `viewport-fit=cover` na meta viewport (só com a flag ON);
 *   - `html[data-shell-ticker="on|off"]` medido do ticker EFETIVAMENTE visível;
 *   - modo compacto derivado do DETECTOR CANÔNICO (`body[data-device]`): move ações
 *     secundárias (P3) do header para a gaveta "Mais", garante alvos 44×44, nome
 *     acessível/teclado nos controles que não tinham;
 *   - `data-shell-titlebar="own"` (capacidade GENÉRICA do shell) — título externo compacto;
 *   - `data-mh2-flow="on"` no dashboard compacto: main/rodapé em fluxo (documento rola);
 *   - badges: `data-mh2-badge="zero|pos"` medido do texto do contador (o componente é dono
 *     do valor; o shell só decide render) e `data-mh2-dot="off"` no Calendar com contagem;
 *   - `data-mh2-role` espelha o gate de perfil já existente (user-menu `data-role`);
 *   - Tudo idempotente, com cleanup total (`deactivate()`), sem observers acumulados.
 */
'use strict';

export const VERSION = '1.1.1';
export const MODULE_ID = 'header/mobile-v2';
export const FLAG = 'as6.mobile_header_v2';

const CSS_ID = 'mh2-css';
const CSS_HREF = `/components/header/mobile-v2/mobile-header-v2.css?v=${VERSION}`;
const LOCAL_KEY = 'dshow.avst.flags.v1';
const RESOLVE_URL = `/api/feature-flags?action=resolve&flag=${encodeURIComponent(FLAG)}`;
const RESOLVE_TIMEOUT_MS = 1500;
const BOOT_TIMEOUT_MS = 90000;

/**
 * Política de prioridade responsiva (§4.4). Chave = `data-component-key` do wrapper OU
 * token de classe do controle standalone. Ausente = P3 (secundário → menu "Mais"): o
 * padrão fail-safe é SAIR da barra, só quem é explicitamente P1/P2 fica.
 */
const PRIORIDADE: Record<string, 1 | 2 | 3> = {
  'user-menu': 1,
  'notifications': 2,
  'traffic-indicator': 2,
};
const MODOS_COMPACTOS = new Set(['mobile-portrait', 'mobile-landscape', 'tablet']);

/** Grupos da gaveta (decisão #81) — ordem de exibição; chave = data-component-key / id / classe. */
const GRUPOS: Array<{ id: string; titulo: string; chaves: string[] }> = [
  { id: 'aparencia', titulo: 'Aparência', chaves: ['dsd-theme-toggle', 'hie-trigger-btn', 'hie-reset-btn', 'hie-done-btn'] },
  { id: 'comunicacao', titulo: 'Comunicação', chaves: ['whatsapp-integration', 'email-integration', 'instagram-messenger-integration', 'wechat-integration'] },
  { id: 'negocios', titulo: 'Negócios', chaves: ['panel-pipedrive', 'panel-bling', 'panel-mercado-livre', 'panel-loja-integrada', 'panel-asaas'] },
  { id: 'google', titulo: 'Google', chaves: ['panel-google-drive', 'panel-calendar', 'panel-adwords'] },
  { id: 'utilidades', titulo: 'Utilidades', chaves: ['panel-chatgpt', 'panel-maps', 'currency-rotator', 'weather-sp', 'real-time-clock'] },
  { id: 'outros', titulo: 'Outros', chaves: [] },
];
/** Itens dinâmicos (valor vivo) viram CARD próprio, não atalho de app (decisão #81). */
const CARDS = new Set(['currency-rotator', 'weather-sp', 'real-time-clock']);
/** Rótulos curtos (≤ 2 linhas sem cortar palavra — decisão #82). Ausente = derivado do controle. */
const ROTULOS: Record<string, string> = {
  'hie-trigger-btn': 'Personalizar componentes',
  'hie-reset-btn': 'Restaurar ordem',
  'hie-done-btn': 'Concluir edição',
  'currency-rotator': 'Cotações',
  'weather-sp': 'Clima São Paulo',
  'real-time-clock': 'Horário',
  'email-integration': 'E-mail',
  'instagram-messenger-integration': 'Instagram / Messenger',
  'panel-calendar': 'Google Calendar',
  'panel-maps': 'Mapas',
};

type Movido = { el: HTMLElement; parent: HTMLElement; next: Node | null; wrap: HTMLElement; chave: string; grupo: string };
type PatchA11y = { el: HTMLElement; attrs: Record<string, string | null> };

const state = {
  active: false,
  mode: 'wide' as 'wide' | 'compact',
  abort: null as AbortController | null,
  observers: [] as MutationObserver[],
  listeners: 0,
  moved: [] as Movido[],
  a11y: [] as PatchA11y[],
  containers: [] as HTMLElement[],
  metaOriginal: null as string | null,
  more: null as HTMLButtonElement | null,
  menu: null as HTMLElement | null,
  scrim: null as HTMLElement | null,
  grupos: new Map<string, HTMLElement>(),
  lock: null as { y: number; mainTop: number; flow: boolean } | null,
  fabObservado: null as HTMLElement | null,
  raf: 0,
  tickerVisible: null as boolean | null,
  resolved: null as boolean | null,
  source: 'none' as 'local' | 'remote' | 'default' | 'none',
};

// ───────────────────────── util ─────────────────────────
const q = <T extends Element = HTMLElement>(s: string, root: ParentNode = document): T | null => root.querySelector(s) as T | null;
const on = (t: EventTarget, ev: string, fn: EventListenerOrEventListenerObject, opts: AddEventListenerOptions = {}) => {
  if (!state.abort) return;
  t.addEventListener(ev, fn, { ...opts, signal: state.abort.signal });
  state.listeners++;
};
const observe = (target: Node, cb: MutationCallback, init: MutationObserverInit) => {
  const mo = new MutationObserver(cb);
  mo.observe(target, init);
  state.observers.push(mo);
  return mo;
};
const humanize = (s: string) => s.replace(/^panel-/, '').replace(/-integration$/, '').replace(/[-_]+/g, ' ').replace(/\b\w/, (c) => c.toUpperCase());
const setAttr = (el: Element, nome: string, valor: string | null) => {
  if (valor === null) { if (el.hasAttribute(nome)) el.removeAttribute(nome); }
  else if (el.getAttribute(nome) !== valor) el.setAttribute(nome, valor);
};

// ───────────────────────── flag ─────────────────────────
function overrideLocal(): boolean | null {
  try {
    const local = JSON.parse(localStorage.getItem(LOCAL_KEY) ?? '{}') as Record<string, unknown>;
    if (Object.prototype.hasOwnProperty.call(local, FLAG)) return !!local[FLAG];
  } catch { /* storage inválido = sem override */ }
  return null;
}

export async function resolve(): Promise<boolean> {
  const local = overrideLocal();
  if (local !== null) { state.source = 'local'; state.resolved = local; return local; }
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), RESOLVE_TIMEOUT_MS);
  try {
    const r = await fetch(RESOLVE_URL, { credentials: 'include', cache: 'no-store', signal: ctrl.signal, headers: { Accept: 'application/json' } });
    if (!r.ok) { state.source = 'default'; state.resolved = false; return false; }
    const corpo = await r.json() as { data?: { flag?: { enabled?: unknown } }; flag?: { enabled?: unknown } };
    const f = corpo?.data?.flag ?? corpo?.flag;
    const ligada = !!(f && f.enabled === true);
    state.source = 'remote'; state.resolved = ligada;
    return ligada;
  } catch {
    state.source = 'default'; state.resolved = false;
    return false; // rede/timeout/JSON inválido → OFF (fail-closed)
  } finally { clearTimeout(t); }
}

// ───────────────────────── viewport / css ─────────────────────────
function aplicarViewport() {
  const meta = q<HTMLMetaElement>('meta[name="viewport"]');
  if (!meta) return;
  if (state.metaOriginal === null) state.metaOriginal = meta.getAttribute('content');
  const atual = meta.getAttribute('content') || '';
  if (!/viewport-fit\s*=/.test(atual)) meta.setAttribute('content', (atual ? atual.replace(/\s*$/, '') + ', ' : '') + 'viewport-fit=cover');
}
function restaurarViewport() {
  const meta = q<HTMLMetaElement>('meta[name="viewport"]');
  if (meta && state.metaOriginal !== null) meta.setAttribute('content', state.metaOriginal);
  state.metaOriginal = null;
}
function garantirCss() {
  if (document.getElementById(CSS_ID)) return;
  const l = document.createElement('link');
  l.id = CSS_ID; l.rel = 'stylesheet'; l.href = CSS_HREF;
  document.head.appendChild(l);
}

// ───────────────────────── ticker efetivo ─────────────────────────
function tickerRegiao(): HTMLElement | null { return q('[data-region="ticker"]') || document.getElementById('ticker'); }
function tickerEfetivamenteVisivel(): boolean {
  const r = tickerRegiao();
  if (!r) return false;
  if (r.classList.contains('dsd-shell__region--hidden') || r.hidden || r.getAttribute('aria-hidden') === 'true') return false;
  const cs = getComputedStyle(r);
  if (cs.display === 'none' || cs.visibility === 'hidden') return false;
  if (/(^|\s)(ticker--disabled|ticker--hidden|is-empty|ticker--empty)(\s|$)/.test(r.className)) return false;
  const cont = q('.ticker-content-container, .ticker-wrapper', r);
  if (cont && r.classList.contains('news-ticker-component') && cont.childElementCount === 0) return false;
  return true;
}
function syncTicker() {
  const v = tickerEfetivamenteVisivel();
  if (v !== state.tickerVisible) {
    state.tickerVisible = v;
    document.documentElement.setAttribute('data-shell-ticker', v ? 'on' : 'off');
  }
}

// ───────────────────────── modo (detector canônico) ─────────────────────────
function modoAtual(): 'wide' | 'compact' {
  const dev = document.body.getAttribute('data-device');
  if (dev) return MODOS_COMPACTOS.has(dev) ? 'compact' : 'wide';
  if (document.body.classList.contains('dsd-mobile') || document.body.classList.contains('dsd-tablet')) return 'compact';
  return 'wide';
}

function chaveDe(el: HTMLElement): string {
  return el.getAttribute('data-component-key') || el.id || (el.classList.length ? el.classList[0] : el.tagName.toLowerCase());
}
function grupoDe(chave: string): string {
  for (const g of GRUPOS) if (g.chaves.includes(chave)) return g.id;
  return 'outros';
}
function prioridadeDe(el: HTMLElement): 1 | 2 | 3 {
  const decl = el.getAttribute('data-mh2-priority') || q('[data-mh2-priority]', el)?.getAttribute('data-mh2-priority');
  if (decl === '1' || decl === '2' || decl === '3') return Number(decl) as 1 | 2 | 3;
  const key = el.getAttribute('data-component-key');
  if (key && PRIORIDADE[key]) return PRIORIDADE[key];
  for (const cls of Array.from(el.classList)) if (PRIORIDADE[cls]) return PRIORIDADE[cls];
  return 3;
}
/** Rótulo curto e completo (nunca cortado no meio da palavra): tabela → nome acessível do
 *  controle sem prefixos de ação ("Abrir", "Mudar para") nem legendas ("— clique para…"). */
function rotuloDe(el: HTMLElement, chave: string): string {
  if (ROTULOS[chave]) return ROTULOS[chave];
  const alvo = (el.matches('button,a,[role="button"]') ? el : q('button,a,[role="button"],[aria-label],[title]', el)) || el;
  let txt = alvo.getAttribute('aria-label') || alvo.getAttribute('title') || el.getAttribute('data-component-label') || '';
  txt = txt.replace(/\s*[—–-]\s*clique.*$/i, '').replace(/^(Abrir|Mudar para|Ir para)\s+/i, '').trim().replace(/\s+/g, ' ');
  if (txt) return txt.charAt(0).toUpperCase() + txt.slice(1);
  const label = el.getAttribute('data-component-label');
  if (label) return label;
  const t = (el.textContent || '').trim().replace(/\s+/g, ' ');
  return t || humanize(chave);
}

// ───────────────────────── gaveta "Mais" (decisões #80–#84) ─────────────────────────
function criarMais(right: HTMLElement) {
  if (state.more && state.more.isConnected) return;
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'mh2-more';
  btn.setAttribute('aria-label', 'Mais ações');
  btn.setAttribute('aria-haspopup', 'dialog');
  btn.setAttribute('aria-expanded', 'false');
  btn.setAttribute('aria-controls', 'mh2-more-menu');
  btn.setAttribute('data-mh2-own', '');
  btn.innerHTML = '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" focusable="false"><circle cx="5" cy="12" r="2" fill="currentColor"/><circle cx="12" cy="12" r="2" fill="currentColor"/><circle cx="19" cy="12" r="2" fill="currentColor"/></svg>';
  const scrim = document.createElement('div');
  scrim.className = 'mh2-scrim';
  scrim.setAttribute('data-mh2-own', '');
  scrim.hidden = true;
  const menu = document.createElement('div');
  menu.id = 'mh2-more-menu';
  menu.className = 'mh2-more-menu';
  menu.setAttribute('role', 'dialog');
  menu.setAttribute('aria-modal', 'true');
  menu.setAttribute('aria-label', 'Mais ações');
  menu.setAttribute('data-mh2-own', '');
  menu.hidden = true;
  const head = document.createElement('div');
  head.className = 'mh2-more-head';
  const titulo = document.createElement('span');
  titulo.className = 'mh2-more-title';
  titulo.id = 'mh2-more-title';
  titulo.textContent = 'Mais';
  const fechar = document.createElement('button');
  fechar.type = 'button';
  fechar.className = 'mh2-more-close';
  fechar.setAttribute('aria-label', 'Fechar menu');
  fechar.innerHTML = '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>';
  head.appendChild(titulo); head.appendChild(fechar);
  menu.setAttribute('aria-labelledby', 'mh2-more-title');
  const corpo = document.createElement('div');
  corpo.className = 'mh2-more-body';
  menu.appendChild(head); menu.appendChild(corpo);
  right.appendChild(btn);
  right.appendChild(scrim);
  right.appendChild(menu);
  state.more = btn; state.menu = menu; state.scrim = scrim;
  state.grupos = new Map();
  on(btn, 'click', (e) => { e.preventDefault(); e.stopPropagation(); alternarMais(); });
  on(fechar, 'click', (e) => { e.preventDefault(); e.stopPropagation(); fecharMais(true); });
  on(scrim, 'click', (e) => { e.preventDefault(); fecharMais(true); });
  // ativar um CONTROLE da gaveta fecha a gaveta (o painel/ação abre por baixo); tocar em título,
  // card informativo ou espaço vazio não fecha
  on(menu, 'click', (e) => {
    const t = e.target as Element;
    const item = t.closest('.mh2-more-item');
    if (!item) return;
    const ctrl = t.closest('button, a[href], [role="button"]');
    if (ctrl && item.contains(ctrl)) setTimeout(() => fecharMais(false), 0);
  });
  on(menu, 'keydown', (e) => {
    const ke = e as KeyboardEvent;
    if (ke.key === 'Escape') { e.stopPropagation(); fecharMais(true); return; }
    if (ke.key === 'Tab') prenderFoco(ke);
  });
  on(btn, 'keydown', (e) => { if ((e as KeyboardEvent).key === 'Escape' && state.menu && !state.menu.hidden) { e.stopPropagation(); fecharMais(true); } });
  on(document, 'focusin', (e) => { if (!state.menu || state.menu.hidden) return; const t = e.target as Node; if (state.menu.contains(t) || btn.contains(t)) return; fecharMais(false); });
  // fundo travado também no toque (iOS ignora overflow:hidden no body): só a gaveta rola
  on(document, 'touchmove', (e) => { if (!state.menu || state.menu.hidden) return; const t = e.target as Node; if (state.menu.contains(t)) return; e.preventDefault(); }, { passive: false, capture: true });
}
function focaveis(root: HTMLElement): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>('button:not([disabled]),a[href],[role="button"],[tabindex]:not([tabindex="-1"])')).filter((el) => {
    if (el.closest('[hidden]')) return false;
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  });
}
function prenderFoco(e: KeyboardEvent) {
  if (!state.menu) return;
  const lista = focaveis(state.menu);
  if (!lista.length) return;
  const primeiro = lista[0], ultimo = lista[lista.length - 1];
  const ativo = document.activeElement as HTMLElement | null;
  if (e.shiftKey && (ativo === primeiro || !state.menu.contains(ativo))) { e.preventDefault(); ultimo.focus({ preventScroll: true }); }
  else if (!e.shiftKey && ativo === ultimo) { e.preventDefault(); primeiro.focus({ preventScroll: true }); }
}
function alternarMais() { if (!state.menu) return; if (state.menu.hidden) abrirMais(); else fecharMais(true); }
function travarFundo() {
  const main = q('[data-region="main"]');
  const flow = document.documentElement.getAttribute('data-mh2-flow') === 'on' || document.documentElement.getAttribute('data-shell-layout-v2') === 'on';
  state.lock = { y: window.scrollY, mainTop: main ? main.scrollTop : 0, flow };
  document.documentElement.style.setProperty('--mh2-lock-top', `-${Math.round(state.lock.y)}px`);
  document.documentElement.setAttribute('data-mh2-more-open', '');
}
function destravarFundo() {
  const lock = state.lock;
  state.lock = null;
  document.documentElement.removeAttribute('data-mh2-more-open');
  for (const p of ['--mh2-lock-top', '--mh2-footer-h', '--mh2-navrail-h']) document.documentElement.style.removeProperty(p);
  if (!lock) return;
  const main = q('[data-region="main"]');
  if (lock.flow) window.scrollTo({ top: lock.y, left: 0, behavior: 'instant' as ScrollBehavior });
  if (main && main.scrollTop !== lock.mainTop) main.scrollTop = lock.mainTop;
}
function abrirMais() {
  if (!state.menu || !state.more || !state.scrim) return;
  // composição com o layout v2 (#88): a gaveta de navegação e o "Mais" nunca abertos ao mesmo tempo
  const lv2 = (window as unknown as { __shellLayoutV2?: { closeDrawer?: () => void } }).__shellLayoutV2;
  if (lv2 && typeof lv2.closeDrawer === 'function') lv2.closeDrawer();
  state.scrim.hidden = false;
  state.menu.hidden = false;
  state.menu.scrollTop = 0;
  state.more.setAttribute('aria-expanded', 'true');
  travarFundo();
  const primeiro = focaveis(state.menu).find((el) => !el.classList.contains('mh2-more-close')) || q<HTMLElement>('.mh2-more-close', state.menu);
  if (primeiro) primeiro.focus({ preventScroll: true });
}
function fecharMais(devolverFoco: boolean) {
  if (!state.menu || !state.more || state.menu.hidden) return;
  state.menu.hidden = true;
  if (state.scrim) state.scrim.hidden = true;
  state.more.setAttribute('aria-expanded', 'false');
  destravarFundo();
  if (devolverFoco) state.more.focus({ preventScroll: true });
}

function grupoEl(id: string): HTMLElement {
  const existente = state.grupos.get(id);
  if (existente && existente.isConnected) return existente;
  const def = GRUPOS.find((g) => g.id === id) || GRUPOS[GRUPOS.length - 1];
  const sec = document.createElement('section');
  sec.className = 'mh2-more-group';
  sec.setAttribute('data-mh2-group', def.id);
  sec.setAttribute('data-mh2-own', '');
  sec.setAttribute('aria-labelledby', `mh2-more-group-${def.id}`);
  const h = document.createElement('h3');
  h.className = 'mh2-more-group-title';
  h.id = `mh2-more-group-${def.id}`;
  h.textContent = def.titulo;
  const grade = document.createElement('div');
  grade.className = 'mh2-more-grid';
  grade.setAttribute('role', 'group');
  sec.appendChild(h); sec.appendChild(grade);
  const corpo = q('.mh2-more-body', state.menu as HTMLElement) as HTMLElement;
  // grupos sempre na ordem canônica, independente da ordem em que os controles chegam
  const ordem = GRUPOS.map((g) => g.id);
  const depois = Array.from(corpo.children).find((c) => ordem.indexOf(c.getAttribute('data-mh2-group') || '') > ordem.indexOf(def.id));
  corpo.insertBefore(sec, depois || null);
  state.grupos.set(def.id, sec);
  return sec;
}
function moverParaMais(el: HTMLElement) {
  if (!state.menu || state.moved.some((m) => m.el === el)) return;
  const chave = chaveDe(el);
  const grupo = grupoDe(chave);
  const wrap = document.createElement('div');
  wrap.className = 'mh2-more-item' + (CARDS.has(chave) ? ' mh2-more-item--card' : '');
  wrap.setAttribute('data-mh2-own', '');
  wrap.setAttribute('data-mh2-key', chave);
  const rot = document.createElement('span');
  rot.className = 'mh2-more-label';
  rot.setAttribute('aria-hidden', 'true');
  rot.textContent = rotuloDe(el, chave);
  const parent = el.parentElement as HTMLElement;
  const next = el.nextSibling;
  if (CARDS.has(chave)) { wrap.appendChild(rot); wrap.appendChild(el); } else { wrap.appendChild(el); wrap.appendChild(rot); }
  const grade = q('.mh2-more-grid', grupoEl(grupo)) as HTMLElement;
  grade.appendChild(wrap);
  state.moved.push({ el, parent, next, wrap, chave, grupo });
  if (el.matches('.header-component-wrapper')) garantirSemantica(el);
}
function devolverTodos() {
  for (const m of state.moved.slice().reverse()) {
    if (m.next && m.next.parentNode === m.parent) m.parent.insertBefore(m.el, m.next);
    else m.parent.appendChild(m.el);
    m.wrap.remove();
  }
  state.moved = [];
  state.grupos = new Map();
}

/** Controles de componente que são `div` clicável sem semântica: ganham role/tabindex/nome
 *  (genérico: raiz do wrapper com cursor:pointer e sem controle focável interno). Teclado via
 *  UM listener delegado (marcador data-mh2-a11y-btn) — nada por nó. */
function garantirSemantica(wrapper: HTMLElement) {
  const raiz = wrapper.firstElementChild as HTMLElement | null;
  if (!raiz || raiz.matches('button,a[href],input,select,textarea,[role="button"],[tabindex]')) return;
  if (q('button,a[href],[role="button"],[tabindex]', raiz)) return;
  if (getComputedStyle(raiz).cursor !== 'pointer') return;
  patchA11y(raiz, { role: 'button', tabindex: '0', 'aria-label': raiz.getAttribute('aria-label') || raiz.getAttribute('title') || humanize(wrapper.getAttribute('data-component-key') || 'Ação'), 'data-mh2-a11y-btn': '' });
}
function patchA11y(el: HTMLElement, attrs: Record<string, string>) {
  if (state.a11y.some((p) => p.el === el)) return;
  const prev: Record<string, string | null> = {};
  for (const k of Object.keys(attrs)) prev[k] = el.getAttribute(k);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  state.a11y.push({ el, attrs: prev });
}
function desfazerSemantica() {
  for (const p of state.a11y) for (const [k, v] of Object.entries(p.attrs)) { if (v === null) p.el.removeAttribute(k); else p.el.setAttribute(k, v); }
  state.a11y = [];
}
function teclaAtiva(e: Event) {
  const ke = e as KeyboardEvent;
  if (ke.key !== 'Enter' && ke.key !== ' ') return;
  const t = ke.target as HTMLElement | null;
  if (!t || !t.matches || !t.matches('[data-mh2-a11y-btn]')) return;
  ke.preventDefault();
  t.click();
}

function comporCompacto() {
  const right = q('.site-header .header-right');
  const left = q('.site-header .header-left');
  if (!right) return;
  criarMais(right);
  const candidatos: HTMLElement[] = [];
  for (const el of Array.from(right.children) as HTMLElement[]) {
    if (el.hasAttribute('data-mh2-own') || el.hasAttribute('data-lv2-own')) continue;
    if (getComputedStyle(el).display === 'none') continue; // botões auxiliares ocultos (ex.: hie-done) ficam onde estão
    candidatos.push(el);
  }
  if (left) for (const el of Array.from(left.children) as HTMLElement[]) { if (!el.hasAttribute('data-mh2-own') && !el.hasAttribute('data-lv2-own') && prioridadeDe(el) === 3 && getComputedStyle(el).display !== 'none') candidatos.push(el); }
  for (const el of candidatos) {
    const p = prioridadeDe(el);
    if (p === 3) moverParaMais(el);
    else if (el.matches('.header-component-wrapper')) garantirSemantica(el);
  }
  if (left) for (const el of Array.from(left.querySelectorAll<HTMLElement>('.header-component-wrapper'))) garantirSemantica(el);
  // o botão "Mais", o scrim e a gaveta sempre por último na barra
  if (state.more && right.lastElementChild !== state.menu) { right.appendChild(state.more); right.appendChild(state.scrim as HTMLElement); right.appendChild(state.menu as HTMLElement); }
  if (state.more) state.more.hidden = state.moved.length === 0;
}
function desfazerCompacto() {
  fecharMais(false);
  devolverTodos();
  desfazerSemantica();
  if (state.more) { state.more.remove(); state.more = null; }
  if (state.scrim) { state.scrim.remove(); state.scrim = null; }
  if (state.menu) { state.menu.remove(); state.menu = null; }
}

function syncModo() {
  const m = modoAtual();
  document.documentElement.setAttribute('data-mh2-mode', m);
  if (m === state.mode && (m === 'wide' || (state.more && state.more.isConnected))) { if (m === 'compact') comporCompacto(); return; }
  state.mode = m;
  if (m === 'compact') comporCompacto(); else desfazerCompacto();
}

// ───────────────────────── título externo do painel (capacidade genérica) ─────────────────────────
function syncTitulos() {
  const main = q('[data-region="main"]');
  if (!main) return;
  const vistos = new Set<HTMLElement>();
  for (const c of Array.from(main.querySelectorAll<HTMLElement>('.dsd-container'))) {
    vistos.add(c);
    const own = !!q('[data-shell-titlebar="own"]', c);
    const titulo = q('.dsd-container__header .dsd-container__title', c);
    if (own) {
      if (c.getAttribute('data-shell-titlebar') !== 'owned') { c.setAttribute('data-shell-titlebar', 'owned'); state.containers.push(c); }
      if (titulo && !titulo.getAttribute('role')) { titulo.setAttribute('role', 'heading'); titulo.setAttribute('aria-level', '1'); titulo.setAttribute('data-mh2-heading', ''); }
    } else if (c.getAttribute('data-shell-titlebar') === 'owned') {
      c.removeAttribute('data-shell-titlebar');
      if (titulo && titulo.hasAttribute('data-mh2-heading')) { titulo.removeAttribute('role'); titulo.removeAttribute('aria-level'); titulo.removeAttribute('data-mh2-heading'); }
      state.containers = state.containers.filter((x) => x !== c);
    }
  }
  state.containers = state.containers.filter((c) => c.isConnected && vistos.has(c) && c.getAttribute('data-shell-titlebar') === 'owned');
}
function desfazerTitulos() {
  for (const c of state.containers) {
    c.removeAttribute('data-shell-titlebar');
    const t = q('.dsd-container__header .dsd-container__title', c);
    if (t && t.hasAttribute('data-mh2-heading')) { t.removeAttribute('role'); t.removeAttribute('aria-level'); t.removeAttribute('data-mh2-heading'); }
  }
  state.containers = [];
}

// ───────────────────────── fluxo vertical (decisão #85) ─────────────────────────
/** Dashboard compacto: main e rodapé entram no FLUXO (documento rola; rodapé no fim, sem vão).
 *  Painel com barra própria (Avatar Studio, `owned`) mantém o layout de regiões fixas aprovado. */
function syncFlow() {
  const html = document.documentElement;
  const layoutV2 = html.getAttribute('data-shell-layout-v2') === 'on'; // #88: o shell é do layout v2 (main/rodapé/regiões)
  const flow = !layoutV2 && state.mode === 'compact' && state.containers.length === 0 && !!q('[data-region="main"]') && !!q('[data-region="footer"]');
  setAttr(html, 'data-mh2-flow', flow ? 'on' : null);
  if (layoutV2) { for (const p of ['--mh2-footer-h', '--mh2-navrail-h']) if (html.style.getPropertyValue(p)) html.style.removeProperty(p); return; }
  // barra inferior de navegação (nav-rail mobile): só ocupa espaço se tiver conteúdo visível
  const nav = q('[data-region="nav-rail"]');
  let navVisivel = false;
  if (nav) for (const c of Array.from(nav.children) as HTMLElement[]) { const cs = getComputedStyle(c); if (cs.display !== 'none' && cs.visibility !== 'hidden' && c.getBoundingClientRect().height > 0) { navVisivel = true; break; } }
  setAttr(html, 'data-shell-navrail', navVisivel ? 'on' : 'off');
  // layout de regiões fixas (painel `owned`, ex.: Avatar Studio): o main termina onde o rodapé VISÍVEL
  // começa — altura medida da linha residente do rodapé (não do token de 76px nem de px por aparelho)
  const footer = q('[data-region="footer"]');
  const linha = footer ? (q('.dsd-footer__bottom', footer) || q('.dsd-footer, .app-footer', footer)) : null;
  const borda = footer ? parseFloat(getComputedStyle(q('.dsd-footer, .app-footer', footer) || footer).borderTopWidth) || 0 : 0;
  const alturaRodape = linha ? Math.round(linha.getBoundingClientRect().height + borda) : 0;
  const atual = parseFloat(html.style.getPropertyValue('--mh2-footer-h')) || 0;
  if (alturaRodape > 0 && Math.abs(alturaRodape - atual) >= 1) html.style.setProperty('--mh2-footer-h', `${alturaRodape}px`);
  else if (alturaRodape === 0 && atual) html.style.removeProperty('--mh2-footer-h');
  const navAltura = navVisivel && nav ? Math.round(nav.getBoundingClientRect().height) : 0;
  const navAtual = parseFloat(html.style.getPropertyValue('--mh2-navrail-h')) || 0;
  if (navAltura !== navAtual) { if (navAltura) html.style.setProperty('--mh2-navrail-h', `${navAltura}px`); else html.style.removeProperty('--mh2-navrail-h'); }
}

// ───────────────────────── badges (decisão #86) ─────────────────────────
const BADGE_SEL = '.site-header [class*="badge"]:not([class*="mh2"])';
function syncBadges() {
  const site = q('.site-header');
  if (!site) return;
  for (const b of Array.from(document.querySelectorAll<HTMLElement>(BADGE_SEL))) {
    const n = parseInt((b.textContent || '').trim().replace(/\+$/, ''), 10);
    const pos = Number.isFinite(n) && n > 0;
    setAttr(b, 'data-mh2-badge', pos ? 'pos' : 'zero');
  }
  // Google Calendar: contagem numérica E ponto de estado nunca juntos — com contagem, só o número
  for (const t of Array.from(site.querySelectorAll<HTMLElement>('[data-panel-trigger="panel-calendar"]'))) {
    const badge = q('.gcal-badge', t);
    const comContagem = !!badge && badge.getAttribute('data-mh2-badge') === 'pos' && getComputedStyle(badge).display !== 'none';
    setAttr(t, 'data-mh2-dot', comContagem ? 'off' : null);
  }
}

// ───────────────────────── perfil / FAB de devtools (decisão #87) ─────────────────────────
function syncPerfilEFab() {
  const html = document.documentElement;
  const role = q('.user-menu-component')?.getAttribute('data-role') || null;
  setAttr(html, 'data-mh2-role', role);
  const fab = document.getElementById('cm-devtools');
  if (!fab) return;
  if (state.fabObservado !== fab) { observe(fab, agendarSync, { childList: true }); state.fabObservado = fab; }
  const toggle = q<HTMLElement>('.cm-devtools-toggle', fab);
  if (toggle && !toggle.hasAttribute('role')) patchA11y(toggle, { role: 'button', tabindex: '0', 'aria-label': 'Ferramentas de desenvolvimento', title: 'Ferramentas de desenvolvimento', 'data-mh2-a11y-btn': '' });
}
/** Tooltip (title) espelhando o nome acessível em controles que só têm aria-label (ex.: trânsito). */
function syncTooltips() {
  for (const el of Array.from(document.querySelectorAll<HTMLElement>('.site-header .traffic-indicator[aria-label]'))) {
    const nome = el.getAttribute('aria-label') || '';
    if (!el.hasAttribute('data-mh2-title')) { if (el.getAttribute('title')) continue; patchA11y(el, { title: nome, 'data-mh2-title': '' }); }
    else if (el.getAttribute('title') !== nome) el.setAttribute('title', nome);
  }
}

// ───────────────────────── scroll → densidade (nunca altura) ─────────────────────────
function syncScroll() {
  const main = q('[data-region="main"]');
  const rolado = (!!main && main.scrollTop > 8) || window.scrollY > 8;
  if (rolado) document.documentElement.setAttribute('data-mh2-scrolled', ''); else document.documentElement.removeAttribute('data-mh2-scrolled');
}

/** Itens movidos seguem a visibilidade do PRÓPRIO controle; rótulo acompanha o nome acessível
 *  (ex.: "Tema claro" ↔ "Tema escuro"); grupo sem item visível some. */
function syncMovidos() {
  for (const m of state.moved) {
    m.wrap.hidden = getComputedStyle(m.el).display === 'none';
    const rot = q('.mh2-more-label', m.wrap);
    if (rot) { const t = rotuloDe(m.el, m.chave); if (rot.textContent !== t) rot.textContent = t; }
  }
  for (const sec of state.grupos.values()) {
    const algum = Array.from(sec.querySelectorAll<HTMLElement>('.mh2-more-item')).some((it) => !it.hidden);
    sec.hidden = !algum;
  }
}
function agendarSync() {
  if (state.raf) return;
  state.raf = requestAnimationFrame(() => { state.raf = 0; if (!state.active) return; syncTicker(); syncModo(); syncTitulos(); syncFlow(); syncMovidos(); syncBadges(); syncPerfilEFab(); syncTooltips(); });
}

// ───────────────────────── ciclo de vida ─────────────────────────
export function activate(): boolean {
  if (state.active) return true;
  const site = q('.site-header');
  if (!site) return false;
  state.active = true;
  state.abort = new AbortController();
  document.documentElement.setAttribute('data-mobile-header-v2', 'on');
  garantirCss();
  aplicarViewport();
  syncTicker(); syncModo(); syncTitulos(); syncFlow(); syncMovidos(); syncBadges(); syncPerfilEFab(); syncTooltips(); syncScroll();
  const ticker = tickerRegiao();
  if (ticker) observe(ticker, agendarSync, { attributes: true, attributeFilter: ['class', 'style', 'hidden', 'aria-hidden'], childList: true, subtree: true });
  observe(document.body, agendarSync, { attributes: true, attributeFilter: ['data-device', 'class'], childList: true });
  const main = q('[data-region="main"]');
  if (main) {
    observe(main, agendarSync, { childList: true, subtree: true, attributes: true, attributeFilter: ['data-shell-titlebar'] });
    on(main, 'scroll', syncScroll, { passive: true });
  }
  const nav = q('[data-region="nav-rail"]');
  if (nav) observe(nav, agendarSync, { attributes: true, attributeFilter: ['class', 'style', 'hidden'], childList: true });
  const right = q('.site-header .header-right');
  if (right) observe(right, agendarSync, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ['class', 'style', 'hidden', 'data-count', 'data-status', 'aria-label', 'data-role', 'data-gcal-estado'] });
  const left = q('.site-header .header-left');
  if (left) observe(left, agendarSync, { subtree: true, attributes: true, attributeFilter: ['data-role'] });
  on(window, 'resize', agendarSync, { passive: true });
  on(window, 'scroll', syncScroll, { passive: true });
  on(window, 'hashchange', () => { fecharMais(false); syncScroll(); agendarSync(); });
  on(document, 'keydown', teclaAtiva);
  return true;
}

export function deactivate(): void {
  if (!state.active) return;
  state.active = false;
  if (state.raf) { cancelAnimationFrame(state.raf); state.raf = 0; }
  for (const mo of state.observers) mo.disconnect();
  state.observers = [];
  state.fabObservado = null;
  if (state.abort) { state.abort.abort(); state.abort = null; }
  state.listeners = 0;
  desfazerCompacto();
  desfazerSemantica();
  desfazerTitulos();
  for (const b of Array.from(document.querySelectorAll('[data-mh2-badge]'))) b.removeAttribute('data-mh2-badge');
  for (const t of Array.from(document.querySelectorAll('[data-mh2-dot]'))) t.removeAttribute('data-mh2-dot');
  restaurarViewport();
  document.getElementById(CSS_ID)?.remove();
  for (const p of ['--mh2-lock-top', '--mh2-footer-h', '--mh2-navrail-h']) document.documentElement.style.removeProperty(p);
  for (const a of ['data-mobile-header-v2', 'data-shell-ticker', 'data-shell-navrail', 'data-mh2-mode', 'data-mh2-scrolled', 'data-mh2-more-open', 'data-mh2-flow', 'data-mh2-role']) document.documentElement.removeAttribute(a);
  state.mode = 'wide'; state.tickerVisible = null; state.lock = null;
}

export function info() {
  return {
    version: VERSION, moduleId: MODULE_ID, flag: FLAG, active: state.active, resolved: state.resolved, source: state.source,
    mode: state.mode, tickerVisible: state.tickerVisible, flow: document.documentElement.getAttribute('data-mh2-flow') === 'on',
    listeners: state.listeners, observers: state.observers.length, moved: state.moved.length, a11yPatches: state.a11y.length,
    containersOwned: state.containers.length, moreOpen: !!(state.menu && !state.menu.hidden), groups: state.grupos.size,
  };
}

function esperarShell(): Promise<boolean> {
  return new Promise((res) => {
    if (q('.site-header') && q('[data-region="main"]')) { res(true); return; }
    let mo: MutationObserver | null = null;
    const t = setTimeout(() => { mo?.disconnect(); res(false); }, BOOT_TIMEOUT_MS);
    mo = new MutationObserver(() => { if (q('.site-header') && q('[data-region="main"]')) { clearTimeout(t); mo?.disconnect(); res(true); } });
    mo.observe(document.documentElement, { childList: true, subtree: true });
  });
}

async function boot() {
  const w = window as unknown as { __mobileHeaderV2?: unknown };
  if (w.__mobileHeaderV2) return; // já carregado (script duplicado / HMR) — idempotente
  w.__mobileHeaderV2 = { VERSION, MODULE_ID, FLAG, activate, deactivate, info, resolve };
  const pronto = await esperarShell();
  if (!pronto) return;
  const ligada = await resolve();
  if (!ligada) return; // OFF = zero efeito (byte a byte)
  requestAnimationFrame(() => { activate(); });
}

if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  if (document.readyState === 'complete') void boot();
  else window.addEventListener('load', () => { void boot(); }, { once: true });
}

export default { VERSION, MODULE_ID, FLAG, activate, deactivate, info, resolve };
