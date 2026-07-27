// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (6.1.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: sidebar-context-menu
// PURPOSE: Sidebar Features - Context Menu
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
//   showMenu() — exported function
//   hideMenu() — exported function
//   onAction() — exported function
//   setupContextMenu() — exported function
//   destroy() — exported function
//   getMetrics() — exported function
//   info() — exported function
//   healthCheck() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   SIDEBAR_EVENTS.CONTEXT_INITIALIZED
// LISTENS (eventos):
//   'click'
//   'contextmenu'
//   'keydown'
// WINDOW ACCESS:
//   window.innerHeight
//   window.innerWidth
// ═══════════════════════════════════════════════════════════════
'use strict';

import { SIDEBAR_EVENTS } from '/core/runtime/events/catalog/sidebar.events.js';
import { createUiPorts } from '/core/runtime/ports-profiles.js';
import { CSS_CLASSES as C } from '../ui/constants.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export const VERSION = '6.1.0-ES6';
export const MODULE_ID = 'sidebar-context-menu';

const Ports = createUiPorts({ moduleId: MODULE_ID });
function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
export function injectPorts(p: DynObj) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

const CM_SVGS = {
  star: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>',
  externalLink: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>',
  link: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>',
  eyeOff: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>',
  info: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>'
};

let _menu: HTMLElement | null = null;
let _currentItemId: string | null = null;
let _handlers = {};
let _cleanups: (() => void)[] = [];
let _itemCleanups: (() => void)[] = [];
let _metrics = { opens: 0, closes: 0, actions: 0, errors: 0 };

const DEFAULT_ACTIONS = [
  { id: 'favorite', label: 'Adicionar aos favoritos', icon: CM_SVGS.star },
  { id: 'open-new', label: 'Abrir em nova aba', icon: CM_SVGS.externalLink },
  { id: 'copy-link', label: 'Copiar link', icon: CM_SVGS.link },
  { id: 'separator', type: 'separator' },
  { id: 'hide', label: 'Ocultar item', icon: CM_SVGS.eyeOff },
  { id: 'info', label: 'Informações', icon: CM_SVGS.info }
];

function createMenu() {
  if (_menu) return _menu;
  _menu = document.createElement('div');
  _menu.className = C.CONTEXT_MENU;
  _menu.setAttribute('role', 'menu');
  _menu.setAttribute('aria-hidden', 'true');
  document.body.appendChild(_menu);
  const closeHandler = (e: DynObj) => { if (!_menu!.contains((e.target as DynObj))) hideMenu(); };
  document.addEventListener('click', closeHandler);
  _cleanups.push(() => { document.removeEventListener('click', closeHandler); });
  const contextHandler = (e: KeyboardEvent) => { if (!_menu!.contains((e.target as DynObj))) hideMenu(); };
  // @ts-expect-error strict migration — TS2769
  document.addEventListener('contextmenu', contextHandler);
  // @ts-expect-error strict migration — TS2769
  _cleanups.push(() => { document.removeEventListener('contextmenu', contextHandler); });
  const escHandler = (e: KeyboardEvent) => { if (e.key === 'Escape') hideMenu(); };
  document.addEventListener('keydown', escHandler);
  _cleanups.push(() => { document.removeEventListener('keydown', escHandler); });
  return _menu;
}

function clearItemCleanups() { _itemCleanups.forEach(fn => { try { fn(); } catch(e) { } }); _itemCleanups = []; }

function renderMenuItems(actions: DynObj) {
  clearItemCleanups();
  _menu!.innerHTML = '';
  actions.forEach((action: DynObj) => {
    if (action.type === 'separator') { const sep = document.createElement('div'); sep.className = C.CONTEXT_MENU_SEPARATOR; _menu!.appendChild(sep); return; }
    const item = document.createElement('button');
    item.className = C.CONTEXT_MENU_ITEM;
    item.setAttribute('type', 'button');
    item.setAttribute('role', 'menuitem');
    item.setAttribute('data-action', action.id);
    item.innerHTML = `<span class="${C.CONTEXT_MENU_ICON}">${action.icon || ''}</span><span class="${C.CONTEXT_MENU_LABEL}">${action.label}</span>`;
    const clickHandler = () => { _metrics.actions++; if ((_handlers as DynObj)[action.id]) (_handlers as DynObj)[action.id](_currentItemId, action); hideMenu(); };
    item.addEventListener('click', clickHandler);
    _itemCleanups.push(() => { item.removeEventListener('click', clickHandler); });
    _menu!.appendChild(item);
  });
}

export function init(eventBus: DynObj) {
  if (eventBus) Ports.inject({ eventBus });
  _initPorts();
  const eb = _getPort('eventBus');
  if (eb && eb.emit) eb.emit(SIDEBAR_EVENTS.CONTEXT_INITIALIZED);
}

export function showMenu(x: number, y: number, itemId: string, customActions: DynObj) {
  createMenu();
  _currentItemId = itemId;
  _metrics.opens++;
  const actions = customActions || DEFAULT_ACTIONS;
  renderMenuItems(actions);
  _menu!.style.left = `${x}px`;
  _menu!.style.top = `${y}px`;
  _menu!.classList.add(C.CONTEXT_MENU_VISIBLE);
  _menu!.setAttribute('aria-hidden', 'false');
  requestAnimationFrame(() => {
    const rect = _menu!.getBoundingClientRect();
    if (rect.right > window.innerWidth) _menu!.style.left = `${window.innerWidth - rect.width - 10}px`;
    if (rect.bottom > window.innerHeight) _menu!.style.top = `${window.innerHeight - rect.height - 10}px`;
  });
}

export function hideMenu() { if (_menu) { _menu.classList.remove(C.CONTEXT_MENU_VISIBLE); _menu.setAttribute('aria-hidden', 'true'); _metrics.closes++; } _currentItemId = null; }
export function onAction(actionId: string, handler: DynObj) { (_handlers as DynObj)[actionId] = handler; }

export function setupContextMenu(container: HTMLElement, customActions: DynObj) {
  if (!container) return () => {};
  const handler = (e: DynObj) => { const item = e.target.closest(`.${C.ITEM}`); if (!item) return; e.preventDefault(); const itemId = item.dataset.itemId; showMenu(e.clientX, e.clientY, itemId, customActions); };
  container.addEventListener('contextmenu', handler);
  _cleanups.push(() => { container.removeEventListener('contextmenu', handler); });
  return () => { destroy(); };
}

export function destroy() { clearItemCleanups(); _cleanups.forEach(fn => { try { fn(); } catch(e) { } }); _cleanups = []; if (_menu) { _menu.remove(); _menu = null; } _handlers = {}; }
export function getMetrics() { return { opens: _metrics.opens, closes: _metrics.closes, actions: _metrics.actions, errors: _metrics.errors }; }
export function info() { return { moduleId: MODULE_ID, version: VERSION, portsInitialized: Ports.isInitialized(), menuCreated: !!_menu, handlersCount: Object.keys(_handlers).length, currentItemId: _currentItemId, cleanups: _cleanups.length, itemCleanups: _itemCleanups.length, metrics: getMetrics() }; }
export function healthCheck() { return { status: _metrics.errors === 0 ? 'HEALTHY' : 'DEGRADED', version: VERSION, moduleId: MODULE_ID, portsInitialized: Ports.isInitialized(), checks: { menuCreated: !!_menu, handlersCount: Object.keys(_handlers).length }, metrics: getMetrics() }; }

export default { init, showMenu, hideMenu, onAction, setupContextMenu, destroy, injectPorts, getPorts, getMetrics, info, healthCheck, VERSION, MODULE_ID, DEFAULT_ACTIONS };
