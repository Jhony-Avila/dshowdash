// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.3.0-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: footer-buttons-registry
// PURPOSE: Footer Buttons Registry
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createLogger from ../../core/logger.js
//
// PROVIDES:
//   loadComponent() — exported function
//   mountComponent() — exported function
//   unmountComponent() — exported function
//   getAvailableIds() — exported function
//   getDecorativeIds() — exported function
//   getControlIds() — exported function
//   getLinkIds() — exported function
//   hasComponent() — exported function
//   getMetrics() — exported function
//   info() — exported function
//   healthCheck() — exported function
//   MODULE_ID — module constant
//   VERSION — module constant
//
// RECEIVES (via init/options): (none)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createLogger } from '../../core/logger.js';

const VERSION = '1.3.0-ENTERPRISE';
const MODULE_ID = 'footer-buttons-registry';

const _log = createLogger(MODULE_ID);

const COMPONENT_MAP = {
  'dashboard': () => import('./dashboard/index.js'),
  'analytics': () => import('./analytics/index.js'),
  'pie-chart': () => import('./pie-chart/index.js'),
  'trending-up': () => import('./trending-up/index.js'),
  'users': () => import('./users/index.js'),
  'settings': () => import('./settings/index.js'),
  'database': () => import('./database/index.js'),
  'server': () => import('./server/index.js'),
  'cloud': () => import('./cloud/index.js'),
  'zap': () => import('./zap/index.js'),
  'calendar': () => import('./calendar/index.js'),
  'mail': () => import('./mail/index.js'),
  'bell': () => import('./bell/index.js'),
  'folder': () => import('./folder/index.js'),
  'credit-card': () => import('./credit-card/index.js'),
  'security': () => import('./security/index.js'),
  'search': () => import('./search/index.js'),
  'activity': () => import('./activity/index.js'),
  'globe': () => import('./globe/index.js'),
  'lock': () => import('./lock/index.js'),
  'link': () => import('./link/index.js'),
  'cpu': () => import('./cpu/index.js'),
  'hard-drive': () => import('./hard-drive/index.js'),
  'monitor': () => import('./monitor/index.js'),
  'clipboard': () => import('./clipboard/index.js'),
  'target': () => import('./target/index.js'),
  'bookmark': () => import('./bookmark/index.js'),
  'language': () => import('./language/index.js'),
  'logout': () => import('./logout/index.js'),
  'termos': () => import('./termos/index.js'),
  'privacidade': () => import('./privacidade/index.js'),
  'lgpd': () => import('./lgpd/index.js')
};

const _loadedComponents = new Map();
let _metrics = { loads: 0, mounts: 0, unmounts: 0, errors: 0 };

export async function loadComponent(id: string) {
  if (_loadedComponents.has(id)) return _loadedComponents.get(id);
  const loader = (COMPONENT_MAP as Record<string,unknown>)[id as string];
  if (!loader) { _log.warn(`Component not found: ${id}`); return null; }
  try {
    _metrics.loads++;
    // @ts-expect-error TS migration - TS2349
    const module = await loader();
    _loadedComponents.set(id, module);
    return module;
  } catch (err) { _metrics.errors++; _log.error(`Failed to load: ${id}`, err); return null; }
}

export async function mountComponent(id: string, hostEl: HTMLElement, props = {}) {
  const module = await loadComponent(id);
  if (!module) return null;
  _metrics.mounts++;
  if (typeof module.mount === 'function') return module.mount(hostEl, props);
  if (typeof module.getInstance === 'function') {
    const instance = module.getInstance();
    if (typeof instance.mount === 'function') return instance.mount(hostEl, props);
  }
  return null;
}

export async function unmountComponent(id: string) {
  const module = _loadedComponents.get(id);
  if (!module) return false;
  _metrics.unmounts++;
  if (typeof module.unmount === 'function') { module.unmount(); return true; }
  if (typeof module.getInstance === 'function') {
    const instance = module.getInstance();
    if (typeof instance.unmount === 'function') { instance.unmount(); return true; }
  }
  return false;
}

export function getAvailableIds() { return Object.keys(COMPONENT_MAP); }
export function getDecorativeIds() { return ['dashboard', 'analytics', 'pie-chart', 'trending-up', 'users', 'settings', 'database', 'server', 'cloud', 'zap', 'calendar', 'mail', 'bell', 'folder', 'credit-card', 'security', 'search', 'activity', 'globe', 'lock', 'link', 'cpu', 'hard-drive', 'monitor', 'clipboard', 'target', 'bookmark']; }
export function getControlIds() { return ['language', 'logout']; }
export function getLinkIds() { return ['termos', 'privacidade', 'lgpd']; }
export function hasComponent(id: string) { return COMPONENT_MAP.hasOwnProperty(id); }

export function getMetrics() { return { ..._metrics, loaded: _loadedComponents.size }; }
export function info() {
  return { version: VERSION, moduleId: MODULE_ID, availableComponents: getAvailableIds(), decorativeCount: getDecorativeIds().length, controlCount: getControlIds().length, linkCount: getLinkIds().length, totalCount: Object.keys(COMPONENT_MAP).length, loadedComponents: Array.from(_loadedComponents.keys()), metrics: getMetrics() };
}
export function healthCheck() {
  return { status: 'HEALTHY', version: VERSION, moduleId: MODULE_ID, checks: { registryLoaded: Object.keys(COMPONENT_MAP).length > 0 }, metrics: getMetrics() };
}

export { MODULE_ID, VERSION };
export default { loadComponent, mountComponent, unmountComponent, getAvailableIds, getDecorativeIds, getControlIds, getLinkIds, hasComponent, getMetrics, info, healthCheck, VERSION, MODULE_ID };
