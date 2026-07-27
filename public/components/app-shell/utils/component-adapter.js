import { createCorePorts } from "/core/runtime/ports-profiles.js";
import { SHELL_EVENTS } from "/core/runtime/events/catalog/shell.events.js";
import { BOOT_EVENTS } from "/core/runtime/events/catalog/boot.events.js";
import { isStrict } from "/core/runtime/enterprise/strict-mode.js";
const VERSION = "3.7.0-P2-ENTERPRISE";
const MODULE_ID = "app-shell-component-adapter";
const DEPRECATED = true;
const REMOVAL_DATE = "2025-06-30";
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
const COMPONENT_REGION_MAP = Object.freeze({
  header: { region: "header", legacyId: "header-container" },
  sidebar: { region: "sidebar", legacyId: "sidebar-root" },
  footer: { region: "footer", legacyId: "footer-root" },
  preloader: { region: "preloader", legacyId: "preloader-root" },
  main: { region: "main", legacyId: "app-container" },
  login: { region: "login", legacyId: "login-container" },
  toast: { region: "toast", legacyId: "toast-container" }
});
const STRICT_COMPONENTS = Object.freeze(["header", "footer", "sidebar", "main"]);
let _metrics = { getCalls: 0, legacyHits: 0, shellHits: 0, errors: 0, readyFlagsUsed: false, waitCalls: 0, waitResolvedReadyFlags: 0, waitResolvedAppShell: 0, waitResolvedEventBus: 0, waitTimeouts: 0 };
function _trackUsage(action, data) {
  _initPorts();
  data = data || {};
  try {
    const telemetry = _getPort("telemetry");
    const logger = _getPort("logger");
    if (telemetry && telemetry.event) telemetry.event(`${MODULE_ID}:deprecated:${action}`, { deprecated: true, removalDate: REMOVAL_DATE, ...data });
    if (logger && logger.warn) logger.warn(`[DEPRECATED] ${MODULE_ID}:${action} - Use AppShell.region() instead`);
  } catch (e) {
  }
}
function getComponentContainer(componentName, options) {
  _initPorts();
  _metrics.getCalls++;
  _trackUsage("getComponentContainer", { component: componentName });
  const mapping = COMPONENT_REGION_MAP[componentName];
  if (!mapping) {
    _metrics.errors++;
    return null;
  }
  if (typeof window !== "undefined" && window.AppShell && window.AppShell.region) {
    const region = window.AppShell.region(mapping.region);
    if (region) {
      _metrics.shellHits++;
      return region;
    }
  }
  const el = document.getElementById(mapping.legacyId);
  if (el) {
    _metrics.legacyHits++;
    return el;
  }
  _metrics.errors++;
  return null;
}
function isUsingAppShell() {
  _initPorts();
  return !!(typeof window !== "undefined" && window.AppShell && window.AppShell.isReady && window.AppShell.isReady());
}
function getRegionDirectly(regionName) {
  _initPorts();
  _trackUsage("getRegionDirectly", { region: regionName });
  return typeof window !== "undefined" && window.AppShell && window.AppShell.region && window.AppShell.region(regionName) || null;
}
function waitForAppShell(timeout) {
  timeout = timeout || 5e3;
  _initPorts();
  _metrics.waitCalls++;
  _trackUsage("waitForAppShell", { timeoutMs: timeout });
  try {
    const rf = typeof window !== "undefined" && window.ReadyFlags && window.ReadyFlags.waitFor ? window.ReadyFlags : _getPort("readyFlags");
    if (rf && typeof rf.waitFor === "function") {
      _metrics.readyFlagsUsed = true;
      return Promise.resolve(rf.waitFor("appshell", timeout)).then((ready) => {
        if (ready) _metrics.waitResolvedReadyFlags++;
        return !!ready;
      }).catch(() => _waitForViaEventBusOrAppShell(timeout));
    }
  } catch (e) {
  }
  return _waitForViaEventBusOrAppShell(timeout);
}
function _waitForViaEventBusOrAppShell(timeout) {
  try {
    if (typeof window !== "undefined" && window.AppShell && window.AppShell.isReady && window.AppShell.isReady()) {
      _metrics.waitResolvedAppShell++;
      return Promise.resolve(true);
    }
  } catch (e) {
  }
  return _waitForEventBusReady(timeout);
}
function _waitForEventBusReady(timeout) {
  return new Promise((resolve) => {
    let done = false;
    let timer = null;
    function finish(ok) {
      if (done) return;
      done = true;
      try {
        if (timer) clearTimeout(timer);
      } catch (e) {
      }
      try {
        cleanupAll();
      } catch (e) {
      }
      if (!ok) _metrics.waitTimeouts++;
      resolve(!!ok);
    }
    let cleanupAll = () => {
    };
    try {
      let subscribe = function(eventName) {
        if (!eb || !eb.on) return;
        const handler = () => {
          _metrics.waitResolvedEventBus++;
          finish(true);
        };
        const ret = eb.on(eventName, handler);
        if (typeof ret === "function") cleanups.push(ret);
        else if (eb.off) cleanups.push(() => {
          try {
            eb.off(eventName, handler);
          } catch (e) {
          }
        });
      };
      const eb = _getPort("eventBus");
      if (!eb) {
        timer = setTimeout(() => {
          finish(false);
        }, timeout);
        return;
      }
      const cleanups = [];
      subscribe(SHELL_EVENTS.READY);
      subscribe(BOOT_EVENTS.APPSHELL_READY);
      cleanupAll = () => {
        for (let i = 0; i < cleanups.length; i++) try {
          cleanups[i]();
        } catch (e) {
        }
      };
      timer = setTimeout(() => {
        finish(false);
      }, timeout);
    } catch (e) {
      timer = setTimeout(() => {
        finish(false);
      }, timeout);
    }
  });
}
function createMigrationHelper(componentName) {
  _trackUsage("createMigrationHelper", { component: componentName });
  const mapping = COMPONENT_REGION_MAP[componentName];
  return {
    getContainer(opts) {
      return getComponentContainer(componentName, opts);
    },
    isShellAvailable() {
      return isUsingAppShell();
    },
    getRegion() {
      return mapping ? getRegionDirectly(mapping.region) : null;
    },
    getMapping() {
      return mapping ? Object.assign({}, mapping) : null;
    },
    isStrictComponent() {
      return STRICT_COMPONENTS.indexOf(componentName) >= 0;
    }
  };
}
function getStrictComponents() {
  return STRICT_COMPONENTS.slice();
}
function isStrictComponent(name) {
  return STRICT_COMPONENTS.indexOf(name) >= 0;
}
function getMetrics() {
  const ps = Ports.snapshot();
  return Object.assign({}, _metrics, { portsStatus: { initialized: ps._initialized } });
}
function healthCheck() {
  const ps = Ports.snapshot();
  const checks = {
    lowLegacyUsage: _metrics.getCalls === 0 || _metrics.legacyHits / _metrics.getCalls < 0.2,
    migrationReady: _metrics.legacyHits === 0,
    readyFlagsUsed: _metrics.readyFlagsUsed,
    portsInitialized: ps._initialized,
    p03PortsOnly: true
  };
  const passed = Object.values(checks).filter(Boolean).length;
  return {
    status: passed === 5 ? "HEALTHY" : "DEGRADED",
    score: `${passed}/5`,
    checks,
    strictMode: isStrict(),
    deprecated: true,
    removalDate: REMOVAL_DATE,
    p03PortsOnly: true,
    metrics: getMetrics(),
    version: VERSION,
    moduleId: MODULE_ID,
    timestamp: Date.now()
  };
}
function info() {
  const ps = Ports.snapshot();
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    strictMode: isStrict(),
    deprecated: true,
    removalDate: REMOVAL_DATE,
    p03PortsOnly: true,
    components: Object.keys(COMPONENT_REGION_MAP),
    strictComponents: STRICT_COMPONENTS,
    metrics: getMetrics(),
    readyFlagsUsed: _metrics.readyFlagsUsed,
    portsStatus: { initialized: ps._initialized },
    recommendation: "Use AppShell.region() directly",
    timestamp: Date.now()
  };
}
var component_adapter_default = {
  getComponentContainer,
  isUsingAppShell,
  getRegionDirectly,
  waitForAppShell,
  createMigrationHelper,
  getStrictComponents,
  isStrictComponent,
  getMetrics,
  healthCheck,
  info,
  injectPorts,
  getPorts,
  COMPONENT_REGION_MAP,
  DEPRECATED,
  REMOVAL_DATE,
  VERSION,
  MODULE_ID
};
export {
  COMPONENT_REGION_MAP,
  DEPRECATED,
  MODULE_ID,
  REMOVAL_DATE,
  VERSION,
  createMigrationHelper,
  component_adapter_default as default,
  getComponentContainer,
  getMetrics,
  getPorts,
  getRegionDirectly,
  getStrictComponents,
  healthCheck,
  info,
  injectPorts,
  isStrictComponent,
  isUsingAppShell,
  waitForAppShell
};
