// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (UNKNOWN)
// ═══════════════════════════════════════════════════════════════
// MODULE: app-config
// PURPOSE: Dashboard App Configuration
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createCorePorts from /core/runtime/ports-profiles.js
//
// PROVIDES:
//   injectPorts() — exported function
//   getPorts() — exported function
//   appConfig — exported value
//
// RECEIVES (via init/options): (none)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   window.APP_CONFIG
//   window.Logger
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createCorePorts } from '/core/runtime/ports-profiles.js';

const MODULE_ID = 'app-config';
var _Ports = createCorePorts({ moduleId: MODULE_ID });

const _debugEnabled = () => window.APP_CONFIG?.app?.debug ?? false;
const _log = (level: 'error' | 'warn' | 'debug', ...args: unknown[]) => {
  const logger = _Ports.get('logger');
  if (!logger) return;
  if (level === 'error') { logger.error?.(`[${MODULE_ID}]`, ...args); return; }
  if (level === 'warn') { logger.warn?.(`[${MODULE_ID}]`, ...args); return; }
  if (_debugEnabled()) logger.debug?.(`[${MODULE_ID}]`, ...args);
};

function deepFreeze(obj: unknown, seen = new WeakSet()): unknown {
  if (obj && typeof obj === "object" && !seen.has(obj as object)) {
    seen.add(obj as object);
    Object.getOwnPropertyNames(obj).forEach((prop) => { deepFreeze((obj as Record<string, unknown>)[prop], seen); });
    return Object.freeze(obj);
  }
  return obj;
}

const ASSETS_VERSION = "1761487852";
const MIN_REFRESH = 10_000;
const MAX_REFRESH = 300_000;
const MFE_VERSION = "1.0.1";

const hostname = typeof window !== 'undefined' ? window.location.hostname : ''; // CONTRACT_OK_P14: FallbackReadOnly — env detection (fallback=yes, readOnly=yes, emits=none, scope=navigation-only)
const isDev = /(^localhost$|^127\.0\.0\.1$|^dev\.|^test\.|^stg\.|^stage\.|^staging\.|\.internal$)/.test(hostname);

const config = {
  app: { name: "DSHOW Dashboard", version: "4.3.0", build: "20251201", assetsVersion: ASSETS_VERSION, assetQuery: `?v=${ASSETS_VERSION}`, debug: false, apiUrl: "/api", authEndpoint: "/api/auth/check.php", timeZone: "America/Sao_Paulo", locale: "pt-BR" },
  retryAttempts: 3, retryDelay: 1500,
  features: { useRemoteCardsPanel: false, usePanelsOrchestrator: true },
  orchestrator: { enabled: true, defaultPreset: 'default', healthCheckInterval: 30000, autoRecovery: true, trackStatus: true, notifyOnBoot: true, telemetryEnabled: true },
  timeouts: { readyTimeoutMs: 11000, componentTimeoutMs: 8000, cardsReadyTimeoutMs: 8000, mfContainerPollMs: 50, mfContainerMaxMs: 20000, apiDefaultMs: 15000, apiHealthMs: 6000, apiAlertsMs: 6000, configLoadMs: 5000, refreshOperationMs: 8000, refreshThrottleMs: 5000, refreshFallbackMs: 1200 },
  microFrontends: { cardsPanel: { url: `/mf/cards-panel/v${MFE_VERSION}/remoteEntry.js`, scope: 'cardsPanel', module: './widget', version: MFE_VERSION } },
  api: { cardsBaseUrl: '/api/modules/cards' },
  modules: {
    cards: ["card-01", "card-02", "card-03", "card-04", "card-05", "card-06", "card-07", "card-08", "card-09", "card-10", "card-11", "card-12"],
    charts: ["executions-timeline", "performance-comparison"],
    panels: [
      { id: "painel-15", title: "Painel 15 - Destaque", description: "Painel principal em destaque", layout: "featured", featured: true, span: 2, enabled: true, lazy: false },
      { id: "painel-16", title: "Painel 16", layout: "default", featured: false, span: 1, enabled: true, lazy: true },
      { id: "painel-17", title: "Painel 17", layout: "default", featured: false, span: 1, enabled: true, lazy: true },
      { id: "painel-02", title: "Painel 02", layout: "default", featured: false, span: 1, enabled: true, lazy: true },
      { id: "painel-06", title: "Painel 06", layout: "default", featured: false, span: 1, enabled: true, lazy: true },
      { id: "painel-03", title: "Painel 03", layout: "default", featured: false, span: 1, enabled: true, lazy: true },
      { id: "painel-04", title: "Painel 04", layout: "default", featured: false, span: 1, enabled: true, lazy: true },
      { id: "painel-07", title: "Painel 07", layout: "default", featured: false, span: 1, enabled: true, lazy: true },
      { id: "painel-08", title: "Painel 08", layout: "default", featured: false, span: 1, enabled: true, lazy: true },
      { id: "painel-14", title: "Painel 14", layout: "default", featured: false, span: 1, enabled: true, lazy: true },
      { id: "painel-09", title: "Painel 09", layout: "default", featured: false, span: 1, enabled: true, lazy: true },
      { id: "painel-10", title: "Painel 10", layout: "default", featured: false, span: 1, enabled: true, lazy: true },
      { id: "painel-18", title: "Painel 18", layout: "default", featured: false, span: 1, enabled: true, lazy: true },
      { id: "painel-19", title: "Painel 19", layout: "default", featured: false, span: 1, enabled: true, lazy: true }
    ]
  },
  paths: { modules: "/modules", assets: "/assets", mf: "/mf" },
  network: { defaultTimeoutMs: null as number | null, retryAttempts: 3, backoffMs: 1500 },
  refresh: { global: 60_000, cards: 30_000, panels: 45_000 },
  telemetry: { enabled: isDev }
};

config.network.retryAttempts = config.retryAttempts;
config.network.backoffMs = config.retryDelay;
config.network.defaultTimeoutMs = config.timeouts.apiDefaultMs;
config.microFrontends.cardsPanel.url = `/mf/cards-panel/v${MFE_VERSION}/remoteEntry.js${config.app.assetQuery}`;
config.orchestrator.enabled = config.features.usePanelsOrchestrator;

if (!config.app || !config.modules || !config.paths) throw new Error("AppConfig inválido: faltam propriedades essenciais");
["cards", "charts", "panels"].forEach((k) => { if (!Array.isArray((config.modules as Record<string, unknown>)[k])) throw new Error(`AppConfig inválido: modules.${k} deve ser um array`); });
config.refresh.global = Math.min(MAX_REFRESH, Math.max(MIN_REFRESH, Number(config.refresh.global) || 60_000));

const appConfig = deepFreeze(config);
export default appConfig;
export { appConfig };

export function injectPorts(p: unknown) { return _Ports.inject(p); }
export function getPorts() { return _Ports.snapshot(); }

if (typeof window !== 'undefined') {
  if (!Object.getOwnPropertyDescriptor(window, 'AppConfig')) Object.defineProperty(window, 'AppConfig', { value: appConfig, writable: false, configurable: false, enumerable: true });
  if (!Object.getOwnPropertyDescriptor(window, 'appConfig')) Object.defineProperty(window, 'appConfig', { value: appConfig, writable: false, configurable: false, enumerable: true });
  if (!Object.getOwnPropertyDescriptor(window, 'APP_CONFIG')) Object.defineProperty(window, 'APP_CONFIG', { value: appConfig, writable: false, configurable: false, enumerable: true });
}
