// AssetLoader Helpers - Compatibility Layer
// DEPENDENCY CONTRACT — Core js module
// @version 1.5.0-PORTSFACTORY
// @changelog v1.5.0-PORTSFACTORY - Migração para PortsFactory (elimina window.Logger)
'use strict';

import { createCorePorts } from '/core/runtime/ports-profiles.js';

export const VERSION = '1.5.0-P2-ENTERPRISE';
export const MODULE_ID = 'asset-helpers';

interface CSSLoadResult {
  success?: boolean;
  cached?: boolean;
  url?: string;
}

interface PortLogger {
  warn?: (prefix: string, msg: string) => void;
  error?: (prefix: string, msg: string) => void;
  debug?: (prefix: string, ...args: unknown[]) => void;
}

interface AssetLoaderGlobal {
  loadCSS(path: string): Promise<CSSLoadResult>;
  loadScript?(path: string): Promise<CSSLoadResult>;
  hasLoaded?(path: string): boolean;
  getRegistry?(): Record<string, unknown>;
  getVersion?(): string;
  healthCheck?(): Record<string, unknown>;
  info?(): Record<string, unknown>;
  init?(): unknown;
  _registry?: Map<string, unknown>;
  _initialized?: boolean;
}

interface AssetLoaderHelpersGlobal {
  loadComponentCSS: typeof loadComponentCSS;
  loadPanelCSS: typeof loadPanelCSS;
  loadCardCSS: typeof loadCardCSS;
  loadPageCSS: typeof loadPageCSS;
  createLoadCSS: typeof createLoadCSS;
  info: typeof info;
  healthCheck: typeof healthCheck;
  getVersion: () => string;
}

interface CSSMetrics {
  cssLoaded: number;
  cssErrors: number;
  fallbackUsed: number;
}

const hasWindow: boolean = typeof window !== 'undefined';

const _Ports = createCorePorts({ moduleId: MODULE_ID });
const _getPort = (name: string): unknown => _Ports.get(name);
export const injectPorts = (p: unknown): unknown => _Ports.inject(p);
export const getPorts = (): unknown => _Ports.snapshot();

const _log = (level: string, ...args: string[]): void => {
  const logger = _getPort('logger') as PortLogger | null;
  if (!logger) return;
  if (level === 'warn') logger.warn?.(`[${MODULE_ID}]`, args.join(' '));
  if (level === 'error') logger.error?.(`[${MODULE_ID}]`, args.join(' '));
};

const _metrics: CSSMetrics = { cssLoaded: 0, cssErrors: 0, fallbackUsed: 0 };

const loadCSSFallback = (path: string, linkId: string): Promise<boolean> => {
  if (document.getElementById(linkId) || document.querySelector(`link[href="${path}"]`)) {
    return Promise.resolve(true);
  }
  return new Promise<boolean>((resolve) => {
    try {
      const link = document.createElement('link');
      link.id = linkId;
      link.rel = 'stylesheet';
      link.href = path;
      link.onload = () => { _metrics.cssLoaded++; _metrics.fallbackUsed++; resolve(true); };
      link.onerror = () => { _metrics.cssErrors++; resolve(false); };
      document.head.appendChild(link);
    } catch (error) {
      _metrics.cssErrors++;
      _log('error', 'loadCSSFallback failed:', (error as Error).message);
      resolve(false);
    }
  });
};

export const loadComponentCSS = (componentPath: string, componentId: string): Promise<boolean> => {
  if (!hasWindow) return Promise.resolve(false);
  if (!(window as unknown as Record<string, unknown>).AssetLoader) {
    _log('warn', 'AssetLoader não disponível, usando fallback');
    return loadCSSFallback(componentPath, componentId);
  }
  return Promise.resolve()
    .then(() => ((window as unknown as Record<string, unknown>).AssetLoader as AssetLoaderGlobal).loadCSS(componentPath))
    .then((result: CSSLoadResult | undefined) => { if (result?.success) _metrics.cssLoaded++; return result?.success || false; })
    .catch((error: Error) => { _metrics.cssErrors++; _log('error', 'loadComponentCSS failed:', error.message); return loadCSSFallback(componentPath, componentId); });
};

export const loadPanelCSS = (panelId: string): Promise<boolean> => loadComponentCSS(`/components/panels/${panelId}/styles/index.css`, `${panelId}-styles`);
export const loadCardCSS = (cardId: string): Promise<boolean> => loadComponentCSS(`/components/cards/${cardId}/styles.css`, `${cardId}-styles`);
export const loadPageCSS = (pageId: string): Promise<boolean> => loadComponentCSS(`/components/pages/${pageId}/styles/base.css`, `${pageId}-styles`);

export const createLoadCSS = (componentPath: string, componentId: string): () => Promise<boolean> => {
  let loaded = false;
  return (): Promise<boolean> => {
    if (loaded) return Promise.resolve(true);
    if (hasWindow && (window as unknown as Record<string, unknown>).AssetLoader) {
      return Promise.resolve()
        .then(() => ((window as unknown as Record<string, unknown>).AssetLoader as AssetLoaderGlobal).loadCSS(componentPath))
        .then((result: CSSLoadResult | undefined) => { loaded = !!(result?.success || result?.cached); return loaded; })
        .catch(() => loadCSSFallback(componentPath, componentId).then((result: boolean) => { loaded = result; return loaded; }));
    } else {
      return loadCSSFallback(componentPath, componentId).then((result: boolean) => { loaded = result; return loaded; });
    }
  };
};

export const info = (): { moduleId: string; version: string; metrics: CSSMetrics; portsInitialized: boolean; timestamp: number } => ({ moduleId: MODULE_ID, version: VERSION, metrics: { ..._metrics }, portsInitialized: _Ports.isInitialized(), timestamp: Date.now() });

export const healthCheck = (): { status: string; score: number; maxScore: number; scoreDisplay: string; checks: Record<string, boolean>; moduleId: string; version: string; metrics: CSSMetrics; timestamp: number } => {
  const checks: Record<string, boolean> = { moduleLoaded: true, portsInitialized: _Ports.isInitialized(), lowErrorRate: _metrics.cssErrors < 10 };
  const passed: number = Object.values(checks).filter(Boolean).length;
  const total: number = Object.keys(checks).length;
  return { status: passed === total ? 'HEALTHY' : 'DEGRADED', score: passed, maxScore: total, scoreDisplay: `${passed}/${total}`, checks, moduleId: MODULE_ID, version: VERSION, metrics: { ..._metrics }, timestamp: Date.now() };
};

if (hasWindow) {
  (window as unknown as Record<string, unknown>).AssetLoaderHelpers = { loadComponentCSS, loadPanelCSS, loadCardCSS, loadPageCSS, createLoadCSS, info, healthCheck, getVersion: () => VERSION } satisfies AssetLoaderHelpersGlobal;
}

export default { loadComponentCSS, loadPanelCSS, loadCardCSS, loadPageCSS, createLoadCSS, info, healthCheck, injectPorts, getPorts, VERSION, MODULE_ID };
