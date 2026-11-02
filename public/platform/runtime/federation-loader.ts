// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (3.1.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: platform-federation-loader
// PURPOSE: Federation Loader
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION
//   MODULE_ID
//   loadMicroapp
//   unloadMicroapp
//   preloadMicroapp
//   getMicroappInfo
//   getLoadedApps
//   isLoaded
//   clearCache
//   default export
// ═══════════════════════════════════════════════════════════════
'use strict';

interface AppConfig {
  id: string;
  entry?: string;
  panelFallback?: string;
  [key: string]: unknown;
}

interface LoadedApp {
  id: string;
  module: Record<string, unknown> | null;
  config: AppConfig;
  loadedAt?: number;
  status: string;
  error?: string;
  fallback?: string;
}

const VERSION = '3.1.0-P2-ENTERPRISE';
const MODULE_ID = 'platform-federation-loader';

let _loadedApps: Record<string, LoadedApp> = {};
let _loadingPromises: Record<string, Promise<LoadedApp>> = {};

function loadMicroapp(appConfig: AppConfig): Promise<LoadedApp> {
  const appId = appConfig && appConfig.id;
  if (!appId) return Promise.reject(new Error('App config must have id'));
  if (_loadedApps[appId]) return Promise.resolve(_loadedApps[appId]);
  // @ts-expect-error strict migration — TS2801
  if (_loadingPromises[appId]) return _loadingPromises[appId];

  const loadPromise = Promise.resolve().then(() => {
    const entry = appConfig.entry;
    if (!entry) throw new Error(`No entry point for app ${appId}`);
    return import(entry);
  }).then((module: Record<string, unknown>) => {
    const microapp: LoadedApp = { id: appId, module, config: appConfig, loadedAt: Date.now(), status: 'loaded' };
    _loadedApps[appId] = microapp;
    delete _loadingPromises[appId];
    return microapp;
  }).catch((error: Error) => {
    delete _loadingPromises[appId];
    return { id: appId, module: null, config: appConfig, error: error.message, status: 'failed', fallback: appConfig.panelFallback } as LoadedApp;
  });

  _loadingPromises[appId] = loadPromise;
  return loadPromise;
}

function unloadMicroapp(appId: string) {
  const app = _loadedApps[appId];
  if (!app) return Promise.resolve(false);
  return Promise.resolve().then(() => {
    if (app.module && (app.module as Record<string, unknown>).destroy) return ((app.module as Record<string, unknown>).destroy as () => Promise<void>)();
  }).then(() => {
    delete _loadedApps[appId];
    return true;
  });
}

function preloadMicroapp(appConfig: AppConfig) { return loadMicroapp(appConfig); }
function getMicroappInfo(appId: string) { return _loadedApps[appId] || null; }
function getLoadedApps() { return Object.keys(_loadedApps); }
function isLoaded(appId: string) { return !!_loadedApps[appId]; }
function clearCache() { _loadedApps = {}; _loadingPromises = {}; }

export { VERSION, MODULE_ID, loadMicroapp, unloadMicroapp, preloadMicroapp, getMicroappInfo, getLoadedApps, isLoaded, clearCache };
export default { VERSION, MODULE_ID, loadMicroapp, unloadMicroapp, preloadMicroapp, getMicroappInfo, getLoadedApps, isLoaded, clearCache };
