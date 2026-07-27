// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v1.2.0-ES6)
// ═══════════════════════════════════════════════════════════════
// MODULE: header/core/plugin-system
// PURPOSE: Sistema de plugins com hooks, registro e lifecycle
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createCorePorts from /core/runtime/ports-profiles.js
// PROVIDES:
//   VERSION, MODULE_ID — identificacao do modulo
//   injectPorts(p) — injeta ports
//   getPorts() — snapshot dos ports
//   init(headerInstance) — inicializa o sistema de plugins
//   registerPlugin(plugin) — registra um plugin
//   unregisterPlugin(pluginId) — remove um plugin
//   getPlugin(pluginId) — obtem plugin por id
//   hasPlugin(pluginId) — verifica se plugin existe
//   getAllPlugins() — lista todos os plugins
//   enablePlugin(pluginId) — habilita plugin
//   disablePlugin(pluginId) — desabilita plugin
//   executeHook(hookName, data) — executa hook em todos os plugins
//   hasHookListeners(hookName) — verifica se hook tem listeners
//   getMetrics() — metricas do sistema de plugins
//   resetMetrics() — reseta metricas
//   healthCheck() — health check do modulo
//   info() — informacoes do modulo
//   AVAILABLE_HOOKS — lista de hooks disponiveis
// EMITS (eventos):
//   header:plugin-system:registered — quando plugin e registrado
//   header:plugin-system:unregistered — quando plugin e removido
//   header:plugin:{id}:{event} — eventos emitidos pelos plugins
// ═══════════════════════════════════════════════════════════════

// Header - Plugin System
// @version 1.2.0-ES6
// @changelog v1.2.0-ES6 - Task 10.1 B05: var → const/let
// @changelog v1.1.0 - healthCheck ajustado para módulo não inicializado
'use strict';

import { createCorePorts } from '/core/runtime/ports-profiles.js';

export const VERSION = '1.2.0-ES6';
export const MODULE_ID = 'header/core/plugin-system';

const Ports = createCorePorts({ moduleId: MODULE_ID });
let _portsInitialized = false;

function _initPorts() { if (_portsInitialized) return; Ports.init(); _portsInitialized = true; }
function _getPort(name: string) { return Ports.get(name); }
export function injectPorts(p: Record<string,unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

const _debugEnabled = () => { const cfg = _getPort('config'); return (cfg && cfg.app && cfg.app.debug) ? true : false; };
const _log = function(level: string, ...args: any[]) {const logger = _getPort('logger'); if (!logger) return; const prefix = `[${MODULE_ID}]`; if (level === 'error') { if (logger.error) logger.error(prefix, args.join(' ')); return; } if (level === 'warn') { if (logger.warn) logger.warn(prefix, args.join(' ')); return; } if (level === 'info') { if (logger.info) logger.info(prefix, args.join(' ')); return; } if (_debugEnabled() && logger.debug) logger.debug(prefix, args.join(' ')); };

const _plugins = new Map();
const _hooks = new Map();
let _headerInstance: unknown = null;
let _initialized = false;

const AVAILABLE_HOOKS = ['beforeMount', 'afterMount', 'beforeUnmount', 'afterUnmount', 'beforeComponentLoad', 'afterComponentLoad', 'beforeRender', 'afterRender', 'onError', 'onHealthCheck', 'onStateChange', 'onRouteChange', 'onRefresh', 'onResize'];
let _metrics = { pluginsRegistered: 0, pluginsActive: 0, hooksExecuted: 0, hookErrors: 0, lastHookAt: (null as unknown|null) };

function init(headerInstance: Record<string,unknown>) {
  _initPorts();
  _headerInstance = headerInstance;
  AVAILABLE_HOOKS.forEach(hookName => { _hooks.set(hookName, []); });
  _initialized = true;
  _log('info', 'PluginSystem inicializado com', AVAILABLE_HOOKS.length, 'hooks disponíveis');
}

function _validatePlugin(plugin: Record<string,unknown>) {
  const errors = [];
  if (!plugin) { errors.push('Plugin é null ou undefined'); return { valid: false, errors }; }
  if (!plugin.id || typeof plugin.id !== 'string') { errors.push('Plugin deve ter um id (string)'); }
  if (!plugin.version || typeof plugin.version !== 'string') { errors.push('Plugin deve ter uma version (string)'); }
  if (typeof plugin.init !== 'function') { errors.push('Plugin deve ter um método init()'); }
  if (typeof plugin.destroy !== 'function') { errors.push('Plugin deve ter um método destroy()'); }
  if (plugin.hooks) { Object.keys(plugin.hooks).forEach(hookName => { if (AVAILABLE_HOOKS.indexOf(hookName) === -1) { errors.push(`Hook desconhecido: ${hookName}`); } if (typeof (plugin.hooks as Record<string,unknown>)[hookName] !== 'function') { errors.push(`Hook ${hookName} deve ser uma função`); } }); }
  return { valid: errors.length === 0, errors };
}

function registerPlugin(plugin: Record<string,unknown>) {
  if (!_initialized) { _log('error', 'PluginSystem não inicializado'); return { success: false, error: 'PluginSystem não inicializado' }; }
  const validation = _validatePlugin(plugin);
  if (!validation.valid) { _log('error', 'Plugin inválido:', validation.errors.join(', ')); return { success: false, error: validation.errors.join(', ') }; }
  if (_plugins.has(plugin.id)) { _log('warn', 'Plugin já registrado:', plugin.id); return { success: false, error: `Plugin já registrado: ${plugin.id}` }; }
  // @ts-expect-error TS migration - TS2345
  const context = _createPluginContext(plugin.id);
  try {
    // @ts-expect-error TS migration - TS2349
    plugin.init(context);
    // @ts-expect-error TS migration - TS2345
    if (plugin.hooks) { Object.keys(plugin.hooks).forEach(hookName => { _registerHook(hookName, plugin.id, (plugin.hooks as Record<string,unknown>)[hookName]); }); }
    _plugins.set(plugin.id, { plugin, context, active: true, registeredAt: Date.now(), hooks: plugin.hooks ? Object.keys(plugin.hooks) : [] });
    _metrics.pluginsRegistered++;
    _metrics.pluginsActive++;
    _log('info', 'Plugin registrado:', plugin.id, `v${plugin.version}`);
    _emitPluginEvent('registered', { pluginId: plugin.id, version: plugin.version });
    return { success: true, pluginId: plugin.id };
  } catch (error: any) { _log('error', 'Erro ao inicializar plugin:', plugin.id, error.message); return { success: false, error: error.message }; }
}

function unregisterPlugin(pluginId: string) {
  if (!_plugins.has(pluginId)) { _log('warn', 'Plugin não encontrado:', pluginId); return false; }
  const entry = _plugins.get(pluginId);
  try { entry.plugin.destroy(entry.context); } catch (error: any) { _log('error', 'Erro ao destruir plugin:', pluginId, error.message); }
  entry.hooks.forEach((hookName: string) => { _unregisterHook(hookName, pluginId); });
  _plugins.delete(pluginId);
  _metrics.pluginsActive--;
  _log('info', 'Plugin removido:', pluginId);
  _emitPluginEvent('unregistered', { pluginId });
  return true;
}

function _createPluginContext(pluginId: string) {
  return {
    pluginId,
    getHeader() { return _headerInstance; },
    log(level: string, message: string) { _log(level, `[Plugin:${pluginId}]`, message); },
    emit(eventName: string, data: Record<string,unknown>) { const eventBus = _getPort('eventBus'); if (eventBus && eventBus.emit) { eventBus.emit(`header:plugin:${pluginId}:${eventName}`, data); } },
    on(eventName: string, callback: Function) { const eventBus = _getPort('eventBus'); if (eventBus && eventBus.on) { return eventBus.on(eventName, callback); } return () => {}; },
    storage: {
      get(key: string) { try { const data = localStorage.getItem(`header:plugin:${pluginId}:${key}`); return data ? JSON.parse(data) : null; } catch (e) { return null; } },
      set(key: string, value: unknown) { try { localStorage.setItem(`header:plugin:${pluginId}:${key}`, JSON.stringify(value)); return true; } catch (e) { return false; } },
      remove(key: string) { localStorage.removeItem(`header:plugin:${pluginId}:${key}`); }
    },
    dom: {
      // @ts-expect-error TS migration - TS2339
      querySelector(selector: string) { const container = _headerInstance && _headerInstance.elements && _headerInstance.elements.container; return container ? container.querySelector(selector) : null; },
      // @ts-expect-error TS migration - TS2339
      querySelectorAll(selector: string) { const container = _headerInstance && _headerInstance.elements && _headerInstance.elements.container; return container ? container.querySelectorAll(selector) : []; },
      // @ts-expect-error TS migration - TS2322, TS2345
      createElement(tag: string, attributes: unknown) { const el = document.createElement(tag); if (attributes) { Object.keys(attributes).forEach(key => { if (key === 'className') { el.className = (attributes as Record<string,unknown>)[key]; } else if (key === 'innerHTML') { el.innerHTML = (attributes as Record<string,unknown>)[key]; } else { el.setAttribute(key, (attributes as Record<string,unknown>)[key]); } }); } el.setAttribute('data-plugin', pluginId); return el; }
    },
    getPlugin(otherId: string) { const entry = _plugins.get(otherId); if (entry && entry.plugin.api) { return entry.plugin.api; } return null; }
  };
}

function _registerHook(hookName: string, pluginId: string, callback: Function) { const hookList = _hooks.get(hookName); if (hookList) { hookList.push({ pluginId, callback }); } }
function _unregisterHook(hookName: string, pluginId: string) { const hookList = _hooks.get(hookName); if (hookList) { const filtered = hookList.filter((h: Record<string,unknown>) => h.pluginId !== pluginId); _hooks.set(hookName, filtered); } }

function executeHook(hookName: string, data: Record<string,unknown>) {
  const hookList = _hooks.get(hookName);
  if (!hookList || hookList.length === 0) { return Promise.resolve(data); }
  _metrics.hooksExecuted++;
  _metrics.lastHookAt = Date.now();
  let result = data;
  // @ts-expect-error strict migration — TS7034
  const promises = [];
  hookList.forEach((hook: Function) => {
    // @ts-expect-error TS migration - TS2339
    const entry = _plugins.get(hook.pluginId);
    if (!entry || !entry.active) return;
    try {
      // @ts-expect-error TS migration - TS2339
      const hookResult = hook.callback(result, entry.context);
      // @ts-expect-error TS migration - TS2339
      if (hookResult && typeof hookResult.then === 'function') { promises.push(hookResult.catch((error: unknown) => { _metrics.hookErrors++; _log('error', 'Hook error:', hookName, 'plugin:', hook.pluginId, error.message); return result; })); }
      else if (hookResult !== undefined) { result = hookResult; }
    // @ts-expect-error TS migration - TS2339
    } catch (error: any) { _metrics.hookErrors++; _log('error', 'Hook error:', hookName, 'plugin:', hook.pluginId, error.message); }
  });
  // @ts-expect-error strict migration — TS7005
  if (promises.length > 0) { return Promise.all(promises).then(() => result); }
  return Promise.resolve(result);
}

function hasHookListeners(hookName: string) { const hookList = _hooks.get(hookName); return hookList && hookList.length > 0; }
function getPlugin(pluginId: string) { const entry = _plugins.get(pluginId); return entry ? entry.plugin : null; }
function hasPlugin(pluginId: string) { return _plugins.has(pluginId); }
function getAllPlugins() { const result: any[] = []; _plugins.forEach((entry, id) => { result.push({ id, version: entry.plugin.version, name: entry.plugin.name || id, active: entry.active, hooks: entry.hooks, registeredAt: entry.registeredAt }); }); return result; }
function enablePlugin(pluginId: string) { const entry = _plugins.get(pluginId); if (entry && !entry.active) { entry.active = true; _metrics.pluginsActive++; _log('info', 'Plugin habilitado:', pluginId); return true; } return false; }
function disablePlugin(pluginId: string) { const entry = _plugins.get(pluginId); if (entry && entry.active) { entry.active = false; _metrics.pluginsActive--; _log('info', 'Plugin desabilitado:', pluginId); return true; } return false; }
function _emitPluginEvent(type: string, data: Record<string,unknown>) { const eventBus = _getPort('eventBus'); if (eventBus && eventBus.emit) { eventBus.emit(`header:plugin-system:${type}`, Object.assign({ timestamp: Date.now() }, data)); } }
function getMetrics() { return Object.assign({}, _metrics); }
function resetMetrics() { _metrics = { pluginsRegistered: _plugins.size, pluginsActive: 0, hooksExecuted: 0, hookErrors: 0, lastHookAt: null }; _plugins.forEach(entry => { if (entry.active) _metrics.pluginsActive++; }); }

function healthCheck() {
  _initPorts();
  const hookErrorRate = _metrics.hooksExecuted > 0 ? _metrics.hookErrors / _metrics.hooksExecuted : 0;
  const checks = { initialized: _initialized, hasHeaderInstance: !!_headerInstance || !_initialized, lowHookErrorRate: hookErrorRate < 0.1 || _metrics.hooksExecuted === 0, portsInitialized: _portsInitialized };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  return { status: passed === total ? 'HEALTHY' : passed >= 2 ? 'DEGRADED' : 'UNHEALTHY', score: passed, maxScore: total, scoreDisplay: `${passed}/${total}`, checks, pluginsCount: _plugins.size, activePlugins: _metrics.pluginsActive, version: VERSION, moduleId: MODULE_ID, timestamp: new Date().toISOString() };
}

function info() { return { version: VERSION, moduleId: MODULE_ID, initialized: _initialized, availableHooks: AVAILABLE_HOOKS, plugins: getAllPlugins(), metrics: getMetrics(), portsInitialized: _portsInitialized, healthCheck: healthCheck() }; }

export { init, registerPlugin, unregisterPlugin, getPlugin, hasPlugin, getAllPlugins, enablePlugin, disablePlugin, executeHook, hasHookListeners, getMetrics, resetMetrics, healthCheck, info, AVAILABLE_HOOKS };

export default { VERSION, MODULE_ID, init, registerPlugin, unregisterPlugin, getPlugin, hasPlugin, getAllPlugins, enablePlugin, disablePlugin, executeHook, hasHookListeners, healthCheck, info, AVAILABLE_HOOKS };