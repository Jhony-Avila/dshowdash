// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (6.1.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: sidebar-submenu
// PURPOSE: Sidebar Features - Submenu Handler
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
//   createSubmenu() — exported function
//   addSubmenuToItem() — exported function
//   toggleSubmenu() — exported function
//   openSubmenu() — exported function
//   closeSubmenu() — exported function
//   closeAllSubmenus() — exported function
//   setupSubmenuHandlers() — exported function
//   destroy() — exported function
//   getMetrics() — exported function
//   info() — exported function
//   healthCheck() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   SIDEBAR_EVENTS.SUBMENU_INITIALIZED
//   SIDEBAR_EVENTS.SUBMENU_TOGGLED
// LISTENS (eventos):
//   'click'
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
export const MODULE_ID = 'sidebar-submenu';

const Ports = createUiPorts({ moduleId: MODULE_ID });
function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
export function injectPorts(p: DynObj) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

let _cleanups: (() => void)[] = [];
let _metrics = { creates: 0, toggles: 0, opens: 0, closes: 0 };

export function init(eventBus: DynObj) {
  if (eventBus) Ports.inject({ eventBus });
  _initPorts();
  const eb = _getPort('eventBus');
  if (eb && eb.emit) eb.emit(SIDEBAR_EVENTS.SUBMENU_INITIALIZED);
}

export function createSubmenu(items: DynObj[]) {
  _metrics.creates++;
  const submenu = document.createElement('ul');
  submenu.className = C.SUBMENU;
  submenu.setAttribute('role', 'menu');
  items.forEach((item: DynObj) => {
    const li = document.createElement('li');
    li.className = C.SUBMENU_ITEM;
    li.setAttribute('role', 'none');
    const link = document.createElement('a');
    link.className = C.SUBMENU_LINK;
    link.href = item.route || (`#${item.id}`);
    link.setAttribute('role', 'menuitem');
    link.setAttribute('data-submenu-item', item.id);
    link.textContent = item.label || item.title || item.id;
    li.appendChild(link);
    submenu.appendChild(li);
  });
  return submenu;
}

export function addSubmenuToItem(itemElement: HTMLElement, submenuItems: DynObj[]) {
  if (!itemElement || !submenuItems?.length) return null;
  itemElement.classList.add(C.ITEM_HAS_SUBMENU);
  const submenu = createSubmenu(submenuItems);
  itemElement.appendChild(submenu);
  return submenu;
}

export function toggleSubmenu(itemElement: HTMLElement) {
  if (!itemElement?.classList.contains(C.ITEM_HAS_SUBMENU)) return false;
  _metrics.toggles++;
  const isOpen = itemElement.classList.toggle(C.ITEM_SUBMENU_OPEN);
  const eb = _getPort('eventBus');
  if (eb && eb.emit) eb.emit(SIDEBAR_EVENTS.SUBMENU_TOGGLED, { itemId: itemElement.dataset.itemId, isOpen });
  return isOpen;
}

export function openSubmenu(itemElement: HTMLElement) { if (!itemElement?.classList.contains(C.ITEM_HAS_SUBMENU)) return false; _metrics.opens++; itemElement.classList.add(C.ITEM_SUBMENU_OPEN); return true; }
export function closeSubmenu(itemElement: HTMLElement) { if (!itemElement?.classList.contains(C.ITEM_HAS_SUBMENU)) return false; _metrics.closes++; itemElement.classList.remove(C.ITEM_SUBMENU_OPEN); return true; }
export function closeAllSubmenus(container: HTMLElement) { if (!container) return; container.querySelectorAll(`.${C.ITEM_SUBMENU_OPEN}`).forEach((item: DynObj) => { item.classList.remove(C.ITEM_SUBMENU_OPEN); }); }

export function setupSubmenuHandlers(container: HTMLElement) {
  if (!container) return () => {};
  const handler = (e: DynObj) => { const item = (e.target as DynObj).closest(`.${C.ITEM_HAS_SUBMENU}`); if (!item) return; const link = (e.target as DynObj).closest(`.${C.LINK}`); if (link) { e.preventDefault(); toggleSubmenu(item); } };
  container.addEventListener('click', handler);
  const cleanup = () => { container.removeEventListener('click', handler); };
  _cleanups.push(cleanup);
  return cleanup;
}

export function destroy() { _cleanups.forEach(fn => { try { fn(); } catch(e) { } }); _cleanups = []; }
export function getMetrics() { return { ..._metrics }; }
export function info() { return { moduleId: MODULE_ID, version: VERSION, portsInitialized: Ports.isInitialized(), metrics: getMetrics() }; }
export function healthCheck() { return { status: Ports.isInitialized() ? 'HEALTHY' : 'DEGRADED', version: VERSION, moduleId: MODULE_ID, portsInitialized: Ports.isInitialized(), checks: {}, metrics: getMetrics() }; }

export default { init, createSubmenu, addSubmenuToItem, toggleSubmenu, openSubmenu, closeSubmenu, closeAllSubmenus, setupSubmenuHandlers, destroy, injectPorts, getPorts, getMetrics, info, healthCheck, VERSION, MODULE_ID };
