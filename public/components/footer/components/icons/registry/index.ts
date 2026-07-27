// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (2.1.0-P17WI)
// ═══════════════════════════════════════════════════════════════
// MODULE: footer-icons-registry
// PURPOSE: Footer Icons Registry
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createCorePorts from /core/runtime/ports-profiles.js
//
// PROVIDES:
//   injectPorts() — exported function
//   getPorts() — exported function
//   FooterIconsRegistry — exported value
//   MODULE_ID — module constant
//   VERSION — module constant
//
// RECEIVES (via init/options): (none)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   window.FooterIconsRegistry
//   window.__dev
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createCorePorts } from '/core/runtime/ports-profiles.js';

const MODULE_ID = 'footer-icons-registry';
const VERSION = '2.1.0-P17WI';

const Ports = createCorePorts({ moduleId: MODULE_ID });
function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
export function injectPorts(p: Record<string,unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

const _debugEnabled = () => { const cfg = _getPort('config'); return (cfg && cfg.app && cfg.app.debug) ? true : false; };
const _log = function(l: string, ...a: any[]) { const logger = _getPort('logger'); if (!logger) return; if (l === 'error') { if (logger.error) logger.error(`[${MODULE_ID}]`, a.join(' ')); return; } if (l === 'warn') { if (logger.warn) logger.warn(`[${MODULE_ID}]`, a.join(' ')); return; } if (_debugEnabled() && logger.debug) logger.debug(`[${MODULE_ID}]`, a.join(' ')); };

const ICON_FACTORIES = {
  // Original 24 icons (wifi removed)
  'clock': function() { return import('../clock/index.js'); },
  'cpu': function() { return import('../cpu/index.js'); },
  'disk': function() { return import('../disk/index.js'); },
  'memory': function() { return import('../memory/index.js'); },
  'activity': function() { return import('../activity/index.js'); },
  'globe': function() { return import('../globe/index.js'); },
  'map-pin': function() { return import('../map-pin/index.js'); },
  'settings': function() { return import('../settings/index.js'); },
  'copyright': function() { return import('../copyright/index.js'); },
  'server': function() { return import('../server/index.js'); },
  'file': function() { return import('../file/index.js'); },
  'shield': function() { return import('../shield/index.js'); },
  'check': function() { return import('../check/index.js'); },
  'logo': function() { return import('../logo/index.js'); },
  'docs': function() { return import('../docs/index.js'); },
  'support': function() { return import('../support/index.js'); },
  'status': function() { return import('../status/index.js'); },
  'database': function() { return import('../database/index.js'); },
  'api': function() { return import('../api/index.js'); },
  'pipedrive': function() { return import('../pipedrive/index.js'); },
  'financial': function() { return import('../financial/index.js'); },
  'status-mode': function() { return import('../status-mode/index.js'); },
  'device-mic': function() { return import('../device-mic/index.js'); },
  'device-webcam': function() { return import('../device-webcam/index.js'); },
  // LOTE 1 - 7 icons
  'zap': function() { return import('../zap/index.js'); },
  'users': function() { return import('../users/index.js'); },
  'user': function() { return import('../user/index.js'); },
  'unlock': function() { return import('../unlock/index.js'); },
  'trending-up': function() { return import('../trending-up/index.js'); },
  'terminal': function() { return import('../terminal/index.js'); },
  'target': function() { return import('../target/index.js'); },
  // LOTE 2 - 7 icons
  'sun': function() { return import('../sun/index.js'); },
  'search': function() { return import('../search/index.js'); },
  'pie-chart': function() { return import('../pie-chart/index.js'); },
  'lock': function() { return import('../lock/index.js'); },
  'link': function() { return import('../link/index.js'); },
  'layers': function() { return import('../layers/index.js'); },
  'inbox': function() { return import('../inbox/index.js'); },
  // LOTE 3A - 7 icons
  'at-sign': function() { return import('../at-sign/index.js'); },
  'bar-chart': function() { return import('../bar-chart/index.js'); },
  'box': function() { return import('../box/index.js'); },
  'briefcase': function() { return import('../briefcase/index.js'); },
  'calendar': function() { return import('../calendar/index.js'); },
  'cloud': function() { return import('../cloud/index.js'); },
  'copy': function() { return import('../copy/index.js'); },
  // LOTE 3B - 6 icons
  'credit-card': function() { return import('../credit-card/index.js'); },
  'dollar-sign': function() { return import('../dollar-sign/index.js'); },
  'eye': function() { return import('../eye/index.js'); },
  'file-text': function() { return import('../file-text/index.js'); },
  'grid': function() { return import('../grid/index.js'); },
  'hard-drive': function() { return import('../hard-drive/index.js'); }
};

const TOTAL_ICONS = 51;

const _instances = new Map();
const _metrics = { renderCount: 0, cacheHits: 0, cacheMisses: 0, errors: 0 };

const FooterIconsRegistry = {
  getVersion() { return VERSION; },
  getModuleId() { return MODULE_ID; },
  hasIcon(id: string) { return ICON_FACTORIES.hasOwnProperty(id); },
  getAvailableIcons() { return Object.keys(ICON_FACTORIES); },
  getIcon(id: string) {
    const self = this;
    if (!this.hasIcon(id)) { _log('warn', `Icon "${id}" not registered`); return Promise.resolve(null); }
    if (_instances.has(id)) { _metrics.cacheHits++; return Promise.resolve(_instances.get(id)); }
    _metrics.cacheMisses++;
    // @ts-expect-error TS migration - TS2349, TS2339
    return (ICON_FACTORIES as Record<string,unknown>)[id as string]().then((m: unknown) => { const i = m.default || m; _instances.set(id, i); return i; }).catch((e: {message?:string}): unknown => { _metrics.errors++; _log('error', `Load "${id}" failed:`, e.message); return null; });
  },
  renderIcon(id: string, container: HTMLElement|null, props: Record<string,unknown>) {
    if (!container) { _log('error', 'renderIcon: container required'); return Promise.resolve(null); }
    return this.getIcon(id).then((icon: string) => {
      if (!icon) { _log('warn', `renderIcon: "${id}" not found`); return null; }
      _metrics.renderCount++;
      // @ts-expect-error TS migration - TS2339
      if (typeof icon.mount === 'function') { icon.mount(container, props || {}); return icon; }
      // @ts-expect-error TS migration - TS2339
      if (typeof icon.render === 'function') { container.innerHTML = icon.render(props || {}); return icon; }
      return null;
    }).catch((e: {message?:string}): unknown => { _metrics.errors++; _log('error', `renderIcon "${id}" failed:`, e.message); return null; });
  },
  unmountIcon(id: string, container: HTMLElement|null) { const icon = _instances.get(id); if (icon && typeof icon.unmount === 'function') { try { icon.unmount(); } catch (e) { _log('error', `unmountIcon "${id}" failed`); } } if (container) container.innerHTML = ''; },
  clearCache() { _instances.clear(); _log('info', 'Cache cleared'); },
  getMetrics() { return Object.assign({}, _metrics); },
  healthCheck() {
    const r = Object.keys(ICON_FACTORIES).length;
    const c = _instances.size;
    const checks = { hasRegisteredIcons: r > 0, hasAllIcons: r === TOTAL_ICONS, lowErrorRate: _metrics.renderCount === 0 || (_metrics.errors / _metrics.renderCount) < 0.1, hasLogger: !!_getPort('logger'), portsInitialized: Ports.isInitialized() };
    const p = Object.values(checks).filter(Boolean).length;
    return { status: p >= 4 ? 'HEALTHY' : 'DEGRADED', score: `${p}/5`, checks, registeredIcons: r, expectedIcons: TOTAL_ICONS, cachedIcons: c, metrics: Object.assign({}, _metrics), portsInitialized: Ports.isInitialized(), version: VERSION, moduleId: MODULE_ID, timestamp: Date.now() };
  },
  info() { return { moduleId: MODULE_ID, version: VERSION, portsInitialized: Ports.isInitialized(), registeredIcons: Object.keys(ICON_FACTORIES), totalIcons: Object.keys(ICON_FACTORIES).length, expectedIcons: TOTAL_ICONS, cachedIcons: Array.from(_instances.keys()), metrics: Object.assign({}, _metrics), healthCheck: this.healthCheck(), timestamp: Date.now() }; }
};

if (typeof window !== 'undefined') { (window as any).FooterIconsRegistry = FooterIconsRegistry; (window as any).__dev = (window as any).__dev || {}; (window as any).__dev.footerIconsRegistry = { getVersion() { return VERSION; }, info() { return FooterIconsRegistry.info(); }, healthCheck() { return FooterIconsRegistry.healthCheck(); }, list() { return FooterIconsRegistry.getAvailableIcons(); } }; }

export default FooterIconsRegistry;
export { FooterIconsRegistry, MODULE_ID, VERSION };
