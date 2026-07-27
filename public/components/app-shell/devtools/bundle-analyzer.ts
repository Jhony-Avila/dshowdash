/**
 * @file Bundle Analyzer
 * @version 1.0.0
 * @module app-shell/devtools/bundle-analyzer
 * 
 * ============================================================================
 * DEPENDENCY CONTRACT
 * ============================================================================
 * @requires none (standalone analyzer)
 * 
 * @provides VERSION, MODULE_ID
 * @provides registerModule, updateModule, unregisterModule
 * @provides analyze, findCircularDependencies, getDependencyTree, getResourceStats
 * @provides getModuleInfo, getAllModules
 * @provides configure, getConfig, reset, healthCheck, info
 * 
 * @browserAPI performance.getEntriesByType('resource')
 * 
 * @description
 * Analyzes loaded modules for size, dependencies, and optimization opportunities.
 * Detects circular dependencies, large modules, and provides recommendations.
 * 
 * @example
 * import { registerModule, analyze, findCircularDependencies } from './bundle-analyzer.js';
 * registerModule('my-module', { size: 50000, dependencies: ['dep1'] });
 * const analysis = analyze();
 * ============================================================================
 */
'use strict';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export const VERSION = '1.0.0-P2-ENTERPRISE';
export const MODULE_ID = 'app-shell-bundle-analyzer';

const _modules = new Map();
const _config = { trackImports: true, analyzeOnLoad: false, warnThreshold: 50 * 1024, criticalThreshold: 100 * 1024 };
let _lastAnalysis: DynObj = null;

export function registerModule(name: string, info: DynObj) {
  info = info || {};
  _modules.set(name, {
    name,
    size: info.size || 0,
    gzipSize: info.gzipSize || null,
    dependencies: info.dependencies || [],
    loadTime: info.loadTime || null,
    registeredAt: Date.now()
  });
  return true;
}

export function updateModule(name: string, updates: DynObj) {
  const existing = _modules.get(name);
  if (!existing) return false;
  Object.assign(existing, updates);
  return true;
}

export function unregisterModule(name: string) { return _modules.delete(name); }

export function analyze() {
  let totalSize = 0, totalGzipSize = 0;
  const largeModules: DynObj[] = [], criticalModules: DynObj[] = [], recommendations: DynObj[] = [];

  _modules.forEach(module => {
    totalSize += module.size;
    if (module.gzipSize) totalGzipSize += module.gzipSize;
    if (module.size >= _config.criticalThreshold) criticalModules.push({ name: module.name, size: module.size });
    else if (module.size >= _config.warnThreshold) largeModules.push({ name: module.name, size: module.size });
  });

  if (criticalModules.length > 0) recommendations.push({ type: 'critical', message: `Consider code-splitting for modules over ${Math.round(_config.criticalThreshold / 1024)}KB`, modules: criticalModules.map(m => m.name) });
  if (largeModules.length > 0) recommendations.push({ type: 'warning', message: 'Consider tree-shaking or optimization for large modules', modules: largeModules.map(m => m.name) });
  if (totalSize > 500 * 1024) recommendations.push({ type: 'info', message: 'Total bundle size exceeds 500KB. Consider lazy loading.' });

  const circular = findCircularDependencies();
  if (circular.length > 0) recommendations.push({ type: 'error', message: 'Circular dependencies detected', cycles: circular });

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

export function getLastAnalysis() {
  return _lastAnalysis ? Object.assign({}, _lastAnalysis) : null;
}

export function findCircularDependencies() {
  const cycles: DynObj[] = [], visited = new Set(), inStack = new Set();

  function dfs(node: HTMLElement, path: DynObj) {
    if (inStack.has(node)) { cycles.push(path.slice(path.indexOf(node)).concat(node)); return; }
    if (visited.has(node)) return;
    visited.add(node); inStack.add(node);
    const module = _modules.get(node);
    if (module && module.dependencies) {
      for (let i = 0; i < module.dependencies.length; i++) {
        dfs(module.dependencies[i], path.concat(node));
      }
    }
    inStack.delete(node);
  }

  _modules.forEach((_, name) => { if (!visited.has(name)) dfs(name, []); });
  return cycles;
}

export function getDependencyTree(moduleName: string, depth: number) {
  depth = depth || 3;
  function buildTree(name: string, currentDepth: DynObj): DynObj  {
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
    return { name, size: module.size, children: children.length > 0 ? children : undefined };
  }
  return buildTree(moduleName, 0);
}

export function getResourceStats() {
  if (typeof performance === 'undefined' || !performance.getEntriesByType) return null;
  const resources = performance.getEntriesByType('resource');
  const breakdown = { script: { count: 0, size: 0 }, stylesheet: { count: 0, size: 0 }, other: { count: 0, size: 0 } };
  for (let i = 0; i < resources.length; i++) {
    const r = resources[i] as any, size = r.transferSize || 0;
    if (r.initiatorType === 'script') { breakdown.script.count++; breakdown.script.size += size; }
    else if (r.initiatorType === 'link' || r.initiatorType === 'css') { breakdown.stylesheet.count++; breakdown.stylesheet.size += size; }
    else { breakdown.other.count++; breakdown.other.size += size; }
  }
  return { total: resources.length, breakdown, timestamp: Date.now() };
}

export function getModuleInfo(name: string) { const m = _modules.get(name); return m ? Object.assign({}, m) : null; }
export function getAllModules() { const r: DynObj[] = []; _modules.forEach(m => { r.push(Object.assign({}, m)); }); return r; }

export function configure(options: DynObj) {
  if (options.trackImports !== undefined) _config.trackImports = !!options.trackImports;
  if (options.analyzeOnLoad !== undefined) _config.analyzeOnLoad = !!options.analyzeOnLoad;
  if (options.warnThreshold !== undefined) _config.warnThreshold = options.warnThreshold;
  if (options.criticalThreshold !== undefined) _config.criticalThreshold = options.criticalThreshold;
}

export function getConfig() { return Object.assign({}, _config); }
export function reset() { _modules.clear(); }

export function healthCheck() {
  const analysis = analyze();
  const checks = { noCircular: findCircularDependencies().length === 0, noCritical: analysis.criticalModules.length === 0, reasonableSize: analysis.totalSize < 1024 * 1024 };
  const passed = Object.values(checks).filter(Boolean).length;
  return { status: passed === 3 ? 'HEALTHY' : (passed >= 1 ? 'DEGRADED' : 'UNHEALTHY'), score: `${passed}/3`, checks, analysis, version: VERSION, moduleId: MODULE_ID, timestamp: Date.now() };
}

export function info() {
  return { moduleId: MODULE_ID, version: VERSION, moduleCount: _modules.size, config: getConfig(), resourceStats: getResourceStats(), timestamp: Date.now() };
}

export default { VERSION, MODULE_ID, registerModule, updateModule, unregisterModule, analyze, findCircularDependencies, getDependencyTree, getResourceStats, getModuleInfo, getAllModules, getLastAnalysis, configure, getConfig, reset, healthCheck, info };
