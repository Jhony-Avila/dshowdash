// @upgrade v*.*.*-P2-ENTERPRISE: Standardized DEPENDENCY CONTRACT
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v8.3.0-WINDOWADAPTER)
// ═══════════════════════════════════════════════════════════════
// MODULE: enterprise-loader-external-loaders
// DESCRIPTION: Detecção de loaders externos via windowAdapter
// IMPORTS: nenhum (modulo autonomo de detecção)
// EXPORTS: MODULE_ID, VERSION, getExternalLoadersStatus, info, healthCheck
// PROVIDES: nenhum global
// WINDOW ACCESS:
//   - _getGlobal() → windowAdapter com fallback (centralizado)
//   - typeof window check → Guard para SSR/Node safety
// @changelog v8.3.0-WINDOWADAPTER - Migra detecção para windowAdapter
// @changelog v8.2.0-ENTERPRISE - ES6 modernization
// ═══════════════════════════════════════════════════════════════
'use strict';

export const MODULE_ID = 'enterprise-loader-external-loaders';
export const VERSION = '8.3.0-WINDOWADAPTER';

interface ExternalGlobal {
  version?: string;
  getVersion?: () => string | null;
  isReady?: () => boolean;
  getMode?: () => string | null;
  get?: (key: string) => string | null;
  getStatus?: () => { ready?: boolean; phase?: string | null };
  isInitialized?: boolean;
  current?: () => { path?: string | null };
  healthCheck?: () => Record<string, unknown> | null;
  track?: (name: string, data: unknown) => void;
  [key: string]: unknown;
}

interface CoreWindowAdapter {
  get: (name: string) => ExternalGlobal | null;
}

interface LoaderStatus {
  available: boolean;
  version: string | null;
  ready: boolean;
  healthCheck: Record<string, unknown> | null;
  phase?: string | null;
  mode?: string | null;
  environment?: string | null;
  currentRoute?: string | null;
}

interface ExternalLoadersResult {
  loaders: Record<string, LoaderStatus>;
  summary: {
    total: number;
    available: number;
    ready: number;
    availablePercent: number;
    readyPercent: number;
  };
  timestamp: number;
}

// Resolve global via windowAdapter (preferido) ou fallback direto
function _getGlobal(name: string): ExternalGlobal | null {
  if (typeof window === 'undefined') return null;
  if ((window as unknown as { Core?: { windowAdapter?: CoreWindowAdapter } }).Core?.windowAdapter?.get) {
    return (window as unknown as { Core?: { windowAdapter?: CoreWindowAdapter } }).Core!.windowAdapter!.get(name);
  }
  return ((window as unknown as Record<string, unknown>)[name] as ExternalGlobal) || null;
}

export const getExternalLoadersStatus = (): ExternalLoadersResult => {
  const cfg = _getGlobal('Config');
  const pre = _getGlobal('Preloader') || _getGlobal('PreloaderController');
  const env = _getGlobal('Environment');
  const log = _getGlobal('Logger');
  const telCore = _getGlobal('TelemetryCore') || _getGlobal('Telemetry');
  const tel = _getGlobal('Telemetry');
  const gs = _getGlobal('GlobalState');
  const gsm = _getGlobal('GlobalStateManager');
  const rtr = _getGlobal('RouterGlobal');
  const shell = _getGlobal('AppShell');

  const loaders: Record<string, LoaderStatus> = {
    configLoader: { available: !!cfg, version: cfg?.version || cfg?.getVersion?.() || null, ready: !!(cfg?.isReady?.() ?? cfg), healthCheck: cfg?.healthCheck?.() || null },
    preloader: { available: !!pre, version: pre?.getVersion?.() || null, ready: pre?.getStatus?.()?.ready || false, phase: pre?.getStatus?.()?.phase || null, healthCheck: pre?.healthCheck?.() || null },
    environment: { available: !!env, version: env?.getVersion?.() || null, ready: env?.isReady?.() ?? !!env, mode: env?.get?.('mode') || env?.getMode?.() || null, environment: env?.get?.('environment') || null, healthCheck: env?.healthCheck?.() || null },
    logger: { available: !!log, version: log?.getVersion?.() || null, ready: log?.isReady?.() ?? !!log, healthCheck: log?.healthCheck?.() || null },
    telemetryCore: { available: !!telCore, version: telCore?.getVersion?.() || tel?.getVersion?.() || null, ready: telCore?.isReady?.() ?? tel?.isReady?.() ?? !!tel, healthCheck: telCore?.healthCheck?.() || tel?.healthCheck?.() || null },
    globalState: { available: !!(gs || gsm), version: gsm?.getVersion?.() || gs?.version || null, ready: gsm?.isInitialized ?? !!gs, healthCheck: gsm?.healthCheck?.() || gs?.healthCheck?.() || null },
    router: { available: !!rtr, version: rtr?.getVersion?.() || null, ready: rtr?.isReady?.() ?? !!rtr, currentRoute: rtr?.current?.()?.path || null, healthCheck: rtr?.healthCheck?.() || null },
    appShell: { available: !!shell, version: shell?.getVersion?.() || null, ready: shell?.isReady?.() ?? !!shell, healthCheck: shell?.healthCheck?.() || null }
  };
  let available = 0, ready = 0;
  const total: number = Object.keys(loaders).length;
  for (const k of Object.keys(loaders)) { if (loaders[k].available) available++; if (loaders[k].ready) ready++; }
  return { loaders, summary: { total, available, ready, availablePercent: Math.round((available / total) * 100), readyPercent: Math.round((ready / total) * 100) }, timestamp: Date.now() };
};

export const info = (): { moduleId: string; version: string } => ({ moduleId: MODULE_ID, version: VERSION });
export const healthCheck = (): { status: string; moduleId: string; version: string } => ({ status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION });

export default { MODULE_ID, VERSION, getExternalLoadersStatus, info, healthCheck };
