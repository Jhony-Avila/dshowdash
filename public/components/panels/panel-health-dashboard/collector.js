import { createCorePorts } from "/core/runtime/ports-profiles.js";
import { isStrict, recordViolation } from "/core/runtime/enterprise/strict-mode.js";
const MODULE_ID = "panel-health-dashboard-collector";
const VERSION = "9.3.0-P2-ENTERPRISE";
const _Ports = createCorePorts({ moduleId: MODULE_ID });
const _getPort = (name) => _Ports.get(name);
function _getModule(moduleName) {
  const wa = _getPort("windowAdapter");
  if (wa && typeof wa.get === "function") {
    const mod = wa.get(moduleName);
    if (mod) return mod;
  }
  const _win = window;
  if (typeof window !== "undefined" && _win[moduleName]) {
    if (isStrict()) {
      recordViolation("WINDOW_GLOBAL_ACCESS", { module: MODULE_ID, accessed: moduleName });
      return null;
    }
    recordViolation("WINDOW_GLOBAL_FALLBACK", { module: MODULE_ID, accessed: moduleName });
    return _win[moduleName];
  }
  return null;
}
function _safeHealthCheck(moduleRef, moduleName) {
  const health = { status: "UNAVAILABLE", score: null, version: null, checks: {} };
  if (!moduleRef) return health;
  try {
    if (typeof moduleRef.healthCheck === "function") {
      const hc = moduleRef.healthCheck();
      if (hc && typeof hc.then === "function") {
        return hc.then((result) => _normalizeHealthResult(result, moduleRef)).catch((e) => ({
          status: "UNHEALTHY",
          score: 0,
          version: moduleRef.VERSION || null,
          checks: { error: e.message }
        }));
      }
      return _normalizeHealthResult(hc, moduleRef);
    } else if (typeof moduleRef.getVersion === "function") {
      return { status: "HEALTHY", score: 100, version: moduleRef.getVersion(), checks: { available: true } };
    } else if (moduleRef.VERSION) {
      return { status: "HEALTHY", score: 100, version: moduleRef.VERSION, checks: { available: true } };
    } else {
      return { status: "HEALTHY", score: 100, version: null, checks: { available: true } };
    }
  } catch (e) {
    return { status: "UNHEALTHY", score: 0, version: null, checks: { error: e.message } };
  }
}
function _normalizeHealthResult(hc, moduleRef) {
  if (!hc) return { status: "UNKNOWN", score: null, version: moduleRef.VERSION || null, checks: {} };
  let score = null;
  if (hc.score !== void 0) {
    if (hc.maxScore !== void 0) {
      score = Math.round(hc.score / hc.maxScore * 100);
    } else if (typeof hc.score === "object" && hc.score.percentage !== void 0) {
      score = hc.score.percentage;
    } else if (typeof hc.score === "number") {
      score = hc.score > 1 ? hc.score : Math.round(hc.score * 100);
    }
  }
  return {
    status: hc.status || "UNKNOWN",
    score,
    version: hc.version || moduleRef.VERSION || null,
    checks: hc.checks || {},
    issues: hc.issues || [],
    features: hc.features || null,
    uptime: hc.uptime || null
  };
}
function _countStatus(snapshot, health) {
  snapshot.summary.total++;
  if (health.status === "HEALTHY") snapshot.summary.healthy++;
  else if (health.status === "DEGRADED") snapshot.summary.degraded++;
  else if (health.status === "UNHEALTHY" || health.status === "ERROR") snapshot.summary.unhealthy++;
  else snapshot.summary.unavailable++;
}
function _collectKernelHealth(kernelRef, kernelName) {
  if (!kernelRef) return null;
  try {
    const health = _safeHealthCheck(kernelRef, kernelName);
    if (kernelRef.listFeatures) {
      const featuresResult = kernelRef.listFeatures();
      if (featuresResult && featuresResult.ok && featuresResult.data) {
        health.featuresCount = featuresResult.data.count || 0;
        health.features = featuresResult.data.features || [];
      }
    }
    if (kernelRef.metrics) {
      const metricsResult = kernelRef.metrics();
      if (metricsResult && metricsResult.ok && metricsResult.data) {
        health.metrics = metricsResult.data;
      }
    }
    return health;
  } catch (e) {
    return { status: "UNHEALTHY", score: 0, version: null, checks: { error: e.message } };
  }
}
async function collectHealthData() {
  const snapshot = {
    overallStatus: "HEALTHY",
    overallScore: 100,
    timestamp: Date.now(),
    categories: {
      kernels: {},
      core: {},
      components: {},
      panels: {}
    },
    summary: { healthy: 0, degraded: 0, unhealthy: 0, unavailable: 0, total: 0 }
  };
  const kernelsToCheck = [
    { path: "MainKernel", name: "MainKernel" },
    { path: "SidebarKernel", name: "SidebarKernel" }
  ];
  for (let k = 0; k < kernelsToCheck.length; k++) {
    const kernel = kernelsToCheck[k];
    const kernelRef = _getModule(kernel.path);
    const kernelHealth = _collectKernelHealth(kernelRef, kernel.name);
    if (kernelHealth) {
      snapshot.categories.kernels[kernel.name] = kernelHealth;
      _countStatus(snapshot, kernelHealth);
    } else {
      snapshot.categories.kernels[kernel.name] = { status: "UNAVAILABLE", score: null, version: null };
      snapshot.summary.total++;
      snapshot.summary.unavailable++;
    }
  }
  const coreModules = [
    { path: "Logger", name: "Logger" },
    { path: "EventBus", name: "EventBus" },
    { path: "GlobalState", name: "GlobalState" },
    { path: "CoreAuthAdapter", name: "Auth Adapter" },
    { path: "HealthAggregator", name: "Health Aggregator" },
    { path: "AssetLoader", name: "Asset Loader" },
    { path: "RouterGlobal", name: "Router" }
  ];
  for (let i = 0; i < coreModules.length; i++) {
    const mod = coreModules[i];
    const moduleRef = _getModule(mod.path);
    const health = await _safeHealthCheck(moduleRef, mod.name);
    snapshot.categories.core[mod.name] = health;
    _countStatus(snapshot, health);
  }
  const componentsToCheck = [
    { path: "Header", name: "Header" },
    { path: "Sidebar", name: "Sidebar" },
    { path: "Footer", name: "Footer" },
    { path: "MainComponent", name: "Main" },
    { path: "NavRail", name: "NavRail" },
    { path: "LoginModal", name: "LoginModal" },
    { path: "ModalManagerGlobal", name: "ModalManager" }
  ];
  for (let j = 0; j < componentsToCheck.length; j++) {
    const comp = componentsToCheck[j];
    const compRef = _getModule(comp.path);
    const compHealth = await _safeHealthCheck(compRef, comp.name);
    snapshot.categories.components[comp.name] = compHealth;
    _countStatus(snapshot, compHealth);
  }
  const panelRegistry = _getModule("PanelRegistry") || _getModule("panelRegistry");
  if (panelRegistry && panelRegistry.getAll) {
    try {
      const panels = panelRegistry.getAll();
      for (const panelId in panels) {
        if (!panels.hasOwnProperty(panelId)) continue;
        const panel = panels[panelId];
        let pHealth = { status: "UNAVAILABLE", score: null, version: null };
        if (panel && panel.healthCheck) {
          try {
            const phc = await panel.healthCheck();
            pHealth = _normalizeHealthResult(phc, panel);
          } catch (pe) {
            pHealth = { status: "UNHEALTHY", score: 0, version: panel.VERSION || null, checks: { error: pe.message } };
          }
        } else if (panel && panel.mounted) {
          pHealth = { status: "HEALTHY", score: 100, version: panel.VERSION || null };
        }
        snapshot.categories.panels[panelId] = pHealth;
        _countStatus(snapshot, pHealth);
      }
    } catch (re) {
      snapshot.categories.panels._error = { status: "ERROR", message: re.message };
    }
  }
  const summary = snapshot.summary;
  if (summary.total > 0) {
    const healthyPercent = summary.healthy / summary.total * 100;
    snapshot.overallScore = Math.round(healthyPercent);
    if (summary.unhealthy > 0) {
      snapshot.overallStatus = "UNHEALTHY";
    } else if (summary.degraded > 0 || summary.unavailable > summary.total * 0.3) {
      snapshot.overallStatus = "DEGRADED";
    } else if (summary.healthy < summary.total) {
      snapshot.overallStatus = "DEGRADED";
    } else {
      snapshot.overallStatus = "HEALTHY";
    }
  }
  return snapshot;
}
function getKernelStatus() {
  const result = { main: null, sidebar: null };
  const MainKernel = _getModule("MainKernel");
  if (MainKernel && MainKernel.healthCheck) {
    try {
      const mainHc = MainKernel.healthCheck();
      result.main = {
        status: mainHc.status,
        score: mainHc.score && mainHc.score.percentage ? mainHc.score.percentage : mainHc.score,
        version: mainHc.version || MainKernel.VERSION,
        features: mainHc.features ? Object.keys(mainHc.features).length : 0
      };
    } catch (e) {
      result.main = { status: "ERROR", error: e.message };
    }
  }
  const SidebarKernel = _getModule("SidebarKernel");
  if (SidebarKernel && SidebarKernel.healthCheck) {
    try {
      const sidebarHc = SidebarKernel.healthCheck();
      result.sidebar = {
        status: sidebarHc.status,
        score: sidebarHc.score && sidebarHc.score.percentage ? sidebarHc.score.percentage : sidebarHc.score,
        version: sidebarHc.version || SidebarKernel.VERSION,
        features: sidebarHc.features ? Object.keys(sidebarHc.features).length : 0
      };
    } catch (e) {
      result.sidebar = { status: "ERROR", error: e.message };
    }
  }
  return result;
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: _Ports.isInitialized() ? "HEALTHY" : "DEGRADED", moduleId: MODULE_ID, version: VERSION, timestamp: Date.now() };
}
var collector_default = {
  MODULE_ID,
  VERSION,
  collectHealthData,
  getKernelStatus,
  info,
  healthCheck
};
export {
  MODULE_ID,
  VERSION,
  collectHealthData,
  collector_default as default,
  getKernelStatus,
  healthCheck,
  info
};
