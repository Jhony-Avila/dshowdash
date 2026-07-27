const VERSION = "1.0.0-P2-ENTERPRISE";
const MODULE_ID = "app-shell-bundle-analyzer";
const _modules = /* @__PURE__ */ new Map();
const _config = { trackImports: true, analyzeOnLoad: false, warnThreshold: 50 * 1024, criticalThreshold: 100 * 1024 };
let _lastAnalysis = null;
function registerModule(name, info2) {
  info2 = info2 || {};
  _modules.set(name, {
    name,
    size: info2.size || 0,
    gzipSize: info2.gzipSize || null,
    dependencies: info2.dependencies || [],
    loadTime: info2.loadTime || null,
    registeredAt: Date.now()
  });
  return true;
}
function updateModule(name, updates) {
  const existing = _modules.get(name);
  if (!existing) return false;
  Object.assign(existing, updates);
  return true;
}
function unregisterModule(name) {
  return _modules.delete(name);
}
function analyze() {
  let totalSize = 0, totalGzipSize = 0;
  const largeModules = [], criticalModules = [], recommendations = [];
  _modules.forEach((module) => {
    totalSize += module.size;
    if (module.gzipSize) totalGzipSize += module.gzipSize;
    if (module.size >= _config.criticalThreshold) criticalModules.push({ name: module.name, size: module.size });
    else if (module.size >= _config.warnThreshold) largeModules.push({ name: module.name, size: module.size });
  });
  if (criticalModules.length > 0) recommendations.push({ type: "critical", message: `Consider code-splitting for modules over ${Math.round(_config.criticalThreshold / 1024)}KB`, modules: criticalModules.map((m) => m.name) });
  if (largeModules.length > 0) recommendations.push({ type: "warning", message: "Consider tree-shaking or optimization for large modules", modules: largeModules.map((m) => m.name) });
  if (totalSize > 500 * 1024) recommendations.push({ type: "info", message: "Total bundle size exceeds 500KB. Consider lazy loading." });
  const circular = findCircularDependencies();
  if (circular.length > 0) recommendations.push({ type: "error", message: "Circular dependencies detected", cycles: circular });
  const result = {
    moduleCount: _modules.size,
    totalSize,
    totalGzipSize,
    averageSize: _modules.size > 0 ? Math.round(totalSize / _modules.size) : 0,
    largeModules,
    criticalModules,
    recommendations,
    timestamp: Date.now()
  };
  _lastAnalysis = result;
  return result;
}
function getLastAnalysis() {
  return _lastAnalysis ? Object.assign({}, _lastAnalysis) : null;
}
function findCircularDependencies() {
  const cycles = [], visited = /* @__PURE__ */ new Set(), inStack = /* @__PURE__ */ new Set();
  function dfs(node, path) {
    if (inStack.has(node)) {
      cycles.push(path.slice(path.indexOf(node)).concat(node));
      return;
    }
    if (visited.has(node)) return;
    visited.add(node);
    inStack.add(node);
    const module = _modules.get(node);
    if (module && module.dependencies) {
      for (let i = 0; i < module.dependencies.length; i++) {
        dfs(module.dependencies[i], path.concat(node));
      }
    }
    inStack.delete(node);
  }
  _modules.forEach((_, name) => {
    if (!visited.has(name)) dfs(name, []);
  });
  return cycles;
}
function getDependencyTree(moduleName, depth) {
  depth = depth || 3;
  function buildTree(name, currentDepth) {
    if (currentDepth > depth) return null;
    const module = _modules.get(name);
    if (!module) return { name, notFound: true };
    const children = [];
    if (module.dependencies) {
      for (let i = 0; i < module.dependencies.length; i++) {
        const child = buildTree(module.dependencies[i], currentDepth + 1);
        if (child) children.push(child);
      }
    }
    return { name, size: module.size, children: children.length > 0 ? children : void 0 };
  }
  return buildTree(moduleName, 0);
}
function getResourceStats() {
  if (typeof performance === "undefined" || !performance.getEntriesByType) return null;
  const resources = performance.getEntriesByType("resource");
  const breakdown = { script: { count: 0, size: 0 }, stylesheet: { count: 0, size: 0 }, other: { count: 0, size: 0 } };
  for (let i = 0; i < resources.length; i++) {
    const r = resources[i], size = r.transferSize || 0;
    if (r.initiatorType === "script") {
      breakdown.script.count++;
      breakdown.script.size += size;
    } else if (r.initiatorType === "link" || r.initiatorType === "css") {
      breakdown.stylesheet.count++;
      breakdown.stylesheet.size += size;
    } else {
      breakdown.other.count++;
      breakdown.other.size += size;
    }
  }
  return { total: resources.length, breakdown, timestamp: Date.now() };
}
function getModuleInfo(name) {
  const m = _modules.get(name);
  return m ? Object.assign({}, m) : null;
}
function getAllModules() {
  const r = [];
  _modules.forEach((m) => {
    r.push(Object.assign({}, m));
  });
  return r;
}
function configure(options) {
  if (options.trackImports !== void 0) _config.trackImports = !!options.trackImports;
  if (options.analyzeOnLoad !== void 0) _config.analyzeOnLoad = !!options.analyzeOnLoad;
  if (options.warnThreshold !== void 0) _config.warnThreshold = options.warnThreshold;
  if (options.criticalThreshold !== void 0) _config.criticalThreshold = options.criticalThreshold;
}
function getConfig() {
  return Object.assign({}, _config);
}
function reset() {
  _modules.clear();
}
function healthCheck() {
  const analysis = analyze();
  const checks = { noCircular: findCircularDependencies().length === 0, noCritical: analysis.criticalModules.length === 0, reasonableSize: analysis.totalSize < 1024 * 1024 };
  const passed = Object.values(checks).filter(Boolean).length;
  return { status: passed === 3 ? "HEALTHY" : passed >= 1 ? "DEGRADED" : "UNHEALTHY", score: `${passed}/3`, checks, analysis, version: VERSION, moduleId: MODULE_ID, timestamp: Date.now() };
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, moduleCount: _modules.size, config: getConfig(), resourceStats: getResourceStats(), timestamp: Date.now() };
}
var bundle_analyzer_default = { VERSION, MODULE_ID, registerModule, updateModule, unregisterModule, analyze, findCircularDependencies, getDependencyTree, getResourceStats, getModuleInfo, getAllModules, getLastAnalysis, configure, getConfig, reset, healthCheck, info };
export {
  MODULE_ID,
  VERSION,
  analyze,
  configure,
  bundle_analyzer_default as default,
  findCircularDependencies,
  getAllModules,
  getConfig,
  getDependencyTree,
  getLastAnalysis,
  getModuleInfo,
  getResourceStats,
  healthCheck,
  info,
  registerModule,
  reset,
  unregisterModule,
  updateModule
};
