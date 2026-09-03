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

// ────────────────────────────── ITEM 1: HEADER COMPACTO 2 FAIXAS (v3) ─────────
// Faixa 1: ☰ (drawer) · identidade (user-menu, já no header-left) · sino · Mais(⋯).
// Faixa 2: indicadores de status (relógio/saúde/câmbio/clima).
// Integrações e demais ações secundárias → sheet "Mais". Tudo reversível no teardown.
const STRIP_KEYS = ['real-time-clock', 'weather-sp', 'currency-rotator', 'errors-status'];
const BAND1_KEEP = ['notifications']; // sino permanece visível na faixa 1
const WRAP_SEL = '.header-component-wrapper,.header-component-fallback';
const keyOf = (w: HTMLElement): string => w.getAttribute('data-component-key') || w.getAttribute('data-component') || '';
function wireCompactHeader() {
  const header = q('.site-header'); if (!header) return;
  const inner = q('.header-inner', header) || header;
  const right = q('.header-right', header);
  const host = q('#app-shell') || document.body;
  const moved: Array<{ node: HTMLElement; anchor: Comment }> = [];
  const restaurar = (list: typeof moved) => list.forEach(({ node, anchor }) => { anchor.parentNode?.insertBefore(node, anchor); anchor.remove(); });

  // (a) ☰ — abre o drawer via delegação já existente (wireDrawer / data-action)
  const menuBtn = document.createElement('button');
  menuBtn.type = 'button'; menuBtn.className = 'avst6-hdr-menu';
  menuBtn.setAttribute('data-action', 'sidebar.toggle');
  menuBtn.setAttribute('aria-controls', 'sidebar'); menuBtn.setAttribute('aria-haspopup', 'dialog');
  menuBtn.setAttribute('aria-expanded', 'false'); menuBtn.setAttribute('aria-label', 'Abrir menu de navegação');
  menuBtn.innerHTML = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M3 6h18M3 12h18M3 18h18"/></svg>';
  inner.insertBefore(menuBtn, inner.firstChild);

  // (b) faixa 2 (status strip) — move indicadores por data-component-key
  const strip = document.createElement('div');
  strip.className = 'avst6-hdr-strip'; strip.setAttribute('role', 'group'); strip.setAttribute('aria-label', 'Indicadores de status');
  if (right) STRIP_KEYS.forEach((k) => {
    qa(`.header-component-wrapper[data-component-key="${k}"],.header-component-fallback[data-component="${k}"]`, right).forEach((n) => {
      const anchor = document.createComment('strip'); n.parentNode?.insertBefore(anchor, n); strip.appendChild(n); moved.push({ node: n, anchor });
    });
  });
  const hasStrip = strip.childElementCount > 0;
  if (hasStrip) { header.appendChild(strip); host.setAttribute('data-hdr-strip', '1'); }

  // (c) sheet "Mais" — move o resto do header-right (integrações etc.); sino fica
  const sheet = document.createElement('div');
  sheet.className = 'avst6-mais-sheet'; sheet.id = 'avst6-mais-sheet';
  sheet.setAttribute('role', 'dialog'); sheet.setAttribute('aria-label', 'Mais opções'); sheet.hidden = true;
  const backdrop = document.createElement('div'); backdrop.className = 'avst6-mais-backdrop'; backdrop.hidden = true;
  const maisBtn = document.createElement('button');
  maisBtn.type = 'button'; maisBtn.className = 'avst6-mais-btn'; maisBtn.setAttribute('aria-haspopup', 'dialog');
  maisBtn.setAttribute('aria-expanded', 'false'); maisBtn.setAttribute('aria-controls', 'avst6-mais-sheet'); maisBtn.setAttribute('aria-label', 'Mais opções');
  maisBtn.innerHTML = '<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="5" cy="12" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="19" cy="12" r="1.8"/></svg>';
  const movedSheet: Array<{ node: HTMLElement; anchor: Comment }> = [];
  if (right) qa(`:scope > ${WRAP_SEL}`, right).forEach((n) => {
    if (BAND1_KEEP.includes(keyOf(n))) return; // sino permanece
    const anchor = document.createComment('mais'); n.parentNode?.insertBefore(anchor, n); sheet.appendChild(n); movedSheet.push({ node: n, anchor });
  });
  const hasMais = movedSheet.length > 0;
  if (right && hasMais) { right.appendChild(maisBtn); host.appendChild(backdrop); host.appendChild(sheet); }

  let origem: HTMLElement | null = null;
  const fechar = () => { sheet.hidden = true; backdrop.hidden = true; maisBtn.setAttribute('aria-expanded', 'false'); try { origem?.focus(); } catch { /* ok */ } };
  const abrir = () => { origem = document.activeElement as HTMLElement; sheet.hidden = false; backdrop.hidden = false; maisBtn.setAttribute('aria-expanded', 'true'); const f = q<HTMLElement>(FOCAVEIS, sheet); try { (f || sheet).focus(); } catch { /* ok */ } };
  if (hasMais) {
    on(maisBtn, 'click', () => (sheet.hidden ? abrir() : fechar()));
    on(backdrop, 'click', () => fechar());
    on(sheet, 'keydown', (e: Event) => { if ((e as KeyboardEvent).key === 'Escape') { e.preventDefault(); fechar(); } });
    on(document, 'click', (e: Event) => { const a = (e.target as HTMLElement)?.closest?.('.avst6-mais-sheet .header-component-wrapper,.avst6-mais-sheet .header-component-fallback'); if (a) fechar(); });
  }

  // (d) sinal de overflow da faixa de status
  const checkOverflow = () => { try { header.setAttribute('data-strip-overflow', hasStrip && strip.scrollWidth > strip.clientWidth + 2 ? '1' : '0'); } catch { /* ok */ } };
  if (hasStrip) { checkOverflow(); on(window, 'resize', checkOverflow); }

  _cleanups.push(() => {
    restaurar(moved); restaurar(movedSheet);
    menuBtn.remove(); maisBtn.remove(); strip.remove(); sheet.remove(); backdrop.remove();
    host.removeAttribute('data-hdr-strip'); header.removeAttribute('data-strip-overflow');
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
  try { wireCompactHeader(); } catch { /* isola */ }
  try { wireTicker(); } catch { /* isola */ }
}
export function teardownMobileShell(): void {
  if (!_ligado) return;
  _cleanups.splice(0).reverse().forEach((fn) => { try { fn(); } catch { /* ok */ } });
  _ligado = false;
}
export function isEnhanced(): boolean { return _ligado; }

export default { enhanceMobileShell, teardownMobileShell, isEnhanced };
