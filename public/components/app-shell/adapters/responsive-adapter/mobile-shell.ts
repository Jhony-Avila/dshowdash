// ═══════════════════════════════════════════════════════════════
// MODULE: responsive-adapter/mobile-shell
// Track D onda 2 — COMPORTAMENTO mobile do shell global. Enhancer ADITIVO do DOM
// já renderizado, ligado SOMENTE quando #app-shell[data-mobile] está presente
// (ou seja, só com a flag as6.mobile_shell ON). Não conhece config interna: opera
// sobre os nós existentes, preservando listeners/badges/estado. Tudo é reversível
// no teardown (idempotente, sem listeners/overlays órfãos).
//   Item 1: header "Mais" (move ações secundárias p/ um sheet).
//   Item 2: drawer a11y (Escape, focus-trap, inert, scroll-lock, retorno de foco).
//   Item 4: ticker (pausar/anterior/próximo, reduced-motion, nomes acessíveis).
// ═══════════════════════════════════════════════════════════════
'use strict';

export const VERSION = '0.1.0-TRACK-D-W2';
export const MODULE_ID = 'app-shell.responsive-adapter.mobile-shell';

type Cleanup = () => void;
let _ligado = false;
let _cleanups: Cleanup[] = [];
const q = <T extends Element = HTMLElement>(s: string, r: ParentNode = document): T | null => { try { return r.querySelector(s) as T | null; } catch { return null; } };
const qa = (s: string, r: ParentNode = document): HTMLElement[] => { try { return [...r.querySelectorAll(s)] as HTMLElement[]; } catch { return []; } };
const on = (el: EventTarget | null, ev: string, fn: EventListener, opts?: AddEventListenerOptions) => {
  if (!el) return; el.addEventListener(ev, fn, opts); _cleanups.push(() => el.removeEventListener(ev, fn, opts));
};
const FOCAVEIS = 'a[href],button:not([disabled]),input:not([disabled]),select,textarea,[tabindex]:not([tabindex="-1"])';

// ────────────────────────────── ITEM 2: DRAWER a11y ──────────────────────────
let _origemFoco: HTMLElement | null = null;
const inertAlvos = (): HTMLElement[] => ['header', 'ticker', 'nav-rail', 'main', 'footer'].map((r) => q(`.dsd-shell__region--${r}`)).filter(Boolean) as HTMLElement[];

function drawerAberto(): boolean {
  const d = q('.dsd-sidebar'); return !!d && d.classList.contains('dsd-sidebar--mobile-open');
}
function abrirDrawer() {
  const drawer = q('.dsd-sidebar'); if (!drawer) return;
  _origemFoco = (document.activeElement as HTMLElement) || null;
  drawer.classList.add('dsd-sidebar--mobile-open');
  drawer.setAttribute('role', 'dialog'); drawer.setAttribute('aria-modal', 'true');
  const ov = q('.dsd-sidebar-overlay'); if (ov) { ov.classList.add('dsd-sidebar-overlay--visible'); ov.hidden = false; }
  document.body.classList.add('sidebar-mobile-open'); // scroll-lock (CSS)
  inertAlvos().forEach((el) => { el.setAttribute('aria-hidden', 'true'); (el as any).inert = true; });
  const btnToggle = q('[aria-controls="app-sidebar"],[data-action="sidebar.toggle"]'); if (btnToggle) btnToggle.setAttribute('aria-expanded', 'true');
  const primeiro = q<HTMLElement>(FOCAVEIS, drawer) || drawer; try { primeiro.setAttribute('tabindex', primeiro === drawer ? '-1' : primeiro.getAttribute('tabindex') || '0'); primeiro.focus(); } catch { /* ok */ }
}
function fecharDrawer() {
  const drawer = q('.dsd-sidebar'); if (!drawer) return;
  drawer.classList.remove('dsd-sidebar--mobile-open'); drawer.removeAttribute('aria-modal');
  const ov = q('.dsd-sidebar-overlay'); if (ov) { ov.classList.remove('dsd-sidebar-overlay--visible'); ov.hidden = true; }
  document.body.classList.remove('sidebar-mobile-open');
  inertAlvos().forEach((el) => { el.removeAttribute('aria-hidden'); (el as any).inert = false; });
  const btnToggle = q('[aria-controls="app-sidebar"],[data-action="sidebar.toggle"]'); if (btnToggle) btnToggle.setAttribute('aria-expanded', 'false');
  try { _origemFoco?.focus(); } catch { /* ok */ } _origemFoco = null;
}
function wireDrawer() {
  const drawer = q('.dsd-sidebar');
  const ov = q('.dsd-sidebar-overlay');
  on(ov, 'click', () => fecharDrawer());
  // Escape fecha; Tab faz trap dentro do drawer quando aberto
  on(document, 'keydown', (e: Event) => {
    const ev = e as KeyboardEvent; if (!drawerAberto()) return;
    if (ev.key === 'Escape') { ev.preventDefault(); fecharDrawer(); return; }
    if (ev.key === 'Tab' && drawer) {
      const foc = qa(FOCAVEIS, drawer).filter((el) => el.offsetParent !== null || el === document.activeElement);
      if (!foc.length) return;
      const primeiro = foc[0], ultimo = foc[foc.length - 1];
      if (ev.shiftKey && document.activeElement === primeiro) { ev.preventDefault(); ultimo.focus(); }
      else if (!ev.shiftKey && document.activeElement === ultimo) { ev.preventDefault(); primeiro.focus(); }
    }
  });
  // fecha ao navegar (hashchange) e ao mudar orientação
  on(window, 'hashchange', () => { if (drawerAberto()) fecharDrawer(); });
  on(window, 'orientationchange', () => { if (drawerAberto()) fecharDrawer(); });
  // botão que abre o drawer (bottom-nav "Menu"/toggle) — delega
  on(document, 'click', (e: Event) => {
    const t = (e.target as HTMLElement)?.closest?.('[data-action="sidebar.toggle"],[data-navrail-id="toggle-sidebar"]');
    if (t) { e.preventDefault(); drawerAberto() ? fecharDrawer() : abrirDrawer(); }
  });
  _cleanups.push(() => { if (drawerAberto()) fecharDrawer(); });
}

// ────────────────────────────── ITEM 1: HEADER "MAIS" ────────────────────────
const ESSENCIAIS_MAX = 3; // identidade fica no header-left; mantém só N ações essenciais visíveis
function wireHeaderMais() {
  const right = q('.site-header .header-right'); if (!right) return;
  const itens = qa(':scope > .header-component-wrapper', right);
  if (itens.length <= ESSENCIAIS_MAX + 1) return; // não precisa de "Mais"
  const secundarios = itens.slice(ESSENCIAIS_MAX);
  // sheet
  const sheet = document.createElement('div');
  sheet.className = 'avst6-mais-sheet'; sheet.setAttribute('role', 'dialog');
  sheet.setAttribute('aria-label', 'Mais ações'); sheet.hidden = true;
  const backdrop = document.createElement('div'); backdrop.className = 'avst6-mais-backdrop'; backdrop.hidden = true;
  // botão "Mais"
  const btn = document.createElement('button');
  btn.type = 'button'; btn.className = 'avst6-mais-btn'; btn.setAttribute('aria-haspopup', 'dialog');
  btn.setAttribute('aria-expanded', 'false'); btn.setAttribute('aria-controls', 'avst6-mais-sheet');
  btn.textContent = 'Mais';
  sheet.id = 'avst6-mais-sheet';
  const marcadores: Array<{ node: HTMLElement; anchor: Comment }> = [];
  secundarios.forEach((n) => { const anchor = document.createComment('mais'); n.parentNode?.insertBefore(anchor, n); sheet.appendChild(n); marcadores.push({ node: n, anchor }); });
  // sheet/backdrop DENTRO do #app-shell (não no body) → o CSS fica 100% sob o
  // marcador #app-shell[data-mobile] (mantém a prova estática) e some no teardown.
  const host = q('#app-shell') || document.body;
  right.appendChild(btn); host.appendChild(backdrop); host.appendChild(sheet);
  let origem: HTMLElement | null = null;
  const abrir = () => { origem = document.activeElement as HTMLElement; sheet.hidden = false; backdrop.hidden = false; btn.setAttribute('aria-expanded', 'true'); const f = q<HTMLElement>(FOCAVEIS, sheet); try { (f || sheet).focus(); } catch { /* ok */ } };
  const fechar = () => { sheet.hidden = true; backdrop.hidden = true; btn.setAttribute('aria-expanded', 'false'); try { origem?.focus(); } catch { /* ok */ } };
  on(btn, 'click', () => (sheet.hidden ? abrir() : fechar()));
  on(backdrop, 'click', () => fechar());
  on(sheet, 'keydown', (e: Event) => { if ((e as KeyboardEvent).key === 'Escape') { e.preventDefault(); fechar(); } });
  on(document, 'click', (e: Event) => { const a = (e.target as HTMLElement)?.closest?.('.avst6-mais-sheet .header-component-wrapper'); if (a) fechar(); });
  // teardown: devolve os nós ao header e remove sheet/btn/backdrop
  _cleanups.push(() => {
    marcadores.forEach(({ node, anchor }) => { anchor.parentNode?.insertBefore(node, anchor); anchor.remove(); });
    btn.remove(); sheet.remove(); backdrop.remove();
  });
}

// ────────────────────────────── ITEM 4: TICKER controles ─────────────────────
function wireTicker() {
  const comp = q('.news-ticker-component'); const track = q('.ticker-track'); if (!comp || !track) return;
  const barra = document.createElement('div'); barra.className = 'avst6-ticker-ctrl';
  const mk = (label: string, cls: string) => { const b = document.createElement('button'); b.type = 'button'; b.className = `avst6-tk ${cls}`; b.setAttribute('aria-label', label); b.textContent = ({ 'avst6-tk-prev': '‹', 'avst6-tk-next': '›', 'avst6-tk-pause': '⏸' } as any)[cls] || label; return b; };
  const prev = mk('Notícia anterior', 'avst6-tk-prev');
  const pause = mk('Pausar', 'avst6-tk-pause'); pause.setAttribute('aria-pressed', 'false');
  const next = mk('Próxima notícia', 'avst6-tk-next');
  barra.append(prev, pause, next); comp.appendChild(barra);
  const setPausa = (p: boolean) => { comp.setAttribute('data-ticker-paused', p ? '1' : '0'); pause.setAttribute('aria-pressed', p ? 'true' : 'false'); pause.setAttribute('aria-label', p ? 'Retomar' : 'Pausar'); pause.textContent = p ? '▶' : '⏸'; };
  const passo = (dir: number) => { setPausa(true); try { (track as HTMLElement).scrollBy({ left: dir * Math.max(160, comp.clientWidth * 0.6), behavior: 'smooth' }); } catch { /* ok */ } };
  on(pause, 'click', () => setPausa(comp.getAttribute('data-ticker-paused') !== '1'));
  on(prev, 'click', () => passo(-1));
  on(next, 'click', () => passo(1));
  // pausa ao receber foco/hover (respeita reduced-motion implicitamente via CSS)
  on(comp, 'focusin', () => setPausa(true));
  try { if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) setPausa(true); } catch { /* ok */ }
  _cleanups.push(() => { barra.remove(); comp.removeAttribute('data-ticker-paused'); });
}

// ────────────────────────────── ciclo de vida ────────────────────────────────
export function enhanceMobileShell(): void {
  if (_ligado) return; // idempotente
  if (!q('#app-shell[data-mobile]')) return; // só com o marcador (flag ON)
  _ligado = true;
  try { wireDrawer(); } catch { /* isola */ }
  try { wireHeaderMais(); } catch { /* isola */ }
  try { wireTicker(); } catch { /* isola */ }
}
export function teardownMobileShell(): void {
  if (!_ligado) return;
  _cleanups.splice(0).reverse().forEach((fn) => { try { fn(); } catch { /* ok */ } });
  _ligado = false;
}
export function isEnhanced(): boolean { return _ligado; }

export default { enhanceMobileShell, teardownMobileShell, isEnhanced };
