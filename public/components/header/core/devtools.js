import { createCorePorts } from "/core/runtime/ports-profiles.js";
const VERSION = "1.4.0-ES6";
const MODULE_ID = "header/core/devtools";
const Ports = createCorePorts({ moduleId: MODULE_ID });
function _initPorts() {
  Ports.init();
}
function _getPort(name) {
  return Ports.get(name);
}
function injectPorts(p) {
  return Ports.inject(p);
}
function getPorts() {
  return Ports.snapshot();
}
let _headerInstance = null;
let _integrations = null;
let _enabled = false;
function init(headerInstance, integrations) {
  _initPorts();
  _headerInstance = headerInstance;
  _integrations = integrations;
  _enabled = true;
  if (typeof window !== "undefined") {
    window.__headerDev = createDevAPI();
    console.log("%c[Header DevTools] Ativado! Use (window as any).__headerDev para inspecionar.", "color: #4CAF50; font-weight: bold;");
  }
}
function createDevAPI() {
  return {
    version: VERSION,
    header() {
      return _headerInstance;
    },
    integrations() {
      return _integrations;
    },
    health() {
      const results = {};
      if (_headerInstance && _headerInstance.healthCheck) results.header = _headerInstance.healthCheck();
      if (_integrations && _integrations.healthCheck) results.integrations = _integrations.healthCheck();
      if (_headerInstance && _headerInstance.componentsLoader) results.components = _headerInstance.componentsLoader.healthCheck();
      console.table(Object.keys(results).map((k) => ({
        module: k,
        status: results[k].status,
        score: results[k].scoreDisplay
      })));
      return results;
    },
    info() {
      const results = {};
      if (_headerInstance && _headerInstance.info) results.header = _headerInstance.info();
      if (_integrations && _integrations.info) results.integrations = _integrations.info();
      return results;
    },
    module(name) {
      if (_integrations && _integrations.getModule) return _integrations.getModule(name);
      return null;
    },
    modules() {
      if (_integrations && _integrations.getAllModules) {
        const mods = _integrations.getAllModules();
        console.log("Modulos disponiveis:", mods.join(", "));
        return mods;
      }
      return [];
    },
    components() {
      if (_headerInstance && _headerInstance.componentsLoader) {
        const stats = _headerInstance.componentsLoader.getStats();
        console.table([{ loaded: stats.loaded, failed: stats.failed, timeout: stats.timeout, total: stats.total }]);
        return stats;
      }
      return null;
    },
    componentHealth(name) {
      if (_headerInstance && _headerInstance.componentsLoader) {
        const health = _headerInstance.componentsLoader.getSubcomponentsHealth();
        if (name) return health[name];
        console.table(Object.keys(health).map((k) => ({
          component: k,
          status: health[k].status
        })));
        return health;
      }
      return null;
    },
    flags() {
      const ff = _integrations ? _integrations.getModule("featureFlags") : null;
      if (ff && ff.getAll) {
        const flags = ff.getAll();
        console.table(Object.keys(flags).map((k) => ({
          flag: k,
          enabled: flags[k]
        })));
        return flags;
      }
      return null;
    },
    toggleFlag(name) {
      const ff = _integrations ? _integrations.getModule("featureFlags") : null;
      if (ff && ff.toggle) {
        ff.toggle(name);
        console.log(`Flag ${name} toggled to:`, ff.isEnabled(name));
        return ff.isEnabled(name);
      }
      return null;
    },
    cache() {
      const cm = _integrations ? _integrations.getModule("cache") : null;
      if (cm && cm.getStats) {
        const stats = cm.getStats();
        const metrics = cm.getMetrics();
        console.log("Cache:", stats.total, "entries,", metrics.hitRate, "hit rate");
        return { stats, metrics };
      }
      return null;
    },
    clearCache() {
      const cm = _integrations ? _integrations.getModule("cache") : null;
      if (cm && cm.clear) {
        cm.clear();
        console.log("Cache limpo");
        return true;
      }
      return false;
    },
    circuits() {
      const cb = _integrations ? _integrations.getModule("circuitBreaker") : null;
      if (cb && cb.getAllBreakers) {
        const breakers = cb.getAllBreakers();
        console.table(breakers.map((b) => ({
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
      const ps = _integrations ? _integrations.getModule("plugins") : null;
      if (ps && ps.getAllPlugins) {
        const plugins = ps.getAllPlugins();
        console.table(plugins);
        return plugins;
      }
      return null;
    },
    versions() {
      const vm = _integrations ? _integrations.getModule("versionManager") : null;
      if (vm && vm.getAllModules) {
        const modules = vm.getAllModules();
        console.table(Object.keys(modules).map((k) => ({
          module: k,
          version: modules[k].version
        })));
        return modules;
      }
      return null;
    },
    retry(name) {
      if (_headerInstance && _headerInstance.componentsLoader) {
        console.log("Retrying component:", name);
        return _headerInstance.componentsLoader.retryComponent(name);
      }
      return null;
    },
    refresh() {
      if (_headerInstance && _headerInstance.refresh) {
        _headerInstance.refresh();
        console.log("Header refresh triggered");
        return true;
      }
      return false;
    },
    debug(enabled) {
      if (_headerInstance && _headerInstance.setDebug) {
        _headerInstance.setDebug(enabled !== false);
        console.log("Debug mode:", enabled !== false);
        return true;
      }
      return false;
    },
    metrics() {
      if (_headerInstance && _headerInstance.getMetrics) {
        const m = _headerInstance.getMetrics();
        console.table([m]);
        return m;
      }
      return null;
    },
    help() {
      console.log("%c[Header DevTools] Comandos disponiveis:", "color: #2196F3; font-weight: bold;");
      console.log("  .header()       - Instancia do Header");
      console.log("  .health()       - Health check de todos os modulos");
      console.log("  .info()         - Info de todos os modulos");
      console.log("  .modules()      - Lista modulos disponiveis");
      console.log("  .module(name)   - Obter modulo especifico");
      console.log("  .components()   - Status dos componentes");
      console.log("  .componentHealth(name) - Health dos componentes");
      console.log("  .flags()        - Feature flags");
      console.log("  .toggleFlag(n)  - Toggle feature flag");
      console.log("  .cache()        - Stats do cache");
      console.log("  .clearCache()   - Limpar cache");
      console.log("  .circuits()     - Circuit breakers");
      console.log("  .plugins()      - Plugins registrados");
      console.log("  .versions()     - Versoes dos modulos");
      console.log("  .retry(name)    - Recarregar componente");
      console.log("  .refresh()      - Refresh do header");
      console.log("  .debug(bool)    - Ativar/desativar debug");
      console.log("  .metrics()      - Metricas do header");
      console.log("  .help()         - Esta ajuda");
    }
  };
}
function disable() {
  if (typeof window !== "undefined") {
    delete window.__headerDev;
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
  return { status: passed === total ? "HEALTHY" : "DEGRADED", score: passed, maxScore: total, scoreDisplay: `${passed}/${total}`, checks, version: VERSION, moduleId: MODULE_ID, timestamp: (/* @__PURE__ */ new Date()).toISOString() };
}
function info() {
  return { version: VERSION, moduleId: MODULE_ID, enabled: _enabled, hasHeader: !!_headerInstance, hasIntegrations: !!_integrations, portsInitialized: Ports.isInitialized(), healthCheck: healthCheck() };
}
var devtools_default = { VERSION, MODULE_ID, init, disable, safeDisable, isEnabled, healthCheck, info };
export {
  MODULE_ID,
  VERSION,
  createDevAPI,
  devtools_default as default,
  disable,
  getPorts,
  healthCheck,
  info,
  init,
  injectPorts,
  isEnabled,
  safeDisable
};
