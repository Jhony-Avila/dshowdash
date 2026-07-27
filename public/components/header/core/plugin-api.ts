// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v1.1.0-ES6)
// ═══════════════════════════════════════════════════════════════
// MODULE: header/core/plugin-api
// PURPOSE: API publica para registro de plugins externos
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createCorePorts from /core/runtime/ports-profiles.js
//   * as PluginSystem from ./plugin-system.js
// PROVIDES:
//   VERSION, MODULE_ID — identificacao do modulo
//   injectPorts(p) — injeta ports
//   getPorts() — snapshot dos ports
//   init(config) — inicializa a API de plugins
//   createPlugin(definition) — cria plugin a partir de definicao
//   register(definition) — registra plugin via PluginSystem
//   unregister(pluginId) — remove plugin
//   loadRemotePlugins() — carrega plugins remotos via fetch
//   listPlugins() — lista todos os plugins
//   hasPlugin(pluginId) — verifica se plugin existe
//   getPlugin(pluginId) — obtem plugin
//   enablePlugin(pluginId) — habilita plugin
//   disablePlugin(pluginId) — desabilita plugin
//   executeHook(hookName, data) — executa hook
//   getAvailableHooks() — lista hooks disponiveis
//   exposeGlobalAPI() — expoe API no window
//   getMetrics() — metricas da API
//   resetMetrics() — reseta metricas
//   healthCheck() — health check do modulo
//   info() — informacoes do modulo
// WINDOW ACCESS:
//   (window as any).HeaderPluginAPI — API global exposta via exposeGlobalAPI()
// ═══════════════════════════════════════════════════════════════

// Header - Plugin API
// @version 1.1.0-ES6
// @changelog v1.1.0-ES6 - Task 10.1 B09: var → const/let
// @description API pública para registro de plugins externos
'use strict';

import { createCorePorts } from '/core/runtime/ports-profiles.js';
import * as PluginSystem from './plugin-system.js';

export const VERSION = '1.1.0-ES6';
export const MODULE_ID = 'header/core/plugin-api';

const Ports = createCorePorts({ moduleId: MODULE_ID });
function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
export function injectPorts(p: Record<string,unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

const _log = function(level: string, ...args: any[]) {const logger = _getPort('logger'); if (!logger) return; const prefix = `[${MODULE_ID}]`; if (level === 'error' && logger.error) logger.error(prefix, args.join(' ')); else if (level === 'warn' && logger.warn) logger.warn(prefix, args.join(' ')); else if (level === 'info' && logger.info) logger.info(prefix, args.join(' ')); };

let _initialized = false;
let _apiEndpoint = '/api/header/plugins.php';
const _remotePlugins = new Map();

const _metrics = {
  apiCalls: 0,
  pluginsLoaded: 0,
  pluginsFailed: 0,
  lastLoadAt: (null as unknown|null)
};

export function init(config: Record<string,unknown>) {
  if (_initialized) return;
  
  _initPorts();
  
  if (config && config.endpoint) {
    // @ts-expect-error TS migration - TS2322
    _apiEndpoint = config.endpoint;
  }
  
  _initialized = true;
  _log('info', 'PluginAPI inicializada');
}

export function createPlugin(definition: Record<string,unknown>) {
  if (!definition || !definition.id) {
    _log('error', 'Plugin definition inválida - id obrigatório');
    return null;
  }
  
  return {
    id: definition.id,
    version: definition.version || '1.0.0',
    name: definition.name || definition.id,
    description: definition.description || '',
    
    hooks: definition.hooks || {},
    
    api: definition.api || {},
    
    init(context: Record<string,unknown>) {
      _log('debug', 'Plugin inicializado:', definition.id);
      if (typeof definition.onInit === 'function') {
        definition.onInit(context);
      }
    },
    
    destroy(context: Record<string,unknown>) {
      _log('debug', 'Plugin destruido:', definition.id);
      if (typeof definition.onDestroy === 'function') {
        definition.onDestroy(context);
      }
    }
  };
}

export function register(definition: Record<string,unknown>) {
  const plugin = createPlugin(definition);
  if (!plugin) {
    return { success: false, error: 'Invalid plugin definition' };
  }
  
  return PluginSystem.registerPlugin(plugin);
}

export function unregister(pluginId: string) {
  return PluginSystem.unregisterPlugin(pluginId);
}

export function loadRemotePlugins() {
  _metrics.apiCalls++;
  
  return fetch(_apiEndpoint, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'X-Requested-With': 'XMLHttpRequest'
    },
    credentials: 'same-origin'
  }).then(response => {
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    return response.json();
  }).then(data => {
    if (!data || !Array.isArray(data.plugins)) {
      _log('warn', 'Nenhum plugin remoto encontrado');
      return [];
    }
    
    // @ts-expect-error strict migration — TS7034
    const results = [];
    
    data.plugins.forEach((pluginDef: unknown) => {
      try {
        // @ts-expect-error TS migration - TS2345
        const result = register(pluginDef);
        if (result.success) {
          _metrics.pluginsLoaded++;
          // @ts-expect-error TS migration - TS2339
          _remotePlugins.set(pluginDef.id, pluginDef);
          // @ts-expect-error TS migration - TS2339
          results.push({ id: pluginDef.id, success: true });
        } else {
          _metrics.pluginsFailed++;
          // @ts-expect-error TS migration - TS2339
          results.push({ id: pluginDef.id, success: false, error: result.error });
        }
      } catch (e) {
        _metrics.pluginsFailed++;
        // @ts-expect-error TS migration - TS2339
        results.push({ id: pluginDef.id, success: false, error: e.message });
      }
    });
    
    _metrics.lastLoadAt = Date.now();
    _log('info', 'Plugins remotos carregados:', results.length);
    
    // @ts-expect-error strict migration — TS7005
    return results;
  }).catch(error => {
    _log('error', 'Falha ao carregar plugins remotos:', error.message);
    throw error;
  });
}

export function listPlugins() {
  return PluginSystem.getAllPlugins();
}

export function hasPlugin(pluginId: string) {
  return PluginSystem.hasPlugin(pluginId);
}

export function getPlugin(pluginId: string) {
  return PluginSystem.getPlugin(pluginId);
}

export function enablePlugin(pluginId: string) {
  return PluginSystem.enablePlugin(pluginId);
}

export function disablePlugin(pluginId: string) {
  return PluginSystem.disablePlugin(pluginId);
}

export function executeHook(hookName: string, data: Record<string,unknown>) {
  return PluginSystem.executeHook(hookName, data);
}

export function getAvailableHooks() {
  return PluginSystem.AVAILABLE_HOOKS ? PluginSystem.AVAILABLE_HOOKS.slice() : [];
}

export function exposeGlobalAPI() {
  (window as any).HeaderPluginAPI = {
    register,
    unregister,
    createPlugin,
    listPlugins,
    hasPlugin,
    getPlugin,
    enablePlugin,
    disablePlugin,
    executeHook,
    getAvailableHooks,
    VERSION
  };
  
  _log('info', 'API global exposta: (window as any).HeaderPluginAPI');
}

export function getMetrics() {
  return Object.assign({}, _metrics, {
    remotePluginsCount: _remotePlugins.size
  });
}

export function resetMetrics() {
  _metrics.apiCalls = 0;
  _metrics.pluginsLoaded = 0;
  _metrics.pluginsFailed = 0;
  _metrics.lastLoadAt = null;
}

export function healthCheck() {
  const pluginSystemHealth = PluginSystem.healthCheck ? PluginSystem.healthCheck() : { status: 'UNKNOWN' };
  
  const checks = {
    initialized: _initialized,
    pluginSystemHealthy: pluginSystemHealth.status !== 'UNHEALTHY',
    lowFailureRate: (_metrics.pluginsLoaded + _metrics.pluginsFailed) === 0 ||
      (_metrics.pluginsFailed / (_metrics.pluginsLoaded + _metrics.pluginsFailed)) < 0.3,
    portsInitialized: Ports.isInitialized()
  };
  
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  
  return {
    status: passed === total ? 'HEALTHY' : passed >= 2 ? 'DEGRADED' : 'UNHEALTHY',
    score: passed,
    maxScore: total,
    scoreDisplay: `${passed}/${total}`,
    checks,
    pluginSystemStatus: pluginSystemHealth.status,
    version: VERSION,
    moduleId: MODULE_ID,
    timestamp: new Date().toISOString()
  };
}

export function info() {
  return {
    version: VERSION,
    moduleId: MODULE_ID,
    initialized: _initialized,
    apiEndpoint: _apiEndpoint,
    availableHooks: getAvailableHooks(),
    registeredPlugins: listPlugins(),
    remotePluginsCount: _remotePlugins.size,
    metrics: getMetrics(),
    healthCheck: healthCheck()
  };
}

export default {
  VERSION,
  MODULE_ID,
  init,
  createPlugin,
  register,
  unregister,
  loadRemotePlugins,
  listPlugins,
  hasPlugin,
  getPlugin,
  enablePlugin,
  disablePlugin,
  executeHook,
  getAvailableHooks,
  exposeGlobalAPI,
  getMetrics,
  resetMetrics,
  healthCheck,
  info
};