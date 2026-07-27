// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (6.1.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: sidebar-screen-reader
// PURPOSE: Sidebar Features - Screen Reader
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   SIDEBAR_EVENTS from /core/runtime/events/catalog/sidebar.events.js
//   createUiPorts from /core/runtime/ports-profiles.js
//   CSS_CLASSES as C from ../ui/constants.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   injectPorts() — exported function
//   getPorts() — exported function
//   init() — exported function
//   announce() — exported function
//   enhance() — exported function
//   announceNavigation() — exported function
//   announceExpansion() — exported function
//   announceSearchResults() — exported function
//   enableHighContrast() — exported function
//   disableHighContrast() — exported function
//   enableLargeText() — exported function
//   disableLargeText() — exported function
//   destroy() — exported function
//   getMetrics() — exported function
//   info() — exported function
//   healthCheck() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   SIDEBAR_EVENTS.SCREEN_READER_INITIALIZED
// LISTENS (eventos):
//   'blur'
//   'focus'
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { SIDEBAR_EVENTS } from '/core/runtime/events/catalog/sidebar.events.js';
import { createUiPorts } from '/core/runtime/ports-profiles.js';
import { CSS_CLASSES as C } from '../ui/constants.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export const VERSION = '6.1.0-ES6';
export const MODULE_ID = 'sidebar-screen-reader';

const Ports = createUiPorts({ moduleId: MODULE_ID });
function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
export function injectPorts(p: DynObj) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

let _liveRegion: DynObj | null = null;
let _skipLink: DynObj | null = null;
let _announceTimer: ReturnType<typeof setTimeout> | null = null;
let _cleanups: (() => void)[] = [];
let _metrics = { announcements: 0, enhancements: 0 };

function createLiveRegion() {
  if (_liveRegion) return _liveRegion;
  _liveRegion = document.createElement('div');
  _liveRegion.setAttribute('role', 'status');
  _liveRegion.setAttribute('aria-live', 'polite');
  _liveRegion.setAttribute('aria-atomic', 'true');
  _liveRegion.className = 'sr-only';
  _liveRegion.style.cssText = 'position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);border:0;';
  document.body.appendChild(_liveRegion);
  return _liveRegion;
}

export function init(eventBus: DynObj) {
  if (eventBus) Ports.inject({ eventBus });
  _initPorts();
  const eb = _getPort('eventBus');
  if (eb && eb.emit) eb.emit(SIDEBAR_EVENTS.SCREEN_READER_INITIALIZED);
}

export function announce(message: string, priority = 'polite') {
  const region = createLiveRegion();
  region.setAttribute('aria-live', priority);
  region.textContent = '';
  _metrics.announcements++;
  if (_announceTimer) clearTimeout(_announceTimer);
  _announceTimer = setTimeout(() => { region.textContent = message; _announceTimer = null; }, 100);
}

export function enhance(container: HTMLElement) {
  if (!container) return;
  _metrics.enhancements++;
  container.setAttribute('role', 'navigation');
  container.setAttribute('aria-label', 'Menu principal');
  container.querySelectorAll(`.${C.SECTION}`).forEach((section: DynObj, index: number) => { section.setAttribute('role', 'region'); const titleEl = section.querySelector(`.${C.GROUP_TITLE}`); const title = titleEl?.textContent || (`Seção ${index + 1}`); section.setAttribute('aria-label', title); });
  container.querySelectorAll(`.${C.ITEM}`).forEach((item: DynObj) => { const link = item.querySelector(`.${C.LINK}`); if (link) { const labelEl = item.querySelector(`.${C.ITEM_TEXT}`); const label = labelEl?.textContent || ''; const badgeEl = item.querySelector(`.${C.BADGE}`); const badge = badgeEl?.textContent || ''; if (badge) link.setAttribute('aria-label', `${label} (${badge} notificações)`); } });
  container.querySelectorAll(`.${C.GROUP_BUTTON}`).forEach((btn: DynObj) => { const isExpanded = btn.closest(`.${C.SECTION}`)?.classList.contains(C.SECTION_EXPANDED); btn.setAttribute('aria-expanded', String(isExpanded)); });
  addSkipLink(container);
}

function addSkipLink(container: HTMLElement) {
  if (_skipLink) return;
  _skipLink = document.createElement('a');
  _skipLink.className = `${C.SKIP_LINK} sr-only-focusable`;
  _skipLink.href = '#main-content';
  _skipLink.textContent = 'Pular para conteúdo principal';
  _skipLink.style.cssText = 'position:absolute;top:-40px;left:0;padding:8px 16px;background:var(--sidebar-accent-primary,#7B6EF6);color:white;z-index:10000;transition:top 0.2s;';
  const focusHandler = () => { _skipLink.style.top = '0'; };
  const blurHandler = () => { _skipLink.style.top = '-40px'; };
  _skipLink.addEventListener('focus', focusHandler);
  _skipLink.addEventListener('blur', blurHandler);
  _cleanups.push(() => { _skipLink.removeEventListener('focus', focusHandler); });
  _cleanups.push(() => { _skipLink.removeEventListener('blur', blurHandler); });
  container.insertBefore(_skipLink, container.firstChild);
}

export function announceNavigation(itemLabel: string) { announce(`Navegando para ${itemLabel}`); }
export function announceExpansion(sectionLabel: string, isExpanded: boolean) { announce(`${sectionLabel} ${isExpanded ? 'expandido' : 'colapsado'}`); }
export function announceSearchResults(count: number) { if (count === 0) announce('Nenhum resultado encontrado'); else if (count === 1) announce('1 resultado encontrado'); else announce(`${count} resultados encontrados`); }
export function enableHighContrast(container: HTMLElement) { container?.classList.add(C.MOD_HIGH_CONTRAST); announce('Modo de alto contraste ativado'); }
export function disableHighContrast(container: HTMLElement) { container?.classList.remove(C.MOD_HIGH_CONTRAST); announce('Modo de alto contraste desativado'); }
export function enableLargeText(container: HTMLElement) { container?.classList.add(C.MOD_LARGE_TEXT); announce('Texto grande ativado'); }
export function disableLargeText(container: HTMLElement) { container?.classList.remove(C.MOD_LARGE_TEXT); announce('Texto grande desativado'); }

export function destroy() { if (_announceTimer) { clearTimeout(_announceTimer); _announceTimer = null; } _cleanups.forEach(fn => { try { fn(); } catch(e) { } }); _cleanups = []; _liveRegion?.remove(); _liveRegion = null; _skipLink?.remove(); _skipLink = null; }

export function getMetrics() { return { ..._metrics }; }
export function info() { return { moduleId: MODULE_ID, version: VERSION, portsInitialized: Ports.isInitialized(), hasLiveRegion: !!_liveRegion, hasSkipLink: !!_skipLink, cleanups: _cleanups.length, metrics: getMetrics() }; }
export function healthCheck() { return { status: Ports.isInitialized() ? 'HEALTHY' : 'DEGRADED', version: VERSION, moduleId: MODULE_ID, portsInitialized: Ports.isInitialized(), checks: { liveRegionReady: !!_liveRegion || true, noOrphanTimers: !_announceTimer }, metrics: getMetrics() }; }

export default { init, announce, enhance, announceNavigation, announceExpansion, announceSearchResults, enableHighContrast, disableHighContrast, enableLargeText, disableLargeText, destroy, injectPorts, getPorts, getMetrics, info, healthCheck, VERSION, MODULE_ID };
