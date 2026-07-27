import { createUiPorts } from "/core/runtime/ports-profiles.js";
import { isStrict, recordViolation } from "/core/runtime/enterprise/strict-mode.js";
import { waitForAuth as bridgeWaitForAuth, waitForAppShell as bridgeWaitForAppShell } from "/core/runtime/boot-ready-dom-bridge.js";
import { findRegion, REGION_IDS } from "/platform/shell/layout-regions.js";
const VERSION = "1.10.0-REGION-RESOLVER";
const MODULE_ID = "header-core-auto-init";
const Ports = createUiPorts({ moduleId: MODULE_ID });
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
const _metrics = { autoInits: 0, authWaits: 0, readyFlagsUsed: false, bridgeUsed: false };
const _integrationsStatus = { appShellConnected: false };
function log(level, ...args) {
  const L = _getPort("logger");
  if (L && L[level]) L[level].apply(L, [`[${MODULE_ID}]`].concat(args));
}
function _isAppShellReadyFlag() {
  return typeof window !== "undefined" && window.AppShellReady === true;
}
function waitForAuth() {
  _metrics.authWaits++;
  _initPorts();
  const rf = _getPort("readyFlags");
  if (rf && rf.waitFor) {
    _metrics.readyFlagsUsed = true;
    log("debug", "Using ReadyFlags.waitFor(auth) via port - exclusive path");
    return rf.waitFor("auth", 8e3).then((ready) => {
      if (ready) return true;
      log("warn", "ReadyFlags.waitFor(auth) timeout");
      return document.body.dataset.authReady === "true";
    });
  }
  if (document.body.dataset.authReady === "true") return Promise.resolve(true);
  log("debug", "ReadyFlags not available - using boot-ready-dom-bridge");
  _metrics.bridgeUsed = true;
  return bridgeWaitForAuth(1e4);
}
function waitForAppShell() {
  _initPorts();
  const rf = _getPort("readyFlags");
  const appShell = _getPort("appShell");
  if (rf && rf.waitFor) {
    log("debug", "Using ReadyFlags.waitFor(appshell) via port - exclusive path");
    return rf.waitFor("appshell", 8e3).then((ready) => {
      if (ready) return true;
      log("warn", "ReadyFlags.waitFor(appshell) timeout");
      return _isAppShellReadyFlag() || appShell && appShell.isReady && appShell.isReady();
    });
  }
  if (_isAppShellReadyFlag() || appShell && appShell.isReady && appShell.isReady()) return Promise.resolve(true);
  log("debug", "ReadyFlags not available - using boot-ready-dom-bridge for appshell");
  _metrics.bridgeUsed = true;
  return bridgeWaitForAppShell(1e4);
}
function autoInit(mountFn) {
  _metrics.autoInits++;
  log("info", "Aguardando auth e appshell...");
  return Promise.all([waitForAuth(), waitForAppShell()]).then(() => {
    log("info", "Auth e AppShell confirmados, auto-inicializando...");
    let container = null;
    let source = "none";
    const appShell = _getPort("appShell");
    if (appShell && appShell.region) {
      _integrationsStatus.appShellConnected = true;
      container = appShell.region("header");
      if (container) {
        source = "appshell-region";
        log("info", "Container via AppShell.region(header)");
      }
    }
    if (!container) {
      container = document.getElementById("header-container");
      if (container) {
        source = "legacy-container";
        log("info", "Container via legacy header-container");
      }
    }
    if (!container) {
      container = findRegion(REGION_IDS.HEADER);
      if (container) {
        source = "region-resolver";
        log("info", "Container via Region Resolver Service");
      }
    }
    if (container) {
      log("info", `Container encontrado (source: ${source})`);
      return mountFn(container).catch((err) => {
        log("error", "Erro no auto-init:", err);
      });
    } else {
      log("error", "Container n\xE3o encontrado - Header n\xE3o ser\xE1 montado");
    }
  });
}
function setupAutoInit(mountFn) {
  _initPorts();
  const rf = _getPort("readyFlags");
  const appShell = _getPort("appShell");
  const isShellReady = rf && rf.isReady && rf.isReady("appshell") || _isAppShellReadyFlag() || appShell && appShell.isReady && appShell.isReady();
  if (isShellReady) {
    log("info", "AppShell j\xE1 ready, inicializando Header imediatamente");
    setTimeout(() => {
      autoInit(mountFn);
    }, 0);
    return;
  }
  if (rf && rf.waitFor) {
    log("info", "Usando ReadyFlags.waitFor(appshell) via port - caminho exclusivo");
    rf.waitFor("appshell", 8e3).then(() => {
      autoInit(mountFn);
    });
    return;
  }
  log("info", "ReadyFlags n\xE3o dispon\xEDvel - usando boot-ready-dom-bridge");
  _metrics.bridgeUsed = true;
  bridgeWaitForAppShell(1e4).then(() => {
    autoInit(mountFn);
  });
}
function registerWindowGlobals(createHeaderFn, mountFn, getInstanceFn) {
  if (typeof window !== "undefined") {
    if (!isStrict()) {
      window.Header = {
        createHeader: createHeaderFn,
        mount: mountFn,
        getHeaderInstance: getInstanceFn,
        VERSION,
        MODULE_ID,
        getVersion() {
          return VERSION;
        }
      };
    } else {
      recordViolation("GLOBAL_EXPOSURE_BLOCKED", { module: MODULE_ID, property: "window.Header" });
    }
  }
}
function getMetrics() {
  return Object.assign({}, _metrics);
}
function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    integrations: _integrationsStatus,
    metrics: getMetrics(),
    readyFlagsUsed: _metrics.readyFlagsUsed,
    bridgeUsed: _metrics.bridgeUsed,
    portsInitialized: Ports.isInitialized(),
    p18EventBusOnly: true
  };
}
function healthCheck() {
  return {
    status: Ports.isInitialized() ? "HEALTHY" : "DEGRADED",
    version: VERSION,
    moduleId: MODULE_ID,
    portsInitialized: Ports.isInitialized(),
    checks: { autoInitReady: true, readyFlagsUsed: _metrics.readyFlagsUsed, bridgeUsed: _metrics.bridgeUsed },
    metrics: getMetrics(),
    p18EventBusOnly: true
  };
}
var auto_init_default = { waitForAuth, autoInit, setupAutoInit, registerWindowGlobals, getMetrics, info, healthCheck, injectPorts, getPorts };
export {
  MODULE_ID,
  VERSION,
  autoInit,
  auto_init_default as default,
  getMetrics,
  getPorts,
  healthCheck,
  info,
  injectPorts,
  registerWindowGlobals,
  setupAutoInit,
  waitForAuth
};
