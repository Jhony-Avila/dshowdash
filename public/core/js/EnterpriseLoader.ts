// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (5.6.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: core.js.EnterpriseLoader
// PURPOSE: Enterprise Loader Compatibility Wrapper
// ───────────────────────────────────────────────────────────────
// IMPORTS: createCorePorts, enterprise-loader/index
// PROVIDES: Fallback loader if modular fails
// @changelog v5.6.0-P2-ENTERPRISE: Standardized DEPENDENCY CONTRACT
// @changelog v5.5.0-PORTSFACTORY - Migração para PortsFactory
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createCorePorts } from '/core/runtime/ports-profiles.js';

export const MODULE_ID = 'core.js.EnterpriseLoader';
export const VERSION = '5.6.0-P2-ENTERPRISE';

interface PortLogger {
  error?: (prefix: string, ...args: unknown[]) => void;
  warn?: (prefix: string, ...args: unknown[]) => void;
  debug?: (prefix: string, ...args: unknown[]) => void;
}

interface PortConfig {
  app?: { debug?: boolean };
}

interface FallbackEnterpriseLoader {
  _initialized: boolean;
  _components: Record<string, unknown>;
  getVersion(): string;
  getModuleId(): string;
  isInitialized(): boolean;
  load(): Promise<{ success: boolean; loaded: unknown[]; failed: unknown[]; loadTime: number }>;
  init(options?: unknown): Promise<Record<string, unknown>>;
  loadAll(options?: unknown): Promise<Record<string, unknown>>;
  getComponent(name: string): unknown;
  getComponents(): Record<string, unknown>;
  getExternalLoaders(): { loaders: Record<string, unknown>; summary: { total: number; available: number; ready: number; availablePercent: number; readyPercent: number }; timestamp: number };
  getStatus(): Record<string, unknown>;
  healthCheck(): Record<string, unknown>;
  info(): Record<string, unknown>;
  shutdown(): void;
  reset(): void;
  debug: {
    getRegistry: () => unknown[];
    getComponents: () => Record<string, unknown>;
    getMetrics: () => Record<string, unknown>;
    getStageResults: () => Record<string, unknown>;
    getFailed: () => unknown[];
    getExternalLoaders: () => Record<string, unknown>;
  };
}

interface DevEnterpriseLoader {
  getVersion: () => string;
  info: () => Record<string, unknown>;
  healthCheck: () => Record<string, unknown>;
  getStatus: () => Record<string, unknown>;
  getExternalLoaders: () => Record<string, unknown>;
  debug: FallbackEnterpriseLoader['debug'];
  reset: () => void;
}

const _Ports = createCorePorts({ moduleId: MODULE_ID });
function _getPort(name: string): unknown { return _Ports.get(name); }
export function injectPorts(p: unknown): unknown { return _Ports.inject(p); }
export function getPorts(): unknown { return _Ports.snapshot(); }

const _log = (level: string, ...args: unknown[]): void => { const logger = _getPort('logger') as PortLogger | null; if (!logger) return; if (level === 'error') { logger.error?.(`[${MODULE_ID}]`, ...args); return; } if (level === 'warn') { logger.warn?.(`[${MODULE_ID}]`, ...args); return; } const config = _getPort('config') as PortConfig | null; if (config?.app?.debug) logger.debug?.(`[${MODULE_ID}]`, ...args); };

(async () => {
  if (typeof window !== 'undefined' && ((window as unknown as Record<string, unknown>).EnterpriseLoader)) { _log('info', 'EnterpriseLoader already loaded, skipping'); return; }
  try { await import('./enterprise-loader/index.js'); _log('info', `${VERSION} loaded via dynamic import`); }
  catch (error) {
    _log('error', 'Failed to load modular EnterpriseLoader, using fallback', error);
    const fallback: FallbackEnterpriseLoader = {
      _initialized: false, _components: {},
      getVersion() { return VERSION; }, getModuleId() { return MODULE_ID; }, isInitialized() { return this._initialized; },
      async load() { _log('warn', 'Fallback loader - no components loaded'); return { success: false, loaded: [], failed: [], loadTime: 0 }; },
      async init() { this._initialized = true; return this.getStatus(); },
      async loadAll(options?: unknown) { return this.init(options); },
      getComponent(name: string) { return this._components[name] || null; },
      getComponents() { return { ...this._components }; },
      getExternalLoaders() { return { loaders: {}, summary: { total: 0, available: 0, ready: 0, availablePercent: 0, readyPercent: 0 }, timestamp: Date.now() }; },
      getStatus() { return { moduleId: MODULE_ID, version: VERSION, initialized: this._initialized, fallback: true, components: { total: 0, loaded: 0, initialized: 0, failed: 0 }, timestamp: Date.now() }; },
      healthCheck() { return { status: 'DEGRADED', score: 0, maxScore: 10, scoreDisplay: '0/10', issues: ['fallback-mode'], fallback: true, version: VERSION, timestamp: Date.now() }; },
      info() { return { ...this.getStatus(), healthCheck: this.healthCheck() }; },
      shutdown() { _log('info', 'Fallback shutdown'); },
      reset() { this._initialized = false; this._components = {}; },
      debug: { getRegistry: () => [], getComponents: () => ({}), getMetrics: () => ({}), getStageResults: () => ({}), getFailed: () => [], getExternalLoaders: () => ({}) }
    };
    (window as unknown as Record<string, unknown>).EnterpriseLoader = fallback;
    const win = window as unknown as Record<string, Record<string, unknown>>;
    win.__dev = win.__dev || {};
    win.__dev.enterpriseLoader = {
      getVersion: () => VERSION,
      info: () => ((window as unknown as Record<string, unknown>).EnterpriseLoader as FallbackEnterpriseLoader).info(),
      healthCheck: () => ((window as unknown as Record<string, unknown>).EnterpriseLoader as FallbackEnterpriseLoader).healthCheck(),
      getStatus: () => ((window as unknown as Record<string, unknown>).EnterpriseLoader as FallbackEnterpriseLoader).getStatus(),
      getExternalLoaders: () => ((window as unknown as Record<string, unknown>).EnterpriseLoader as FallbackEnterpriseLoader).getExternalLoaders(),
      debug: ((window as unknown as Record<string, unknown>).EnterpriseLoader as FallbackEnterpriseLoader).debug,
      reset: () => ((window as unknown as Record<string, unknown>).EnterpriseLoader as FallbackEnterpriseLoader).reset()
    } satisfies DevEnterpriseLoader;
    _log('warn', 'Using fallback EnterpriseLoader');
  }
})();

export function info(): { moduleId: string; version: string; portsInitialized: boolean } { return { moduleId: MODULE_ID, version: VERSION, portsInitialized: _Ports.isInitialized() }; }
export function healthCheck(): { status: string; moduleId: string; version: string; portsInitialized: boolean } { return { status: _Ports.isInitialized() ? 'HEALTHY' : 'DEGRADED', moduleId: MODULE_ID, version: VERSION, portsInitialized: _Ports.isInitialized() }; }
