// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.6.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: core.js.AssetLoader
// PURPOSE: Asset Loader Compatibility Wrapper
// ───────────────────────────────────────────────────────────────
// IMPORTS: createCorePorts, asset-loader/index
// PROVIDES: Fallback loader if modular fails
// @changelog v1.6.0-P2-ENTERPRISE: Standardized DEPENDENCY CONTRACT
// @changelog v1.5.0-PORTSFACTORY - Migração para PortsFactory
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createCorePorts } from '/core/runtime/ports-profiles.js';

export const MODULE_ID = 'core.js.AssetLoader';
export const VERSION = '1.6.0-P2-ENTERPRISE';

interface PortLogger {
  error?: (prefix: string, ...args: unknown[]) => void;
  warn?: (prefix: string, ...args: unknown[]) => void;
  debug?: (prefix: string, ...args: unknown[]) => void;
}

interface PortConfig {
  app?: { debug?: boolean };
}

interface RegistryEntry {
  type: string;
  loadedAt: number;
}

interface LoadResult {
  success: boolean;
  cached?: boolean;
  url?: string;
}

interface FallbackAssetLoader {
  _registry: Map<string, RegistryEntry>;
  _initialized: boolean;
  init(): FallbackAssetLoader;
  loadCSS(path: string): Promise<LoadResult>;
  loadScript(path: string): Promise<LoadResult>;
  hasLoaded(path: string): boolean;
  getRegistry(): Record<string, RegistryEntry>;
  getVersion(): string;
  healthCheck(): { status: string; fallback: boolean };
  info(): { version: string; fallback: boolean };
}

const _Ports = createCorePorts({ moduleId: MODULE_ID });
function _getPort(name: string): unknown { return _Ports.get(name); }
export function injectPorts(p: unknown): unknown { return _Ports.inject(p); }
export function getPorts(): unknown { return _Ports.snapshot(); }

const _log = (level: string, ...args: unknown[]): void => { const logger = _getPort('logger') as PortLogger | null; if (!logger) return; if (level === 'error') { logger.error?.(`[${MODULE_ID}]`, ...args); return; } if (level === 'warn') { logger.warn?.(`[${MODULE_ID}]`, ...args); return; } const config = _getPort('config') as PortConfig | null; if (config?.app?.debug) logger.debug?.(`[${MODULE_ID}]`, ...args); };

(async () => {
  if (typeof window !== 'undefined' && ((window as unknown as Record<string, unknown>).AssetLoader)) { _log('info', 'AssetLoader already loaded'); return; }
  try { await import('./asset-loader/index.js'); _log('info', `${VERSION} loaded via dynamic import`); }
  catch (error) {
    _log('error', 'Failed to load modular AssetLoader', error);
    (window as unknown as Record<string, unknown>).AssetLoader = {
      _registry: new Map<string, RegistryEntry>(), _initialized: true,
      init() { return this; },
      async loadCSS(path: string): Promise<LoadResult> { if ((this as FallbackAssetLoader)._registry.has(path)) return { success: true, cached: true }; return new Promise<LoadResult>((resolve) => { const link = document.createElement('link'); link.rel = 'stylesheet'; link.href = path; link.onload = () => { (this as FallbackAssetLoader)._registry.set(path, { type: 'css', loadedAt: Date.now() }); resolve({ success: true, url: path }); }; link.onerror = () => resolve({ success: false, url: path }); document.head.appendChild(link); }); },
      async loadScript(path: string): Promise<LoadResult> { if ((this as FallbackAssetLoader)._registry.has(path)) return { success: true, cached: true }; return new Promise<LoadResult>((resolve) => { const script = document.createElement('script'); script.src = path; script.onload = () => { (this as FallbackAssetLoader)._registry.set(path, { type: 'js', loadedAt: Date.now() }); resolve({ success: true, url: path }); }; script.onerror = () => resolve({ success: false, url: path }); document.head.appendChild(script); }); },
      hasLoaded(path: string): boolean { return (this as FallbackAssetLoader)._registry.has(path); },
      getRegistry(): Record<string, RegistryEntry> { return Object.fromEntries((this as FallbackAssetLoader)._registry); },
      getVersion(): string { return VERSION; },
      healthCheck(): { status: string; fallback: boolean } { return { status: 'DEGRADED', fallback: true }; },
      info(): { version: string; fallback: boolean } { return { version: VERSION, fallback: true }; }
    } satisfies FallbackAssetLoader;
    _log('warn', 'Using fallback AssetLoader');
  }
})();

export function info(): { moduleId: string; version: string; portsInitialized: boolean } { return { moduleId: MODULE_ID, version: VERSION, portsInitialized: _Ports.isInitialized() }; }
export function healthCheck(): { status: string; moduleId: string; version: string; portsInitialized: boolean } { return { status: _Ports.isInitialized() ? 'HEALTHY' : 'DEGRADED', moduleId: MODULE_ID, version: VERSION, portsInitialized: _Ports.isInitialized() }; }
