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
let _drawerWired = false;
function wireDrawer() {
  if (_drawerWired) return; // listeners de documento só uma vez (idempotente entre re-aplicações)
  _drawerWired = true;
  // Escape fecha; Tab faz trap dentro do drawer quando aberto
  on(document, 'keydown', (e: Event) => {
    const ev = e as KeyboardEvent; if (!drawerAberto()) return;
    if (ev.key === 'Escape') { ev.preventDefault(); fecharDrawer(); return; }
    if (ev.key === 'Tab') {
      const drawer = q('.dsd-sidebar'); if (!drawer) return;
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
  // delegação única no documento: abre/fecha pelo ☰/toggle e fecha ao clicar no overlay
  on(document, 'click', (e: Event) => {
    const tgt = e.target as HTMLElement;
    if (tgt?.closest?.('[data-action="sidebar.toggle"],[data-navrail-id="toggle-sidebar"]')) {
      e.preventDefault(); drawerAberto() ? fecharDrawer() : abrirDrawer(); return;
    }
    if (tgt?.closest?.('.dsd-sidebar-overlay')) { if (drawerAberto()) fecharDrawer(); }
  });
  _cleanups.push(() => { _drawerWired = false; if (drawerAberto()) fecharDrawer(); });
}

// ────────────────────────────── ITEM 1: HEADER COMPACTO 2 FAIXAS (v3) ─────────
// Faixa 1: ☰ (drawer) · identidade (user-menu, já no header-left) · sino · Mais(⋯).
// Faixa 2: indicadores de status (relógio/saúde/câmbio/clima).
// Integrações e demais ações secundárias → sheet "Mais". Tudo reversível no teardown.
// Faixa 2 (prioridade do Jhony): saúde do sistema, relógio/hora e Ambiente (PROD/TEST).
// (clima/câmbio seguem no strip rolável como indicadores secundários.)
const STRIP_KEYS = ['errors-status', 'real-time-clock', 'environment-chip', 'weather-sp', 'currency-rotator'];
const BAND1_KEEP = ['notifications', 'user-menu']; // sino + IDENTIDADE permanecem na faixa 1
const HIDE_KEYS = ['logo']; // marca redundante no mobile (escondida via CSS; nunca movida)
const WRAP_SEL = '.header-component-wrapper,.header-component-fallback';
// Controles fixos NÃO-wrapper gerenciados pelo app (toggle de tema, editor de header,
// indicadores de tráfego) NÃO são movidos — o app os recria e duplicaria (loop). Eles
// são ESCONDIDOS via CSS no mobile. Aqui o strip aceita só um hook explícito de opt-in.
const EXTRA_STRIP_SEL = '[data-hdr-strip-extra]';
const isWrap = (n: HTMLElement) => n.classList.contains('header-component-wrapper') || n.classList.contains('header-component-fallback');
const keyOf = (w: HTMLElement): string => w.getAttribute('data-component-key') || w.getAttribute('data-component') || '';
function wireCompactHeader() {
  const header = q('.site-header'); if (!header) return; // header ainda não renderizado → tenta de novo depois
  const inner = q('.header-inner', header) || header;
  const right = q('.header-right', header);
  const left = q('.header-left', header);
  const host = q('#app-shell') || document.body;
  // move idempotente com âncora restaurável (reversível no teardown)
  const moveTo = (target: HTMLElement, n: HTMLElement) => {
    if (n.parentNode === target) return;
    const anchor = document.createComment('avst6'); n.parentNode?.insertBefore(anchor, n); target.appendChild(n);
    _cleanups.push(() => { try { anchor.parentNode?.insertBefore(n, anchor); anchor.remove(); } catch { /* ok */ } });
  };
  const moveAfter = (ref: HTMLElement, n: HTMLElement) => {
    if (n === ref) return;
    const anchor = document.createComment('avst6'); n.parentNode?.insertBefore(anchor, n); ref.parentNode?.insertBefore(n, ref.nextSibling);
    _cleanups.push(() => { try { anchor.parentNode?.insertBefore(n, anchor); anchor.remove(); } catch { /* ok */ } });
  };

  // (a) ☰ — idempotente (abre o drawer via delegação do wireDrawer)
  if (!q('.avst6-hdr-menu', header)) {
    const menuBtn = document.createElement('button');
    menuBtn.type = 'button'; menuBtn.className = 'avst6-hdr-menu';
    menuBtn.setAttribute('data-action', 'sidebar.toggle');
    menuBtn.setAttribute('aria-controls', 'sidebar'); menuBtn.setAttribute('aria-haspopup', 'dialog');
    menuBtn.setAttribute('aria-expanded', 'false'); menuBtn.setAttribute('aria-label', 'Abrir menu de navegação');
    menuBtn.innerHTML = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M3 6h18M3 12h18M3 18h18"/></svg>';
    inner.insertBefore(menuBtn, inner.firstChild);
    _cleanups.push(() => menuBtn.remove());
  }
  const menuBtn = q<HTMLElement>('.avst6-hdr-menu', header);
  const maisBtnExist = q<HTMLElement>('.avst6-mais-btn', header);

  // (a2) IDENTIDADE — traz o user-menu para a faixa 1, logo após o ☰ (some do "Mais")
  const identity = q<HTMLElement>('.header-component-wrapper[data-component-key="user-menu"],.header-component-fallback[data-component="user-menu"]', header);
  if (identity && menuBtn && identity.parentNode !== inner) moveAfter(menuBtn, identity);

  // (b) FAIXA 2 (strip) — indicadores de status de QUALQUER slot (left/center→right)
  let strip = q<HTMLElement>('.avst6-hdr-strip', header);
  const stripAlvos: HTMLElement[] = [];
  STRIP_KEYS.forEach((k) => qa(`.header-component-wrapper[data-component-key="${k}"],.header-component-fallback[data-component="${k}"]`, header).forEach((n) => { if (!n.closest('.avst6-hdr-strip,.avst6-mais-sheet')) stripAlvos.push(n); }));
  qa(EXTRA_STRIP_SEL, header).forEach((n) => { if (!n.closest('.avst6-hdr-strip,.avst6-mais-sheet')) stripAlvos.push(n); });
  if (stripAlvos.length) {
    if (!strip) {
      strip = document.createElement('div');
      strip.className = 'avst6-hdr-strip'; strip.setAttribute('role', 'group'); strip.setAttribute('aria-label', 'Indicadores de status');
      header.appendChild(strip); host.setAttribute('data-hdr-strip', '1');
      const s0 = strip; _cleanups.push(() => { s0.remove(); host.removeAttribute('data-hdr-strip'); });
    }
    const s1 = strip; stripAlvos.forEach((n) => moveTo(s1, n));
  }

  // (c) sheet "Mais" — varre o HEADER INTEIRO (left + right + inner): wrappers secundários
  // (integrações/painéis) e controles fixos soltos (ex.: #hie-trigger-btn, toggle de tema).
  // Mantém na faixa 1 apenas ☰ · identidade · sino · Mais. Logo é escondido via CSS.
  let sheet = q<HTMLElement>('.avst6-mais-sheet', host);
  const sheetAlvos: HTMLElement[] = [];
  // c1) wrappers de topo, em qualquer slot, que não são status/identidade/sino/logo
  qa(WRAP_SEL, header).forEach((n) => {
    const k = keyOf(n);
    if (STRIP_KEYS.includes(k) || BAND1_KEEP.includes(k) || HIDE_KEYS.includes(k)) return;
    if (n.closest('.avst6-hdr-strip,.avst6-mais-sheet')) return;
    if (n.parentElement && n.parentElement.closest(WRAP_SEL)) return; // só o wrapper de topo
    sheetAlvos.push(n);
  });
  // NOTA V11: NÃO varrer controles NÃO-wrapper soltos (toggle de tema, #hie-trigger-btn,
  // .traffic-indicator). Movê-los faz o app recriá-los no header e o curador os move de
  // novo → duplicação (visto no HEADER_AUDIT do V10: 7× dsd-theme-toggle). Esses controles
  // gerenciados pelo app são ESCONDIDOS via CSS (position em fluxo não resolve o loop).
  // A sheet "Mais" recebe apenas WRAPPERS (integrações/painéis), que são estáveis ao mover.
  void left; void isWrap;
  if (sheetAlvos.length) {
    if (!sheet) {
      sheet = document.createElement('div');
      sheet.className = 'avst6-mais-sheet'; sheet.id = 'avst6-mais-sheet';
      sheet.setAttribute('role', 'dialog'); sheet.setAttribute('aria-label', 'Mais opções'); sheet.hidden = true;
      const backdrop = document.createElement('div'); backdrop.className = 'avst6-mais-backdrop'; backdrop.hidden = true;
      const maisBtn = document.createElement('button');
      maisBtn.type = 'button'; maisBtn.className = 'avst6-mais-btn'; maisBtn.setAttribute('aria-haspopup', 'dialog');
      maisBtn.setAttribute('aria-expanded', 'false'); maisBtn.setAttribute('aria-controls', 'avst6-mais-sheet'); maisBtn.setAttribute('aria-label', 'Mais opções');
      maisBtn.innerHTML = '<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="5" cy="12" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="19" cy="12" r="1.8"/></svg>';
      const sh = sheet, bd = backdrop;
      let origem: HTMLElement | null = null;
      const fechar = () => { sh.hidden = true; bd.hidden = true; maisBtn.setAttribute('aria-expanded', 'false'); try { origem?.focus(); } catch { /* ok */ } };
      const abrir = () => { origem = document.activeElement as HTMLElement; sh.hidden = false; bd.hidden = false; maisBtn.setAttribute('aria-expanded', 'true'); const f = q<HTMLElement>(FOCAVEIS, sh); try { (f || sh).focus(); } catch { /* ok */ } };
      on(maisBtn, 'click', () => (sh.hidden ? abrir() : fechar()));
      on(bd, 'click', () => fechar());
      on(sh, 'keydown', (e: Event) => { if ((e as KeyboardEvent).key === 'Escape') { e.preventDefault(); fechar(); } });
      on(document, 'click', (e: Event) => { const a = (e.target as HTMLElement)?.closest?.('.avst6-mais-sheet .header-component-wrapper,.avst6-mais-sheet .header-component-fallback,.avst6-mais-sheet a,.avst6-mais-sheet button'); if (a && a !== maisBtn) fechar(); });
      if (right) right.appendChild(maisBtn); else inner.appendChild(maisBtn);
      host.appendChild(bd); host.appendChild(sh);
      _cleanups.push(() => { maisBtn.remove(); bd.remove(); sh.remove(); });
    }
    const sh1 = sheet; sheetAlvos.forEach((n) => moveTo(sh1, n));
  }
}

// ────────────────────────────── ITEM 4: TICKER controles ─────────────────────
function wireTicker() {
  const comp = q('.news-ticker-component'); const track = q('.ticker-track'); if (!comp || !track) return;
  if (q('.avst6-ticker-ctrl', comp)) return; // já montado (idempotente entre re-aplicações)
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

// ────────────────────── ITEM 5: BOTTOM-NAV complementar (slim) ────────────────
// A política xs (<576px) desliga o nav-rail nativo (navRail.visible=false). Sob o
// marcador (flag ON), montamos uma barra INFERIOR fininha só de ATALHOS para os
// destinos reais da sidebar (nunca substitui a sidebar, que é a navegação primária).
// Tudo reversível no teardown. Rótulos/rotas/ícones vêm da própria sidebar.
const BOTTOMNAV_MAX = 5;
function wireBottomNav() {
  const host = q('#app-shell'); if (!host) return;
  if (q('.avst6-bottomnav', host)) return; // idempotente
  const sidebar = q('.dsd-sidebar'); if (!sidebar) return;
  const links = qa('.dsd-sidebar__link[href]', sidebar).filter((a) => {
    const href = a.getAttribute('href') || ''; return href && href !== '#' && a.getAttribute('aria-disabled') !== 'true';
  }).slice(0, BOTTOMNAV_MAX);
  if (!links.length) return;
  const here = (location.pathname + location.search).replace(/\/+$/, '') || '/';
  const nav = document.createElement('nav');
  nav.className = 'avst6-bottomnav'; nav.setAttribute('role', 'navigation'); nav.setAttribute('aria-label', 'Atalhos de navegação');
  links.forEach((src) => {
    const href = src.getAttribute('href') || '#';
    const label = (q('.dsd-sidebar__item-text', src)?.textContent || src.textContent || '').trim().replace(/\s+/g, ' ');
    const iconSrc = q('.dsd-sidebar__item-icon', src);
    const a = document.createElement('a');
    a.className = 'avst6-bn-item'; a.setAttribute('href', href);
    const norm = href.replace(/\/+$/, '') || '/';
    if (norm === here || src.getAttribute('aria-current') === 'page' || src.closest('.dsd-sidebar__item')?.classList.contains('is-active')) {
      a.classList.add('avst6-bn-item--active'); a.setAttribute('aria-current', 'page');
    }
    const ico = document.createElement('span'); ico.className = 'avst6-bn-icon'; ico.setAttribute('aria-hidden', 'true');
    ico.innerHTML = iconSrc ? iconSrc.innerHTML : '';
    const txt = document.createElement('span'); txt.className = 'avst6-bn-label'; txt.textContent = label || '—';
    a.title = label; a.setAttribute('aria-label', label);
    a.append(ico, txt); nav.appendChild(a);
  });
  host.appendChild(nav); host.setAttribute('data-bottomnav', '1');
  _cleanups.push(() => { nav.remove(); host.removeAttribute('data-bottomnav'); });
}

// ────────────────────────────── ciclo de vida ────────────────────────────────
export function enhanceMobileShell(): void {
  if (!q('#app-shell[data-mobile]')) return; // só com o marcador (flag ON)
  _ligado = true;
  // Re-executável e auto-curativo: cada wire é idempotente por DOM e NÃO trava se o
  // seu contêiner ainda não renderizou. Assim, quando o marcador re-aplica (shell
  // pronto, componentes carregados tarde, re-render de rota), o que faltava é montado.
  try { wireDrawer(); } catch { /* isola */ }
  try { wireCompactHeader(); } catch { /* isola */ }
  try { wireTicker(); } catch { /* isola */ }
  try { wireBottomNav(); } catch { /* isola */ }
}
export function teardownMobileShell(): void {
  if (!_ligado) return;
  _cleanups.splice(0).reverse().forEach((fn) => { try { fn(); } catch { /* ok */ } });
  _ligado = false;
}
export function isEnhanced(): boolean { return _ligado; }

export default { enhanceMobileShell, teardownMobileShell, isEnhanced };
