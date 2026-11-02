// ═══════════════════════════════════════════════════════════════
// config-loader / _aggregator.ts — fachada pública, em FONTE
// ═══════════════════════════════════════════════════════════════
// POR QUE ESTE ARQUIVO EXISTE (2026-07-30)
//
// O `_entry.ts` apontava para `./index.js`, que faz
// `export * from './dist/config-loader.bundle.js'` — o build se alimentava do
// próprio artefato, descartava as fontes e saía VERDE. Correção em
// `core/lifecycle.ts` & cia. nunca chegaria ao browser.
//
// MÓDULO DE BOOT: `window.Config` é lido por meio projeto. Toda a mecânica está
// nos OITO submódulos em fonte; só esta camada vivia no bundle minificado.
//
// Reconstruído LENDO O BUNDLE. Equivalências conferidas uma a uma:
//   p=VERSION  O=MODULE_ID  M=Ports  mt=injectPorts  pt=getPorts  ht=getVersion
//   h=Config (= default)    a=ConfigStore
//   N=isBooted  Ce=bootConfigLoader  it=reloadConfig  at=waitForBoot
//   st=getLastBootTime  ie=getLastBootResult  ut=destroy  se=getLifecycleInfo
//   Re=getActiveOverrideKeys  te=getTrackerInfo  H=getEventLog  Qe=getSessionId
//
// ⚠️ `VERSION`/`MODULE_ID`/`getPorts`/`injectPorts`/`getVersion` do TOPO são
// desta camada, NÃO reexportados de submódulo. Cada submódulo tem os seus com o
// mesmo nome — pegar o do submódulo mudaria o valor publicado.
// ⚠️ `Config.getLoadTime()` devolve `getLastBootTime()`, não um "load time"
// próprio. Nome diferente da função que o alimenta.
// ═══════════════════════════════════════════════════════════════

import { createCorePorts } from '/core/runtime/ports-profiles.js';
import { isStrict, recordViolation } from '/core/runtime/enterprise/strict-mode.js';

import {
  bootConfigLoader, reloadConfig, isBooted, waitForBoot, destroy as destroyLifecycle,
  getLastBootTime, getLastBootResult, getLifecycleInfo,
} from './core/lifecycle.js';
import { ConfigStore } from './state/store.js';
import { mergeConfigs, getSafeDefaults } from './core/merger.js';
import { validateConfig } from './core/validator.js';
import { deepMerge } from './utils/deepmerge.js';
import {
  getApiProfileConfig, safeGet, loadLocalOverrides, persistLocalOverrides,
  getActiveOverrideKeys,
} from './utils/helpers.js';
import { getEventLog, getSessionId, getTrackerInfo } from './telemetry/tracker.js';

export const VERSION = '2.5.0-STRICT-MODE';
export const MODULE_ID = 'config-loader';

// Reexports diretos (o bundle os expõe sem envolver nada).
export {
  ConfigStore, bootConfigLoader, reloadConfig, isBooted, waitForBoot,
  mergeConfigs, getSafeDefaults, validateConfig, deepMerge,
  getApiProfileConfig, safeGet, loadLocalOverrides, persistLocalOverrides,
};

const Ports = createCorePorts({ moduleId: MODULE_ID });
export const injectPorts = (p: Record<string, unknown>) => Ports.inject(p);
export const getPorts = () => Ports.snapshot();
export function getVersion() { return VERSION; }

const S: any = ConfigStore;

// ── A fachada ────────────────────────────────────────────────────
export const Config = {
  version: VERSION,
  name: MODULE_ID,
  moduleId: MODULE_ID,

  getVersion() { return VERSION; },

  // `undefined` explícito quando o default não vem — é assim no bundle.
  get(chave: string, padrao?: unknown) { return S.get(chave, padrao !== undefined ? padrao : undefined); },
  getAll() { return S.getAll(); },

  // Já bootado → recarrega; senão → boota. Não é só "boot".
  load() { return isBooted() ? reloadConfig() : bootConfigLoader(); },

  onChange(fn: unknown) { return S.subscribe(fn); },
  isReady() { return isBooted() && S.isLoaded(); },
  waitReady(ms?: number) { return waitForBoot(ms || 10000); },

  // ⚠️ é o tempo do último BOOT, apesar do nome.
  getLoadTime() { return getLastBootTime(); },

  getApiProfile(nome?: string) { return S.getApiProfile(nome || 'default'); },
  timeouts() { return S.get('timeouts', {}); },
  // `featureFlags` primeiro, `features` como alternativa — nessa ordem.
  features()  { return S.get('featureFlags', S.get('features', {})); },
  refresh()   { return S.get('refresh', {}); },

  healthCheck() {
    const issues: string[] = [];
    const boot: any = getLastBootResult();
    if (!isBooted()) issues.push('Not booted');
    if (!S.isLoaded()) issues.push('Config not loaded');
    if (boot && !boot.ok) issues.push('Boot completed with errors');
    const tudo: any = S.getAll();
    if (!tudo || !tudo.app) issues.push('Missing app config');
    return {
      healthy: issues.length === 0,
      status: issues.length === 0 ? 'HEALTHY' : 'DEGRADED',
      version: VERSION, moduleId: MODULE_ID,
      booted: isBooted(), loaded: S.isLoaded(),
      bootOk: boot ? boot.ok : null,
      issues: issues.length > 0 ? issues : null,
      portsInitialized: Ports.isInitialized(),
      timestamp: Date.now(),
    };
  },

  info() {
    const tudo: any = S.getAll();
    const boot: any = getLastBootResult();
    const chavesOverride = getActiveOverrideKeys();
    return {
      name: MODULE_ID, version: VERSION,
      loaded: S.isLoaded(), frozen: S.isFrozen(),
      loadTime: this.getLoadTime(), loadedAt: S.getLoadedAt(),
      hasApp: !!(tudo && tudo.app), hasApi: !!(tudo && tudo.api),
      hasTimeouts: !!(tudo && tudo.timeouts),
      hasFeatures: !!(tudo && tudo.features) || !!(tudo && tudo.featureFlags),
      keys: tudo ? Object.keys(tudo) : [],
      keyCount: tudo ? Object.keys(tudo).length : 0,
      bootOk: boot ? boot.ok : null,
      bootErrors: boot ? boot.errors || [] : [],
      listenerCount: S.getListenerCount(),
      hasOverrides: S.hasOverrides(),
      overrideKeys: chavesOverride,
      lifecycle: getLifecycleInfo(),
      store: S.getStoreInfo(),
      tracker: getTrackerInfo(),
      portsInitialized: Ports.isInitialized(),
      timestamp: Date.now(),
    };
  },

  getDiagnostics() {
    return {
      version: VERSION, moduleId: MODULE_ID,
      healthCheck: this.healthCheck(), info: this.info(),
      config: S.getAll(), overridesMeta: S.getOverridesMeta(),
    };
  },

  /** Últimos N eventos, com filtro opcional por campo (raiz ou dentro de `data`). */
  getEvents(n?: number, filtro?: Record<string, unknown>) {
    const todos: any[] = getEventLog();
    const ultimos = todos.slice(-(n || 50));
    if (!filtro || Object.keys(filtro).length === 0) return ultimos;
    return ultimos.filter((ev: any) =>
      Object.entries(filtro).every(([k, v]) => ev[k] === v || (ev.data && ev.data[k] === v)));
  },

  getDebugLog() { return getEventLog(); },
  getSessionId() { return getSessionId(); },
  destroy() { destroyLifecycle(); },

  debug: {
    info:        () => Config.info(),
    events:      (n?: number) => Config.getEvents(n),
    store:       () => S.getStoreInfo(),
    lifecycle:   () => getLifecycleInfo(),
    tracker:     () => getTrackerInfo(),
    healthCheck: () => Config.healthCheck(),
    diagnostics: () => Config.getDiagnostics(),
  },
};

// ⚠️ recordViolation(type: string, details: object) — SEMPRE 2 argumentos.
if (typeof window !== 'undefined') {
  const w = window as any;
  if (isStrict()) {
    recordViolation('GLOBAL_EXPOSURE_BLOCKED',
      { module: MODULE_ID, property: 'window.Config', version: VERSION });
  } else if (!w.Config) {
    // `|| (…)` no bundle: NÃO sobrescreve um `window.Config` já existente.
    w.Config = Config;
  }
  // Este bloco roda mesmo sob strict, e SÓ com debug ligado no APP_CONFIG.
  if (w.APP_CONFIG && w.APP_CONFIG.app && w.APP_CONFIG.app.debug) {
    w.__dev = w.__dev || {};
    w.__dev.config = {
      getVersion: () => VERSION,
      healthCheck: () => Config.healthCheck(),
      info: () => Config.info(),
      getDiagnostics: () => Config.getDiagnostics(),
      store: ConfigStore,
      getAll: () => S.getAll(),
    };
  }
}

export default Config;
