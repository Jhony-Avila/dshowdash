import { createUiPorts } from "/core/runtime/ports-profiles.js";
const VERSION = "1.1.0-ES6";
const MODULE_ID = "header/core/manifest-audit";
const Ports = createUiPorts({ moduleId: MODULE_ID });
let _initialized = false;
function _initPorts() {
  if (_initialized) return;
  Ports.init();
  _initialized = true;
}
function _getPort(name) {
  _initPorts();
  return Ports.get(name);
}
function _log(level, msg, data) {
  const logger = _getPort("logger");
  if (!logger) return;
  const prefix = "[" + MODULE_ID + "]";
  if (level === "error") {
    logger.error && logger.error(prefix, msg, data || "");
  } else if (level === "warn") {
    logger.warn && logger.warn(prefix, msg, data || "");
  } else if (level === "info") {
    logger.info && logger.info(prefix, msg, data || "");
  } else {
    const config = _getPort("config");
    if (config && config.app && config.app.debug) {
      logger.debug && logger.debug(prefix, msg, data || "");
    }
  }
}
function _emitTelemetry(action, data) {
  const telemetry = _getPort("telemetry");
  if (telemetry && telemetry.track) {
    telemetry.track(MODULE_ID + ":" + action, data);
  }
}
let _lastAuditResult = null;
const _metrics = {
  auditCount: 0,
  lastAuditAt: null,
  driftDetected: false,
  missingInDisk: 0,
  missingInManifest: 0
};
const IGNORED_DIRS = ["_base", "node_modules", ".git"];
const IGNORED_FILES = ["index.js", "manifest.json", "README.md", "ATENCAO.txt"];
function loadManifest() {
  return import("../components/manifest.json").then(function(module) {
    return module.default || module;
  }).catch(function(error) {
    _log("warn", "Falha ao carregar manifest via import, tentando fetch");
    return fetch("/components/header/components/manifest.json").then(function(response) {
      if (!response.ok) throw new Error("HTTP " + response.status);
      return response.json();
    });
  });
}
function getManifestComponents(manifest) {
  if (!manifest) return [];
  if (Array.isArray(manifest.components)) {
    return manifest.components.map(function(c) {
      return c.key || c.component_key || c.name || c.id;
    }).filter(Boolean);
  }
  if (Array.isArray(manifest)) {
    return manifest.map(function(c) {
      return c.key || c.component_key || c.name || c.id;
    }).filter(Boolean);
  }
  if (manifest.items && Array.isArray(manifest.items)) {
    return manifest.items.map(function(c) {
      return c.key || c.component_key || c.name || c.id;
    }).filter(Boolean);
  }
  return [];
}
function getDiskComponents(componentsLoader) {
  if (!componentsLoader) {
    _log("warn", "ComponentsLoader n\xE3o dispon\xEDvel para auditoria de disco");
    return [];
  }
  if (componentsLoader.componentsList && Array.isArray(componentsLoader.componentsList)) {
    return componentsLoader.componentsList.map(function(c) {
      return c.name || c.key;
    }).filter(Boolean);
  }
  if (componentsLoader.components instanceof Map) {
    return Array.from(componentsLoader.components.keys());
  }
  return [];
}
function detectDrift(manifestComponents, diskComponents) {
  const missingInDisk = [];
  const missingInManifest = [];
  const matched = [];
  manifestComponents.forEach(function(comp) {
    if (diskComponents.indexOf(comp) === -1) {
      missingInDisk.push(comp);
    } else {
      matched.push(comp);
    }
  });
  diskComponents.forEach(function(comp) {
    if (manifestComponents.indexOf(comp) === -1) {
      missingInManifest.push(comp);
    }
  });
  const hasDrift = missingInDisk.length > 0 || missingInManifest.length > 0;
  return {
    hasDrift,
    // @ts-expect-error strict migration — TS7005
    missingInDisk,
    // @ts-expect-error strict migration — TS7005
    missingInManifest,
    // @ts-expect-error strict migration — TS7005
    matched,
    // @ts-expect-error TS migration - TS2339
    manifestCount: manifestComponents.length,
    // @ts-expect-error TS migration - TS2339
    diskCount: diskComponents.length,
    matchedCount: matched.length
  };
}
function runAudit(componentsLoader) {
  _initPorts();
  _metrics.auditCount++;
  _metrics.lastAuditAt = Date.now();
  return loadManifest().then(function(manifest) {
    const manifestComponents = getManifestComponents(manifest);
    const diskComponents = getDiskComponents(componentsLoader);
    const driftResult = detectDrift(manifestComponents, diskComponents);
    _lastAuditResult = {
      timestamp: Date.now(),
      manifest: manifestComponents,
      disk: diskComponents,
      drift: driftResult,
      manifestVersion: manifest.version || "unknown"
    };
    _metrics.driftDetected = driftResult.hasDrift;
    _metrics.missingInDisk = driftResult.missingInDisk.length;
    _metrics.missingInManifest = driftResult.missingInManifest.length;
    if (driftResult.hasDrift) {
      _log("warn", "Drift detectado no manifest", {
        missingInDisk: driftResult.missingInDisk,
        missingInManifest: driftResult.missingInManifest
      });
      _emitTelemetry("drift-detected", {
        missingInDisk: driftResult.missingInDisk.length,
        missingInManifest: driftResult.missingInManifest.length
      });
    } else {
      _log("info", "Manifest sincronizado com disco", {
        matchedCount: driftResult.matchedCount
      });
    }
    return _lastAuditResult;
  }).catch(function(error) {
    _log("error", "Erro na auditoria de manifest", { error: error.message });
    _lastAuditResult = {
      timestamp: Date.now(),
      error: error.message,
      drift: { hasDrift: false, missingInDisk: [], missingInManifest: [], matched: [] }
    };
    return _lastAuditResult;
  });
}
function getLastAuditResult() {
  return _lastAuditResult;
}
function injectPorts(p) {
  return Ports.inject(p);
}
function getPorts() {
  return Ports.snapshot();
}
function getMetrics() {
  return Object.assign({}, _metrics);
}
function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    portsInitialized: Ports.isInitialized(),
    metrics: getMetrics(),
    lastAuditResult: _lastAuditResult
  };
}
function healthCheck() {
  const checks = {
    auditRan: _metrics.auditCount > 0,
    noDrift: !_metrics.driftDetected,
    noMissingInDisk: _metrics.missingInDisk === 0,
    portsInitialized: Ports.isInitialized()
  };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  return {
    status: passed === total ? "HEALTHY" : passed >= total - 1 ? "DEGRADED" : "UNHEALTHY",
    score: passed,
    maxScore: total,
    scoreDisplay: passed + "/" + total,
    checks,
    version: VERSION,
    moduleId: MODULE_ID,
    driftDetected: _metrics.driftDetected,
    portsInitialized: Ports.isInitialized()
  };
}
var manifest_audit_default = {
  VERSION,
  MODULE_ID,
  loadManifest,
  getManifestComponents,
  getDiskComponents,
  detectDrift,
  runAudit,
  getLastAuditResult,
  getMetrics,
  info,
  healthCheck,
  injectPorts,
  getPorts
};
export {
  MODULE_ID,
  VERSION,
  manifest_audit_default as default,
  detectDrift,
  getDiskComponents,
  getLastAuditResult,
  getManifestComponents,
  getMetrics,
  getPorts,
  healthCheck,
  info,
  injectPorts,
  loadManifest,
  runAudit
};
