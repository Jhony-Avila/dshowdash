// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (5.3.1-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: context-lifecycle
// PURPOSE: core   lifecycle
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createCorePorts from /core/runtime/ports-profiles.js
//   ContextRegistry, CORE_CONTEXTS from ./registry.js
//   ContextProviderCore from ./provider.js
//   contextStore from ../state/store.js
//   trackContextEvent, resetMetrics as resetTrackerMetrics from ../telemetry/tracker.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   injectPorts() — exported function
//   getPorts() — exported function
//   getVersion() — exported function
//   ContextLifecycle — exported value
//   defaultContexts — exported value
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
// Context Provider Lifecycle v5.3.1-ENTERPRISE
// @version 5.3.1-ENTERPRISE-ES6
// @changelog v5.3.1-ENTERPRISE - ES5 conversion (Object.values → for loop in healthCheck)
// P17WI: Ports via PortsFactory/PortsProfiles

import { createCorePorts } from '/core/runtime/ports-profiles.js';
import { ContextRegistry, CORE_CONTEXTS } from './registry.js';
import { ContextProviderCore } from './provider.js';
import { contextStore } from '../state/store.js';
import { trackContextEvent, resetMetrics as resetTrackerMetrics } from '../telemetry/tracker.js';

export const VERSION = '5.3.1-ENTERPRISE';
export const MODULE_ID = 'context-lifecycle';

const Ports = createCorePorts({ moduleId: MODULE_ID });

function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }

export function injectPorts(p: Record<string, unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

export function getVersion() { return VERSION; }

const _debug = () => { const cfg = _getPort('config'); return cfg && cfg.app && cfg.app.debug ? true : false; };
const _log = function(level: string, ...args: any[]) { const logger = _getPort('logger'); if (!logger) return; const prefix = `[${MODULE_ID}]`; if (level === 'error') { if (logger.error) logger.error(...[prefix].concat(args)); return; } if (level === 'warn') { if (logger.warn) logger.warn(...[prefix].concat(args)); return; } if (_debug() && logger.debug) logger.debug(...[prefix].concat(args)); };

let initialized = false;
let hydrated = false;
let _metrics: { initCount: number; hydrateCount: number; resetCount: number; resetPartialCount: number; cleanupCount: number; lastInitAt: number | null; lastHydrateAt: number | null; lastResetAt: number | null; lastCleanupAt: number | null } = { initCount: 0, hydrateCount: 0, resetCount: 0, resetPartialCount: 0, cleanupCount: 0, lastInitAt: null, lastHydrateAt: null, lastResetAt: null, lastCleanupAt: null };

const defaultContexts = Object.freeze([
  { name: CORE_CONTEXTS.SESSION, defaultValue: { authenticated: false, user: null, token: null }, owner: 'SessionManager', type: 'core', lifetime: 'session', description: 'Dados de autenticacao do usuario' },
  { name: CORE_CONTEXTS.ENVIRONMENT, defaultValue: { mode: 'production', endpoints: {} }, owner: 'EnvironmentManager', type: 'core', lifetime: 'app', description: 'Configuracoes de ambiente' },
  { name: CORE_CONTEXTS.THEME, defaultValue: { active: 'light', tokens: {} }, owner: 'ThemeManager', type: 'core', lifetime: 'app', description: 'Tema ativo e tokens de design' },
  { name: CORE_CONTEXTS.LAYOUT, defaultValue: { mode: 'default', breakpoint: 'desktop', compact: false }, owner: 'LayoutManager', type: 'core', lifetime: 'app', description: 'Estado do layout' },
  { name: CORE_CONTEXTS.LOCALE, defaultValue: { language: 'pt-BR', fallback: 'en-US' }, owner: 'LocaleManager', type: 'core', lifetime: 'app', description: 'Configuracoes de idioma' },
  { name: CORE_CONTEXTS.ACCESSIBILITY, defaultValue: { reducedMotion: false, highContrast: false }, owner: 'AccessibilityManager', type: 'core', lifetime: 'app', description: 'Preferencias de acessibilidade' },
  { name: CORE_CONTEXTS.PERMISSIONS, defaultValue: { roles: [], capabilities: [] }, owner: 'PermissionsGuard', type: 'core', lifetime: 'session', description: 'Roles e capabilities' },
  { name: CORE_CONTEXTS.CONNECTIVITY, defaultValue: { online: true, slow: false }, owner: 'ConnectivityMonitor', type: 'core', lifetime: 'app', description: 'Status de conectividade' },
  { name: CORE_CONTEXTS.VERSION, defaultValue: { app: '4.0.0', swUpdated: false }, owner: 'VersionManager', type: 'core', lifetime: 'app', description: 'Versao da aplicacao' },
  { name: CORE_CONTEXTS.GLOBAL_STATE, defaultValue: null, owner: 'GlobalState', type: 'core', lifetime: 'session', description: 'Snapshot mapeado do GlobalState' },
  { name: CORE_CONTEXTS.UI_MODAL, defaultValue: { stack: [], hasBlocking: false, activeCount: 0 }, owner: 'ModalManager', type: 'ui', lifetime: 'app', description: 'Estado centralizado de modais' },
  { name: CORE_CONTEXTS.UI_OVERLAY, defaultValue: { stack: [], hasBlocking: false, activeCount: 0 }, owner: 'OverlayLayer', type: 'ui', lifetime: 'app', description: 'Estado centralizado de overlays' }
]);

const ContextLifecycle = {
  setDebug(debug: boolean) { if (ContextRegistry.setDebug) ContextRegistry.setDebug(debug); if (ContextProviderCore.setDebug) ContextProviderCore.setDebug(debug); if (contextStore.setDebug) contextStore.setDebug(debug); },
  init(options: Record<string, unknown>) {
    if (!options) options = {};
    if (initialized) { _log('warn', 'Already initialized'); try { trackContextEvent('context:lifecycle:init:skipped', { reason: 'already-initialized' }); } catch (e) {} return Promise.resolve(false); }
    _initPorts();
    try { trackContextEvent('context:lifecycle:init:start'); } catch (e) {}
    try {
      defaultContexts.forEach((ctx: { name: string; schema?: unknown; owner?: string; type?: string; lifetime?: string; description?: string; defaultValue?: unknown }) => { if (!ContextRegistry.has(ctx.name)) { ContextRegistry.register(ctx.name, ctx.schema || null, { owner: ctx.owner || 'unknown', type: ctx.type || 'core', lifetime: ctx.lifetime || 'app', description: ctx.description || '' }); if (ctx.defaultValue !== undefined) contextStore.set(ctx.name, ctx.defaultValue); } });
      if (options.contexts && Array.isArray(options.contexts)) { options.contexts.forEach((ctx: { name: string; schema?: unknown; owner?: string; type?: string; lifetime?: string; description?: string; defaultValue?: unknown }) => { if (!ContextRegistry.has(ctx.name)) { ContextRegistry.register(ctx.name, ctx.schema || null, { owner: ctx.owner || 'unknown', type: ctx.type || 'custom', lifetime: ctx.lifetime || 'app', description: ctx.description || '' }); if (ctx.defaultValue !== undefined) contextStore.set(ctx.name, ctx.defaultValue); } }); }
      initialized = true; _metrics.initCount++; _metrics.lastInitAt = Date.now();
      const totalContexts = ContextRegistry.count(); const uiContexts = ContextRegistry.listUIContexts ? ContextRegistry.listUIContexts().length : 0;
      _log('info', 'Lifecycle initialized with', totalContexts, 'contexts (', uiContexts, 'UI)');
      try { trackContextEvent('context:lifecycle:init:complete', { coreContexts: defaultContexts.length, uiContexts, customContexts: options.contexts ? (options.contexts as unknown[]).length : 0, totalContexts, initCount: _metrics.initCount }); } catch (e) {}
      return Promise.resolve(true);
    } catch (error: any) { _log('error', 'Init failed:', error.message); try { trackContextEvent('context:lifecycle:init:error', { error: error.message }); } catch (e) {} return Promise.resolve(false); }
  },
  hydrate(data: Record<string, unknown>) {
    if (!data) data = {};
    if (!initialized) { _log('warn', 'Must initialize before hydrating'); return Promise.resolve(false); }
    if (hydrated) { _log('warn', 'Already hydrated'); return Promise.resolve(false); }
    try { trackContextEvent('context:lifecycle:hydrate:start'); } catch (e) {}
    try {
      let hydratedCount = 0;
      Object.keys(data).forEach(key => { if (ContextRegistry.has(key)) { ContextProviderCore.set(key, data[key], false, { owner: 'ContextLifecycle' }); hydratedCount++; } else { _log('warn', `Unknown context "${key}" during hydration`); } });
      hydrated = true; _metrics.hydrateCount++; _metrics.lastHydrateAt = Date.now();
      _log('info', 'Hydrated', hydratedCount, 'contexts');
      try { trackContextEvent('context:lifecycle:hydrate:complete', { keysHydrated: hydratedCount }); } catch (e) {}
      return Promise.resolve(true);
    } catch (error: any) { _log('error', 'Hydration failed:', error.message); try { trackContextEvent('context:lifecycle:hydrate:error', { error: error.message }); } catch (e) {} return Promise.resolve(false); }
  },
  reset(options: Record<string, unknown>) {
    if (!options) options = {};
    try { trackContextEvent('context:lifecycle:reset:start', { keepCore: options.keepCore || false }); } catch (e) {}
    try {
      if (options.keepCore) { const clearedCount = ContextRegistry.clearCustomOnly(); ContextProviderCore.clearAllSubscribers(); ContextProviderCore.resetMetrics(); defaultContexts.forEach(ctx => { if (ctx.defaultValue !== undefined) contextStore.set(ctx.name, ctx.defaultValue); }); _metrics.resetPartialCount++; _metrics.lastResetAt = Date.now(); _log('info', 'Lifecycle partial reset complete (kept core)', { clearedCustom: clearedCount }); try { trackContextEvent('context:lifecycle:reset:complete', { mode: 'custom-only', resetPartialCount: _metrics.resetPartialCount, clearedCustom: clearedCount }); } catch (e) {} return true; }
      ContextProviderCore.clearAllSubscribers(); ContextProviderCore.resetMetrics(); contextStore.clear(); ContextRegistry.clear(); try { resetTrackerMetrics(); } catch (e) {}
      initialized = false; hydrated = false; _metrics.resetCount++; _metrics.lastResetAt = Date.now();
      _log('info', 'Lifecycle reset complete');
      try { trackContextEvent('context:lifecycle:reset:complete', { mode: 'full', resetCount: _metrics.resetCount }); } catch (e) {}
      return true;
    } catch (error: any) { _log('error', 'Reset failed:', error.message); return false; }
  },
  cleanup() { try { trackContextEvent('context:lifecycle:cleanup:start'); } catch (e) {} try { ContextProviderCore.clearAllSubscribers(); _metrics.cleanupCount++; _metrics.lastCleanupAt = Date.now(); _log('info', 'Lifecycle cleanup complete'); try { trackContextEvent('context:lifecycle:cleanup:complete', { cleanupCount: _metrics.cleanupCount }); } catch (e) {} return true; } catch (error: any) { _log('error', 'Cleanup failed:', error.message); return false; } },
  isInitialized() { return initialized; },
  isHydrated() { return hydrated; },
  healthCheck() { const portsSnapshot = Ports.snapshot(); const uiContextsCount = ContextRegistry.listUIContexts ? ContextRegistry.listUIContexts().length : 0; const checks = { initialized, registryAvailable: typeof ContextRegistry.has === 'function', providerAvailable: typeof ContextProviderCore.set === 'function', storeAvailable: typeof contextStore.get === 'function', hasContexts: ContextRegistry.count() > 0, hasCoreContexts: ContextRegistry.listByType('core').length > 0, hasUIContexts: uiContextsCount > 0, loggerAvailable: !!_getPort('logger'), portsInitialized: portsSnapshot._initialized }; const checkKeys = Object.keys(checks); let passed = 0; for (let i = 0; i < checkKeys.length; i++) { if ((checks as Record<string, boolean>)[checkKeys[i]]) passed++; } const total = checkKeys.length; let status = 'HEALTHY'; if (passed < total * 0.5) status = 'UNHEALTHY'; else if (passed < total) status = 'DEGRADED'; const issues: string[] = []; if (!checks.initialized) issues.push('Not initialized'); if (!checks.registryAvailable) issues.push('Registry not available'); if (!checks.providerAvailable) issues.push('Provider not available'); if (!checks.storeAvailable) issues.push('Store not available'); if (!checks.hasContexts) issues.push('No contexts registered'); if (!checks.hasCoreContexts) issues.push('No core contexts registered'); if (!checks.hasUIContexts) issues.push('No UI contexts registered'); return { status, score: `${passed}/${total}`, healthy: passed >= 6, checks, issues: issues.length > 0 ? issues : null, version: VERSION, moduleId: MODULE_ID, portsInitialized: portsSnapshot._initialized, timestamp: Date.now() }; },
  getStatus() { const portsSnapshot = Ports.snapshot(); return { version: VERSION, moduleId: MODULE_ID, initialized, hydrated, contextsCount: ContextRegistry.count(), contexts: ContextRegistry.list(), metrics: Object.assign({}, _metrics), portsInitialized: portsSnapshot._initialized }; },
  info() { const portsSnapshot = Ports.snapshot(); const uiContextsCount = ContextRegistry.listUIContexts ? ContextRegistry.listUIContexts().length : 0; return { version: VERSION, moduleId: MODULE_ID, initialized, hydrated, contextsCount: ContextRegistry.count(), coreContextsCount: ContextRegistry.listByType('core').length, uiContextsCount, customContextsCount: ContextRegistry.listByType('custom').length, metrics: Object.assign({}, _metrics), portsInitialized: portsSnapshot._initialized, healthCheck: this.healthCheck(), defaultContextsCount: defaultContexts.length, defaultContextNames: defaultContexts.map(c => c.name), timestamp: Date.now() }; },
  resetMetrics() { _metrics = { initCount: 0, hydrateCount: 0, resetCount: 0, resetPartialCount: 0, cleanupCount: 0, lastInitAt: null, lastHydrateAt: null, lastResetAt: null, lastCleanupAt: null }; },
  getVersion() { return VERSION; }
};

export { ContextLifecycle, defaultContexts };
export default ContextLifecycle;
