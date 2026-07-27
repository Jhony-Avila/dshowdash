// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v1.4.0-ES6)
// ═══════════════════════════════════════════════════════════════
// MODULE: header/core/devtools
// PURPOSE: Ferramentas de desenvolvimento e debug para o Header
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createCorePorts from /core/runtime/ports-profiles.js
// PROVIDES:
//   VERSION, MODULE_ID — identificacao do modulo
//   injectPorts(p) — injeta ports
//   getPorts() — snapshot dos ports
//   init(headerInstance, integrations) — inicializa DevTools
//   disable() — desabilita DevTools
//   safeDisable() — desabilita se ativo
//   isEnabled() — verifica se esta ativo
//   createDevAPI() — cria API completa de debug
//   healthCheck() — health check do modulo
//   info() — informacoes do modulo
// WINDOW ACCESS:
//   (window as any).__headerDev — API de debug exposta no init()
// ═══════════════════════════════════════════════════════════════

// Header - DevTools
// @version 1.4.0-ES6
// @changelog v1.4.0-ES6 - Task 10.1 B12: var → const/let
// @changelog v1.3.0-FIX - safeDisable() corrigido
// Ferramentas de desenvolvimento e debug para o Header
'use strict';

import { createCorePorts } from '/core/runtime/ports-profiles.js';

export const VERSION = '1.4.0-ES6';
export const MODULE_ID = 'header/core/devtools';

const Ports = createCorePorts({ moduleId: MODULE_ID });
function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
export function injectPorts(p: Record<string,unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

let _headerInstance: unknown = null;
let _integrations: Record<string,unknown>|null = null;
let _enabled = false;

function init(headerInstance: Record<string,unknown>, integrations: Record<string,unknown>) {
  _initPorts();
  _headerInstance = headerInstance;
  _integrations = integrations;
  _enabled = true;
  
  if (typeof window !== 'undefined') {
    (window as any).__headerDev = createDevAPI();
    console.log('%c[Header DevTools] Ativado! Use (window as any).__headerDev para inspecionar.', 'color: #4CAF50; font-weight: bold;');
  }
}

function createDevAPI() {
  return {
    version: VERSION,
    header() { return _headerInstance; },
    integrations() { return _integrations; },
    health() {
      const results: Record<string, Record<string, unknown>> = {};
      // @ts-expect-error TS migration - TS2339
      if (_headerInstance && _headerInstance.healthCheck) results.header = _headerInstance.healthCheck();
      // @ts-expect-error TS migration - TS2349
      if (_integrations && _integrations.healthCheck) results.integrations = _integrations.healthCheck();
      // @ts-expect-error TS migration - TS2339
      if (_headerInstance && _headerInstance.componentsLoader) results.components = _headerInstance.componentsLoader.healthCheck();
      console.table(Object.keys(results).map(k => ({
        module: k,
        status: results[k].status,
        score: results[k].scoreDisplay
      })));
      return results;
    },
    info() {
      const results: Record<string, Record<string, unknown>> = {};
      // @ts-expect-error TS migration - TS2339
      if (_headerInstance && _headerInstance.info) results.header = _headerInstance.info();
      // @ts-expect-error TS migration - TS2349
      if (_integrations && _integrations.info) results.integrations = _integrations.info();
      return results;
    },
    module(name: string) {
      // @ts-expect-error TS migration - TS2349
      if (_integrations && _integrations.getModule) return _integrations.getModule(name);
      return null;
    },
    modules() {
      if (_integrations && _integrations.getAllModules) {
        // @ts-expect-error TS migration - TS2349
        const mods = _integrations.getAllModules();
        console.log('Modulos disponiveis:', mods.join(', '));
        return mods;
      }
      return [];
    },
    components() {
      // @ts-expect-error TS migration - TS2339
      if (_headerInstance && _headerInstance.componentsLoader) {
        // @ts-expect-error TS migration - TS2339
        const stats = _headerInstance.componentsLoader.getStats();
        console.table([{ loaded: stats.loaded, failed: stats.failed, timeout: stats.timeout, total: stats.total }]);
        return stats;
      }
      return null;
    },
    componentHealth(name: string) {
      // @ts-expect-error TS migration - TS2339
      if (_headerInstance && _headerInstance.componentsLoader) {
        // @ts-expect-error TS migration - TS2339
        const health = _headerInstance.componentsLoader.getSubcomponentsHealth();
        if (name) return health[name];
        console.table(Object.keys(health).map(k => ({
          component: k,
          status: health[k].status
        })));
        return health;
      }
      return null;
    },
    flags() {
      // @ts-expect-error TS migration - TS2349
      const ff = _integrations ? _integrations.getModule('featureFlags') : null;
      if (ff && ff.getAll) {
        const flags = ff.getAll();
        console.table(Object.keys(flags).map(k => ({
          flag: k,
          enabled: flags[k]
        })));
        return flags;
      }
      return null;
    },
    toggleFlag(name: string) {
      // @ts-expect-error TS migration - TS2349
      const ff = _integrations ? _integrations.getModule('featureFlags') : null;
      if (ff && ff.toggle) {
        ff.toggle(name);
        console.log(`Flag ${name} toggled to:`, ff.isEnabled(name));
        return ff.isEnabled(name);
      }
      return null;
    },
    cache() {
      // @ts-expect-error TS migration - TS2349
      const cm = _integrations ? _integrations.getModule('cache') : null;
      if (cm && cm.getStats) {
        const stats = cm.getStats();
        const metrics = cm.getMetrics();
        console.log('Cache:', stats.total, 'entries,', metrics.hitRate, 'hit rate');
        return { stats, metrics };
      }
      return null;
    },
    clearCache() {
      // @ts-expect-error TS migration - TS2349
      const cm = _integrations ? _integrations.getModule('cache') : null;
      if (cm && cm.clear) {
        cm.clear();
        console.log('Cache limpo');
        return true;
      }
      return false;
    },
    circuits() {
      // @ts-expect-error TS migration - TS2349
      const cb = _integrations ? _integrations.getModule('circuitBreaker') : null;
      if (cb && cb.getAllBreakers) {
        const breakers = cb.getAllBreakers();
        console.table(breakers.map((b: unknown) => ({
          // @ts-expect-error TS migration - TS2339
          name: b.componentName,
          // @ts-expect-error TS migration - TS2339
          state: b.state,
          // @ts-expect-error TS migration - TS2339
          failures: b.failures
        })));
        return breakers;
      }
      return null;
    },
    plugins() {
      // @ts-expect-error TS migration - TS2349
      const ps = _integrations ? _integrations.getModule('plugins') : null;
      if (ps && ps.getAllPlugins) {
        const plugins = ps.getAllPlugins();
        console.table(plugins);
        return plugins;
      }
      return null;
    },
    versions() {
      // @ts-expect-error TS migration - TS2349
      const vm = _integrations ? _integrations.getModule('versionManager') : null;
      if (vm && vm.getAllModules) {
        const modules = vm.getAllModules();
        console.table(Object.keys(modules).map(k => ({
          module: k,
          version: modules[k].version
        })));
        return modules;
      }
      return null;
    },
    retry(name: string) {
      // @ts-expect-error TS migration - TS2339
      if (_headerInstance && _headerInstance.componentsLoader) {
        console.log('Retrying component:', name);
        // @ts-expect-error TS migration - TS2339
        return _headerInstance.componentsLoader.retryComponent(name);
      }
      return null;
    },
    refresh() {
      // @ts-expect-error TS migration - TS2339
      if (_headerInstance && _headerInstance.refresh) {
        // @ts-expect-error TS migration - TS2339
        _headerInstance.refresh();
        console.log('Header refresh triggered');
        return true;
      }
      return false;
    },
    debug(enabled: boolean) {
      // @ts-expect-error TS migration - TS2339
      if (_headerInstance && _headerInstance.setDebug) {
        // @ts-expect-error TS migration - TS2339
        _headerInstance.setDebug(enabled !== false);
        console.log('Debug mode:', enabled !== false);
        return true;
      }
      return false;
    },
    metrics() {
      // @ts-expect-error TS migration - TS2339
      if (_headerInstance && _headerInstance.getMetrics) {
        // @ts-expect-error TS migration - TS2339
        const m = _headerInstance.getMetrics();
        console.table([m]);
        return m;
      }
      return null;
    },
    help() {
      console.log('%c[Header DevTools] Comandos disponiveis:', 'color: #2196F3; font-weight: bold;');
      console.log('  .header()       - Instancia do Header');
      console.log('  .health()       - Health check de todos os modulos');
      console.log('  .info()         - Info de todos os modulos');
      console.log('  .modules()      - Lista modulos disponiveis');
      console.log('  .module(name)   - Obter modulo especifico');
      console.log('  .components()   - Status dos componentes');
      console.log('  .componentHealth(name) - Health dos componentes');
      console.log('  .flags()        - Feature flags');
      console.log('  .toggleFlag(n)  - Toggle feature flag');
      console.log('  .cache()        - Stats do cache');
      console.log('  .clearCache()   - Limpar cache');
      console.log('  .circuits()     - Circuit breakers');
      console.log('  .plugins()      - Plugins registrados');
      console.log('  .versions()     - Versoes dos modulos');
      console.log('  .retry(name)    - Recarregar componente');
      console.log('  .refresh()      - Refresh do header');
      console.log('  .debug(bool)    - Ativar/desativar debug');
      console.log('  .metrics()      - Metricas do header');
      console.log('  .help()         - Esta ajuda');
    }
  };
}

function disable() {
  if (typeof window !== 'undefined') {
    delete (window as any).__headerDev;
  }
  _enabled = false;
}

function safeDisable() {
  if (_enabled) {
    disable();
  }
}

function isEnabled() {
  return _enabled;
}

function healthCheck() {
  const checks = { enabled: _enabled, hasHeader: !!_headerInstance, hasIntegrations: !!_integrations, portsInitialized: Ports.isInitialized() };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  return { status: passed === total ? 'HEALTHY' : 'DEGRADED', score: passed, maxScore: total, scoreDisplay: `${passed}/${total}`, checks, version: VERSION, moduleId: MODULE_ID, timestamp: new Date().toISOString() };
}

function info() {
  return { version: VERSION, moduleId: MODULE_ID, enabled: _enabled, hasHeader: !!_headerInstance, hasIntegrations: !!_integrations, portsInitialized: Ports.isInitialized(), healthCheck: healthCheck() };
}

export { init, disable, safeDisable, isEnabled, createDevAPI, healthCheck, info };
export default { VERSION, MODULE_ID, init, disable, safeDisable, isEnabled, healthCheck, info };