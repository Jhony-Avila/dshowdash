// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.8.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-01:init:feature-loader
// PURPOSE: Panel-01 - Feature Loader
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createPanelPorts from /core/runtime/ports-profiles.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   injectPorts() — exported function
//   getPorts() — exported function
//   loadFeature — exported value
//   safeExecute() — exported function
//   initFeature() — exported function
//   initFeatureAsync — exported value
//   getLoadedFeatures() — exported function
//   isFeatureLoaded() — exported function
//   clearFeatures() — exported function
//   info() — exported function
//   healthCheck() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createPanelPorts } from '/core/runtime/ports-profiles.js';

export const VERSION = '9.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'panel-01:init:feature-loader';

const hasWindow = typeof window !== 'undefined';
const Ports = createPanelPorts({ moduleId: MODULE_ID });

const _initPorts = () => { Ports.init(); };
const _getPort = (name: string) => Ports.get(name);
export const injectPorts = (p: unknown) => Ports.inject(p);
export const getPorts = () => Ports.snapshot();

const _features = new Map<string, unknown>();
const _failedFeatures: string[] = [];

export const loadFeature = async (name: string, importFn: () => Promise<unknown>) => {
  if (_features.has(name)) return _features.get(name);
  try {
    const module = await importFn();
    _features.set(name, module);
    return module;
  } catch (e: any) {
    const logger = _getPort('logger');
    if (logger?.warn) logger.warn(`[${MODULE_ID}] Failed to load feature: ${name}`, { error: e.message });
    _failedFeatures.push(name);
    return null;
  }
};

export const safeExecute = (name: string, fn: Function, options: { fallback?: unknown; critical?: boolean } = {}) => {
  try {
    return fn();
  } catch (e: any) {
    const logger = _getPort('logger');
    if (logger?.error) logger.error(`[${MODULE_ID}] Error in ${name}`, { error: e.message });
    return options.fallback !== undefined ? options.fallback : null;
  }
};

export const initFeature = (name: string, initFn: Function, options: { fallback?: unknown; critical?: boolean } = {}) => safeExecute(name, initFn, options);

export const initFeatureAsync = async (name: string, initFn: Function, options: { fallback?: unknown; critical?: boolean } = {}) => {
  try {
    return await initFn();
  } catch (e: any) {
    const logger = _getPort('logger');
    if (logger?.error) logger.error(`[${MODULE_ID}] Async error in ${name}`, { error: e.message });
    return options.fallback !== undefined ? options.fallback : null;
  }
};

export const getLoadedFeatures = () => Array.from(_features.keys());
export const isFeatureLoaded = (name: string) => _features.has(name);
export const getFeatureStatus = () => ({ loaded: Array.from(_features.keys()), failed: [..._failedFeatures] });
export const clearFeatures = () => { _features.clear(); _failedFeatures.length = 0; };

export const info = () => ({ moduleId: MODULE_ID, version: VERSION, loadedFeatures: getLoadedFeatures() });
export const healthCheck = () => ({ status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION, featuresCount: _features.size });

export default { loadFeature, safeExecute, initFeature, initFeatureAsync, getLoadedFeatures, isFeatureLoaded, getFeatureStatus, clearFeatures, info, healthCheck, injectPorts, getPorts };
