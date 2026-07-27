import { createCorePorts } from "/core/runtime/ports-profiles.js";
const VERSION = "1.2.0-P17WI";
const MODULE_ID = "preloader.utils.dependency-graph";
const hasWindow = typeof window !== "undefined";
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
function _log(level, msg, ctx = {}) {
  const logger = _getPort("logger");
  if (!logger) return;
  if (typeof logger[level] === "function") {
    logger[level](msg, { component: MODULE_ID, ...ctx });
  }
}
const _modules = /* @__PURE__ */ new Map();
const _dependencies = /* @__PURE__ */ new Map();
function registerModule(moduleId, config = {}) {
  _initPorts();
  const module = {
    id: moduleId,
    name: config.name || moduleId,
    type: config.type || "module",
    phase: config.phase || "boot",
    critical: config.critical ?? false,
    async: config.async ?? true,
    timeout: config.timeout || 5e3,
    dependencies: config.dependencies || [],
    metadata: config.metadata || {},
    status: "pending",
    loadTime: null
  };
  _modules.set(moduleId, module);
  _dependencies.set(moduleId, new Set(config.dependencies || []));
  _log("debug", "Module registered", { moduleId, dependencies: config.dependencies?.length || 0 });
  return module;
}
function unregisterModule(moduleId) {
  _modules.delete(moduleId);
  _dependencies.delete(moduleId);
  _dependencies.forEach((deps) => deps.delete(moduleId));
}
function getModule(moduleId) {
  return _modules.get(moduleId) || null;
}
function getAllModules() {
  return Array.from(_modules.values());
}
function updateModuleStatus(moduleId, status, loadTime = null) {
  const module = _modules.get(moduleId);
  if (module) {
    module.status = status;
    if (loadTime !== null) {
      module.loadTime = loadTime;
    }
  }
}
function addDependency(moduleId, dependsOn) {
  if (!_dependencies.has(moduleId)) {
    _dependencies.set(moduleId, /* @__PURE__ */ new Set());
  }
  _dependencies.get(moduleId).add(dependsOn);
  const module = _modules.get(moduleId);
  if (module && !module.dependencies.includes(dependsOn)) {
    module.dependencies.push(dependsOn);
  }
}
function removeDependency(moduleId, dependsOn) {
  _dependencies.get(moduleId)?.delete(dependsOn);
  const module = _modules.get(moduleId);
  if (module) {
    module.dependencies = module.dependencies.filter((d) => d !== dependsOn);
  }
}
function getDependencies(moduleId) {
  return Array.from(_dependencies.get(moduleId) || []);
}
function getDependents(moduleId) {
  const dependents = [];
  _dependencies.forEach((deps, id) => {
    if (deps.has(moduleId)) {
      dependents.push(id);
    }
  });
  return dependents;
}
function detectCycles() {
  const visited = /* @__PURE__ */ new Set();
  const recStack = /* @__PURE__ */ new Set();
  const cycles = [];
  const dfs = (moduleId, path = []) => {
    visited.add(moduleId);
    recStack.add(moduleId);
    path.push(moduleId);
    const deps = _dependencies.get(moduleId) || /* @__PURE__ */ new Set();
    for (const dep of deps) {
      if (!visited.has(dep)) {
        const result = dfs(dep, [...path]);
        if (result) return result;
      } else if (recStack.has(dep)) {
        const cycleStart = path.indexOf(dep);
        cycles.push([...path.slice(cycleStart), dep]);
      }
    }
    recStack.delete(moduleId);
    return null;
  };
  for (const [moduleId] of _modules) {
    if (!visited.has(moduleId)) {
      dfs(moduleId);
    }
  }
  return cycles;
}
function getLoadOrder() {
  const order = [];
  const visited = /* @__PURE__ */ new Set();
  const temp = /* @__PURE__ */ new Set();
  const visit = (moduleId) => {
    if (temp.has(moduleId)) {
      _log("warn", "Circular dependency detected", { moduleId });
      return;
    }
    if (visited.has(moduleId)) return;
    temp.add(moduleId);
    const deps = _dependencies.get(moduleId) || /* @__PURE__ */ new Set();
    for (const dep of deps) {
      visit(dep);
    }
    temp.delete(moduleId);
    visited.add(moduleId);
    order.push(moduleId);
  };
  for (const [moduleId] of _modules) {
    visit(moduleId);
  }
  return order;
}
function getParallelGroups() {
  const order = getLoadOrder();
  const levels = /* @__PURE__ */ new Map();
  for (const moduleId of order) {
    const deps = _dependencies.get(moduleId) || /* @__PURE__ */ new Set();
    let maxLevel = -1;
    for (const dep of deps) {
      const depLevel = levels.get(dep) ?? -1;
      maxLevel = Math.max(maxLevel, depLevel);
    }
    levels.set(moduleId, maxLevel + 1);
  }
  const groups = [];
  levels.forEach((level, moduleId) => {
    if (!groups[level]) groups[level] = [];
    groups[level].push(moduleId);
  });
  return groups.filter(Boolean);
}
function getCriticalPath() {
  const order = getLoadOrder();
  const times = /* @__PURE__ */ new Map();
  for (const moduleId of order) {
    const module = _modules.get(moduleId);
    const deps = _dependencies.get(moduleId) || /* @__PURE__ */ new Set();
    let maxDepTime = 0;
    for (const dep of deps) {
      maxDepTime = Math.max(maxDepTime, times.get(dep) || 0);
    }
    times.set(moduleId, maxDepTime + (module?.timeout || 1e3));
  }
  let maxTime = 0;
  let criticalModule = null;
  times.forEach((time, moduleId) => {
    if (time > maxTime) {
      maxTime = time;
      criticalModule = moduleId;
    }
  });
  const path = [];
  let current = criticalModule;
  while (current) {
    path.unshift(current);
    const deps = _dependencies.get(current) || /* @__PURE__ */ new Set();
    let maxDep = null;
    let maxDepTime = 0;
    for (const dep of deps) {
      const depTime = times.get(dep) || 0;
      if (depTime >= maxDepTime) {
        maxDepTime = depTime;
        maxDep = dep;
      }
    }
    current = maxDep;
  }
  return { path, totalTime: maxTime };
}
function toMermaid() {
  const lines = ["graph TD"];
  _modules.forEach((module, id) => {
    const shape = module.critical ? `((${id}))` : `[${id}]`;
    lines.push(`  ${id}${shape}`);
  });
  _dependencies.forEach((deps, moduleId) => {
    deps.forEach((dep) => {
      lines.push(`  ${dep} --> ${moduleId}`);
    });
  });
  return lines.join("\n");
}
function toJSON() {
  return {
    version: VERSION,
    modules: Array.from(_modules.values()),
    dependencies: Array.from(_dependencies.entries()).map(([id, deps]) => ({
      module: id,
      dependsOn: Array.from(deps)
    })),
    analysis: {
      loadOrder: getLoadOrder(),
      parallelGroups: getParallelGroups(),
      criticalPath: getCriticalPath(),
      cycles: detectCycles()
    }
  };
}
function renderGraph(containerId = "dependency-graph") {
  if (typeof document === "undefined") return null;
  let container = document.getElementById(containerId);
  if (!container) {
    container = document.createElement("div");
    container.id = containerId;
    document.body.appendChild(container);
  }
  const modules = getAllModules();
  const groups = getParallelGroups();
  const criticalPath = getCriticalPath();
  container.innerHTML = `
    <style>
      .dep-graph { font-family: system-ui; background: #1a1a1a; color: #fff; padding: 20px; border-radius: 8px; }
      .dep-graph h2 { margin: 0 0 16px; color: #3b82f6; }
      .dep-graph-grid { display: flex; gap: 20px; overflow-x: auto; padding: 10px 0; }
      .dep-graph-level { background: #2a2a2a; padding: 12px; border-radius: 8px; min-width: 150px; }
      .dep-graph-level-title { font-size: 12px; color: #888; margin-bottom: 8px; }
      .dep-graph-module { background: #374151; padding: 8px 12px; border-radius: 4px; margin: 4px 0; font-size: 12px; }
      .dep-graph-module.critical { border-left: 3px solid #ef4444; }
      .dep-graph-module.on-critical-path { border-left: 3px solid #f59e0b; }
      .dep-graph-stats { margin-top: 16px; padding-top: 16px; border-top: 1px solid #333; }
      .dep-graph-stat { display: inline-block; margin-right: 20px; }
      .dep-graph-stat-label { color: #888; font-size: 12px; }
      .dep-graph-stat-value { font-size: 18px; font-weight: bold; color: #3b82f6; }
    </style>
    <div class="dep-graph">
      <h2>\u{1F4CA} Boot Dependency Graph</h2>
      <div class="dep-graph-grid">
        ${groups.map((group, level) => `
          <div class="dep-graph-level">
            <div class="dep-graph-level-title">Level ${level}</div>
            ${group.map((moduleId) => {
    const module = _modules.get(moduleId);
    const isCritical = module?.critical;
    const onCriticalPath = criticalPath.path.includes(moduleId);
    return `<div class="dep-graph-module ${isCritical ? "critical" : ""} ${onCriticalPath ? "on-critical-path" : ""}">${moduleId}</div>`;
  }).join("")}
          </div>
        `).join("")}
      </div>
      <div class="dep-graph-stats">
        <div class="dep-graph-stat">
          <div class="dep-graph-stat-label">Modules</div>
          <div class="dep-graph-stat-value">${modules.length}</div>
        </div>
        <div class="dep-graph-stat">
          <div class="dep-graph-stat-label">Levels</div>
          <div class="dep-graph-stat-value">${groups.length}</div>
        </div>
        <div class="dep-graph-stat">
          <div class="dep-graph-stat-label">Critical Path</div>
          <div class="dep-graph-stat-value">${criticalPath.path.length}</div>
        </div>
        <div class="dep-graph-stat">
          <div class="dep-graph-stat-label">Est. Time</div>
          <div class="dep-graph-stat-value">${(criticalPath.totalTime / 1e3).toFixed(1)}s</div>
        </div>
      </div>
    </div>
  `;
  return container;
}
function clear() {
  _modules.clear();
  _dependencies.clear();
}
function getStatus() {
  return {
    version: VERSION,
    moduleId: MODULE_ID,
    moduleCount: _modules.size,
    hasCycles: detectCycles().length > 0,
    portsInitialized: Ports.isInitialized()
  };
}
function healthCheck() {
  return { status: Ports.isInitialized() ? "HEALTHY" : "DEGRADED", moduleId: MODULE_ID, version: VERSION, portsInitialized: Ports.isInitialized(), timestamp: Date.now() };
}
function info() {
  return {
    version: VERSION,
    moduleId: MODULE_ID,
    features: ["module-registration", "cycle-detection", "load-order", "parallel-groups", "critical-path", "mermaid-export", "ui-render"],
    portsInitialized: Ports.isInitialized(),
    status: getStatus()
  };
}
var dependency_graph_default = {
  VERSION,
  MODULE_ID,
  registerModule,
  unregisterModule,
  getModule,
  getAllModules,
  updateModuleStatus,
  addDependency,
  removeDependency,
  getDependencies,
  getDependents,
  detectCycles,
  getLoadOrder,
  getParallelGroups,
  getCriticalPath,
  toMermaid,
  toJSON,
  renderGraph,
  clear,
  getStatus,
  healthCheck,
  info,
  injectPorts,
  getPorts
};
export {
  MODULE_ID,
  VERSION,
  addDependency,
  clear,
  dependency_graph_default as default,
  detectCycles,
  getAllModules,
  getCriticalPath,
  getDependencies,
  getDependents,
  getLoadOrder,
  getModule,
  getParallelGroups,
  getPorts,
  getStatus,
  healthCheck,
  info,
  injectPorts,
  registerModule,
  removeDependency,
  renderGraph,
  toJSON,
  toMermaid,
  unregisterModule,
  updateModuleStatus
};
