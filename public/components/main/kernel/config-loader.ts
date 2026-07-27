// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.2.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: main-kernel-config-loader
// PURPOSE: MainKernel Configuration Loader
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createLogger from /assets/js/core/logger-global/index.js
//
// PROVIDES:
//   MODULE_ID — module constant
//   VERSION — module constant
//   setLogLevel() — exported function
//   getConfig() — exported function
//   getKernelConfig() — exported function
//   getFeatureConfig() — exported function
//   isFeatureEnabled() — exported function
//   updateConfig() — exported function
//   resetConfig() — exported function
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
import { createLogger } from '/assets/js/core/logger-global/index.js';

export const MODULE_ID = 'main-kernel-config-loader';
const _logger = createLogger(MODULE_ID);
export const VERSION = '1.2.0-ENTERPRISE';

type LogLevelName = 'debug' | 'info' | 'warn' | 'error' | 'none';

interface KernelConfigData {
  version: string;
  kernel: {
    logLevel: string;
    enableConsoleCommands: boolean;
    enableHealthMonitor: boolean;
    healthMonitorIntervalMs: number;
    healthMonitorAutoRecover: boolean;
    featureEnableTimeoutMs: number;
    [key: string]: unknown;
  };
  features: Record<string, Record<string, unknown>>;
  [key: string]: unknown;
}

let _config: KernelConfigData | null = null;
let _loaded = false;
let _logLevel = 1;

const LOG_LEVELS: Record<LogLevelName, number> = { debug: 0, info: 1, warn: 2, error: 3, none: 99 };

const DEFAULT_CONFIG: KernelConfigData = {
  version: '1.0.0',
  kernel: {
    logLevel: 'info',
    enableConsoleCommands: true,
    enableHealthMonitor: true,
    healthMonitorIntervalMs: 30000,
    healthMonitorAutoRecover: true,
    featureEnableTimeoutMs: 5000
  },
  features: {}
};

// ═══════════════════════════════════════════════════════════════
// INTERNAL LOGGING
// ═══════════════════════════════════════════════════════════════

function _log(level: LogLevelName, msg: string, data?: unknown) {
  const levelNum = LOG_LEVELS[level] || 1;
  const threshold: number = (typeof _logLevel !== 'undefined' ? _logLevel : (typeof _config !== 'undefined' && _config && _config.kernel?.logLevel ? Number(_config.kernel.logLevel) : 1));
  if (levelNum < threshold) return;
  const context = data !== undefined ? { data } : {};
  if (level === 'error') _logger.error(msg, context);
  else if (level === 'warn') _logger.warn(msg, context);
  else if (level === 'debug') _logger.debug(msg, context);
  else _logger.info(msg, context);
}

export function setLogLevel(level: string | number): number {
  if (typeof level === 'string') {
    _logLevel = LOG_LEVELS[level as LogLevelName] !== undefined ? LOG_LEVELS[level as LogLevelName] : 1;
  } else if (typeof level === 'number') {
    _logLevel = level;
  }
  return _logLevel;
}

// ═══════════════════════════════════════════════════════════════
// CONFIG LOADING
// ═══════════════════════════════════════════════════════════════

export async function loadConfig(path?: string) {
  if (_loaded && _config) {
    return { ok: true, config: _config, cached: true };
  }
  
  try {
    const configPath = path || '/components/main/kernel/config.json';
    const response = await fetch(configPath);
    
    if (!response.ok) {
      throw new Error(`Failed to load config: ${response.status}`);
    }
    
    const json = await response.json();
    _config = mergeConfig(DEFAULT_CONFIG as unknown as Record<string, unknown>, json) as unknown as KernelConfigData;
    _loaded = true;

    _log('debug', `Configuration loaded: ${_config.version}`);

    return { ok: true, config: _config };
  } catch (e) {
    _log('warn', `Using default config: ${(e as Error).message}`);
    _config = DEFAULT_CONFIG;
    _loaded = true;
    return { ok: true, config: _config, fallback: true };
  }
}

function mergeConfig(defaults: Record<string, unknown>, overrides: Record<string, unknown>): Record<string, unknown> {
  const result = Object.assign({}, defaults);
  
  for (const key in overrides) {
    if (overrides.hasOwnProperty(key)) {
      if (typeof overrides[key] === 'object' && overrides[key] !== null && !Array.isArray(overrides[key])) {
        result[key] = mergeConfig((defaults[key] || {}) as Record<string, unknown>, overrides[key] as Record<string, unknown>);
      } else {
        result[key] = overrides[key];
      }
    }
  }
  
  return result;
}

// ═══════════════════════════════════════════════════════════════
// CONFIG GETTERS
// ═══════════════════════════════════════════════════════════════

export function getConfig() {
  return _config || DEFAULT_CONFIG;
}

export function getKernelConfig() {
  const cfg = getConfig();
  return cfg.kernel || DEFAULT_CONFIG.kernel;
}

export function getFeatureConfig(featureId: string): Record<string, unknown> {
  const cfg = getConfig();
  return (cfg.features && cfg.features[featureId]) || {};
}

export function isFeatureEnabled(featureId: string) {
  const featureCfg = getFeatureConfig(featureId);
  return featureCfg['enabled'] !== false;
}

// ═══════════════════════════════════════════════════════════════
// CONFIG UPDATES
// ═══════════════════════════════════════════════════════════════

export function updateConfig(updates: Record<string, unknown>) {
  _config = mergeConfig((_config || DEFAULT_CONFIG) as Record<string, unknown>, updates) as unknown as KernelConfigData;
  return { ok: true, config: _config };
}

export function resetConfig() {
  _config = Object.assign({}, DEFAULT_CONFIG);
  _loaded = false;
  return { ok: true };
}

// ═══════════════════════════════════════════════════════════════
// OBSERVABILITY
// ═══════════════════════════════════════════════════════════════

export function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    loaded: _loaded,
    configVersion: _config ? _config.version : null
  };
}

export function healthCheck() {
  return {
    status: _loaded ? 'HEALTHY' : 'NOT_LOADED',
    moduleId: MODULE_ID,
    version: VERSION,
    loaded: _loaded,
    configVersion: _config ? _config.version : null,
    timestamp: Date.now()
  };
}

export default {
  MODULE_ID,
  VERSION,
  loadConfig,
  getConfig,
  getKernelConfig,
  getFeatureConfig,
  isFeatureEnabled,
  updateConfig,
  resetConfig,
  setLogLevel,
  info,
  healthCheck
};
