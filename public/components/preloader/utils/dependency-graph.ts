// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.2.0-P17WI)
// ═══════════════════════════════════════════════════════════════
// MODULE: preloader.utils.dependency-graph
// PURPOSE: utils   dependency graph
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createCorePorts from /core/runtime/ports-profiles.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   injectPorts() — exported function
//   getPorts() — exported function
//   registerModule() — exported function
//   unregisterModule() — exported function
//   getModule() — exported function
//   getAllModules() — exported function
//   updateModuleStatus() — exported function
//   addDependency() — exported function
//   removeDependency() — exported function
//   getDependencies() — exported function
//   getDependents() — exported function
//   detectCycles() — exported function
//   getLoadOrder() — exported function
//   getParallelGroups() — exported function
//   getCriticalPath() — exported function
//   toMermaid() — exported function
//   toJSON() — exported function
//   renderGraph() — exported function
//   clear() — exported function
//   getStatus() — exported function
//   healthCheck() — exported function
//   info() — exported function
//
// RECEIVES (via init/options): (none)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';
// Boot Dependency Graph v1.2.0-P17WI
// @version 1.2.0-P17WI
// @changelog P17WI - Migração para PortsFactory/PortsProfiles
// Visualiza dependências entre módulos do boot

import { createCorePorts } from '/core/runtime/ports-profiles.js';

export const VERSION = '1.2.0-P17WI';
export const MODULE_ID = 'preloader.utils.dependency-graph';

const hasWindow = typeof window !== 'undefined';

// P17WI PORTS PATTERN
const Ports = createCorePorts({ moduleId: MODULE_ID });
function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
export function injectPorts(p: Record<string, unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

function _log(level: string, msg: string, ctx: Record<string, unknown> = {}) {
  const logger = _getPort('logger');
  if (!logger) return;
  if (typeof logger[level] === 'function') {
    logger[level](msg, { component: MODULE_ID, ...ctx });
  }
}

// Storage
const _modules = new Map();
const _dependencies = new Map();

// MODULE REGISTRATION
export function registerModule(moduleId: string, config: Record<string, any> = {}) {
  _initPorts();
  const module = {
    id: moduleId,
    name: config.name || moduleId,
    type: config.type || 'module',
    phase: config.phase || 'boot',
    critical: config.critical ?? false,
    async: config.async ?? true,
    timeout: config.timeout || 5000,
    dependencies: config.dependencies || [],
    metadata: config.metadata || {},
    status: 'pending',
    loadTime: null as number | null
  };

  _modules.set(moduleId, module);
  _dependencies.set(moduleId, new Set(config.dependencies || []));

  _log('debug', 'Module registered', { moduleId, dependencies: config.dependencies?.length || 0 });
  return module;
}

export function unregisterModule(moduleId: string) {
  _modules.delete(moduleId);
  _dependencies.delete(moduleId);
  _dependencies.forEach(deps => deps.delete(moduleId));
}

export function getModule(moduleId: string) {
  return _modules.get(moduleId) || null;
}

export function getAllModules() {
  return Array.from(_modules.values());
}

export function updateModuleStatus(moduleId: string, status: string, loadTime: number | null = null) {
  const module = _modules.get(moduleId);
  if (module) {
    module.status = status;
    if (loadTime !== null) {
      module.loadTime = loadTime;
    }
  }
}

// DEPENDENCY MANAGEMENT
export function addDependency(moduleId: string, dependsOn: string) {
  if (!_dependencies.has(moduleId)) {
    _dependencies.set(moduleId, new Set());
  }
  _dependencies.get(moduleId).add(dependsOn);

  const module = _modules.get(moduleId);
  if (module && !module.dependencies.includes(dependsOn)) {
    module.dependencies.push(dependsOn);
  }
}

export function removeDependency(moduleId: string, dependsOn: string) {
  _dependencies.get(moduleId)?.delete(dependsOn);
  
  const module = _modules.get(moduleId);
  if (module) {
    module.dependencies = module.dependencies.filter((d: string) => d !== dependsOn);
  }
}

export function getDependencies(moduleId: string) {
  return Array.from(_dependencies.get(moduleId) || []);
}

export function getDependents(moduleId: string) {
  const dependents: string[] = [];
  _dependencies.forEach((deps, id) => {
    if (deps.has(moduleId)) {
      dependents.push(id);
    }
  });
  return dependents;
}

// GRAPH ANALYSIS
export function detectCycles() {
  const visited = new Set();
  const recStack = new Set();
  const cycles: string[][] = [];

  const dfs = (moduleId: string, path: string[] = []): string[] | null => {
    visited.add(moduleId);
    recStack.add(moduleId);
    path.push(moduleId);

    const deps = _dependencies.get(moduleId) || new Set();
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

export function getLoadOrder() {
  const order: string[] = [];
  const visited = new Set<string>();
  const temp = new Set<string>();

  const visit = (moduleId: string) => {
    if (temp.has(moduleId)) {
      _log('warn', 'Circular dependency detected', { moduleId });
      return;
    }
    if (visited.has(moduleId)) return;

    temp.add(moduleId);

    const deps = _dependencies.get(moduleId) || new Set();
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

export function getParallelGroups() {
  const order = getLoadOrder();
  const levels = new Map();

  for (const moduleId of order) {
    const deps = _dependencies.get(moduleId) || new Set();
    let maxLevel = -1;

    for (const dep of deps) {
      const depLevel = levels.get(dep) ?? -1;
      maxLevel = Math.max(maxLevel, depLevel);
    }

    levels.set(moduleId, maxLevel + 1);
  }

  const groups: string[][] = [];
  levels.forEach((level: number, moduleId: string) => {
    if (!groups[level]) groups[level] = [];
    groups[level].push(moduleId);
  });

  return groups.filter(Boolean);
}

export function getCriticalPath() {
  const order = getLoadOrder();
  const times = new Map();

  for (const moduleId of order) {
    const module = _modules.get(moduleId);
    const deps = _dependencies.get(moduleId) || new Set();
    
    let maxDepTime = 0;
    for (const dep of deps) {
      maxDepTime = Math.max(maxDepTime, times.get(dep) || 0);
    }

    times.set(moduleId, maxDepTime + (module?.timeout || 1000));
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
  let current: string | null = criticalModule;

  while (current) {
    path.unshift(current);
    // @ts-expect-error strict migration — TS7022
    const deps = _dependencies.get(current) || new Set();
    let maxDep = null;
    let maxDepTime = 0;

    // @ts-expect-error strict migration — TS7022
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

// VISUALIZATION
export function toMermaid() {
  const lines = ['graph TD'];

  _modules.forEach((module, id) => {
    const shape = module.critical ? `((${id}))` : `[${id}]`;
    lines.push(`  ${id}${shape}`);
  });

  _dependencies.forEach((deps, moduleId) => {
    deps.forEach((dep: string) => {
      lines.push(`  ${dep} --> ${moduleId}`);
    });
  });

  return lines.join('\n');
}

export function toJSON() {
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

export function renderGraph(containerId: string = 'dependency-graph') {
  if (typeof document === 'undefined') return null;

  let container = document.getElementById(containerId);
  if (!container) {
    container = document.createElement('div');
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
      <h2>📊 Boot Dependency Graph</h2>
      <div class="dep-graph-grid">
        ${groups.map((group, level) => `
          <div class="dep-graph-level">
            <div class="dep-graph-level-title">Level ${level}</div>
            ${group.map((moduleId: string) => {
              const module = _modules.get(moduleId);
              const isCritical = module?.critical;
              const onCriticalPath = criticalPath.path.includes(moduleId);
              return `<div class="dep-graph-module ${isCritical ? 'critical' : ''} ${onCriticalPath ? 'on-critical-path' : ''}">${moduleId}</div>`;
            }).join('')}
          </div>
        `).join('')}
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
          <div class="dep-graph-stat-value">${(criticalPath.totalTime / 1000).toFixed(1)}s</div>
        </div>
      </div>
    </div>
  `;

  return container;
}

// RESET
export function clear() {
  _modules.clear();
  _dependencies.clear();
}

// STATUS
export function getStatus() {
  return {
    version: VERSION,
    moduleId: MODULE_ID,
    moduleCount: _modules.size,
    hasCycles: detectCycles().length > 0,
    portsInitialized: Ports.isInitialized()
  };
}

export function healthCheck() {
  return { status: Ports.isInitialized() ? 'HEALTHY' : 'DEGRADED', moduleId: MODULE_ID, version: VERSION, portsInitialized: Ports.isInitialized(), timestamp: Date.now() };
}

export function info() {
  return {
    version: VERSION,
    moduleId: MODULE_ID,
    features: ['module-registration', 'cycle-detection', 'load-order', 'parallel-groups', 'critical-path', 'mermaid-export', 'ui-render'],
    portsInitialized: Ports.isInitialized(),
    status: getStatus()
  };
}

export default {
  VERSION, MODULE_ID,
  registerModule, unregisterModule, getModule, getAllModules, updateModuleStatus,
  addDependency, removeDependency, getDependencies, getDependents,
  detectCycles, getLoadOrder, getParallelGroups, getCriticalPath,
  toMermaid, toJSON, renderGraph, clear,
  getStatus, healthCheck, info,
  injectPorts, getPorts
};
