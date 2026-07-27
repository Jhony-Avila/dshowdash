// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v1.2.0-ES6)
// ═══════════════════════════════════════════════════════════════
// MODULE: header/core/lazy-loader
// PURPOSE: Lazy/eager region-based component loading with IntersectionObserver
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createCorePorts from /core/runtime/ports-profiles.js
//   SELECTORS, CRITICALITY from ./constants.js
// PROVIDES:
//   init(componentsLoader, config) — initialize lazy loader
//   loadRegion(regionName) — load all components in a region
//   loadAll(options) — load all regions in priority order
//   lazyLoad(componentName) — lazy load a single component
//   preloadRegion(regionName) — preload a region
//   observeRegions() — start IntersectionObserver for regions
//   unobserveRegions() — stop observing regions
//   getRegionStatus(regionName) — get status of a region
//   getAllRegionsStatus() — get status of all regions
//   isComponentLoaded(componentName) — check if loaded
//   getLoadedComponents() — list loaded components
//   reset() — reset loader state
//   getMetrics() — return metrics
//   healthCheck() — return health status
//   info() — return module info
//   injectPorts(p) — inject dependency ports
//   getPorts() — get ports snapshot
// EMITS (eventos):
//   header:lazy-loader:region:loaded — when a region finishes loading
//   header:lazy-loader:all:loaded — when all regions are loaded
// ═══════════════════════════════════════════════════════════════
// Header - Lazy Loader
// @version 1.2.0-ES6
// @changelog v1.2.0-ES6 - Task 10.1 B05: var → const/let
// @changelog v1.1.0 - healthCheck ajustado para regiões não carregadas
'use strict';

import { createCorePorts } from '/core/runtime/ports-profiles.js';
import { SELECTORS, CRITICALITY } from './constants.js';

export const VERSION = '1.2.0-ES6';
export const MODULE_ID = 'header/core/lazy-loader';

const Ports = createCorePorts({ moduleId: MODULE_ID });
let _portsInitialized = false;

function _initPorts() { if (_portsInitialized) return; Ports.init(); _portsInitialized = true; }
function _getPort(name: string) { return Ports.get(name); }
export function injectPorts(p: Record<string,unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

const _debugEnabled = () => { const cfg = _getPort('config'); return (cfg && cfg.app && cfg.app.debug) ? true : false; };
const _log = function(level: string, ...args: any[]) {const logger = _getPort('logger'); if (!logger) return; const prefix = `[${MODULE_ID}]`; if (level === 'error') { if (logger.error) logger.error(prefix, args.join(' ')); return; } if (level === 'warn') { if (logger.warn) logger.warn(prefix, args.join(' ')); return; } if (level === 'info') { if (logger.info) logger.info(prefix, args.join(' ')); return; } if (_debugEnabled() && logger.debug) logger.debug(prefix, args.join(' ')); };

const _regions = { left: { loaded: false, loading: false, components: ([] as unknown[]), priority: 2 }, center: { loaded: false, loading: false, components: ([] as unknown[]), priority: 3 }, right: { loaded: false, loading: false, components: ([] as unknown[]), priority: 1 } };
let _componentsLoader: Record<string,unknown>|null = null;
let _intersectionObserver: Record<string,unknown>|null = null;
const _loadedComponents = new Set();
const _pendingComponents = new Map();
let _metrics = { regionsLoaded: 0, componentsLoaded: 0, lazyLoaded: 0, eagerLoaded: 0, loadTime: {}, lastLoadAt: (null as unknown|null) };
const _config = { eagerLoadCritical: true, lazyLoadThreshold: 0.1, loadTimeout: 10000, parallelLoads: 3, priorityOrder: ['right', 'left', 'center'] };

function init(componentsLoader: Record<string,unknown>, config: Record<string,unknown>) {
  _initPorts();
  _componentsLoader = componentsLoader;
  if (config) { Object.assign(_config, config); }
  _setupIntersectionObserver();
  _log('info', 'LazyLoader inicializado');
}

function _setupIntersectionObserver() {
  if (!window.IntersectionObserver) { _log('warn', 'IntersectionObserver nao suportado, usando eager loading'); return; }
  // @ts-expect-error TS migration - TS2322
  _intersectionObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      // @ts-expect-error TS migration - TS2339
      if (entry.isIntersecting) { const region = entry.target.getAttribute('data-lazy-region'); if (region && !(_regions as Record<string,unknown>)[region].loaded && !(_regions as Record<string,unknown>)[region].loading) { _log('debug', 'Regiao visivel, carregando:', region); loadRegion(region); } }
    });
  }, { threshold: _config.lazyLoadThreshold, rootMargin: '50px' });
}

function loadRegion(regionName: string) {
  if (!(_regions as Record<string,unknown>)[regionName as string]) { _log('error', 'Regiao invalida:', regionName); return Promise.reject(new Error(`Regiao invalida: ${regionName}`)); }
  const region = (_regions as Record<string,unknown>)[regionName as string];
  // @ts-expect-error TS migration - TS2339
  if (region.loaded) { _log('debug', 'Regiao ja carregada:', regionName); return Promise.resolve({ region: regionName, components: region.components }); }
  // @ts-expect-error TS migration - TS2339
  if (region.loading) { _log('debug', 'Regiao ja em carregamento:', regionName); return _pendingComponents.get(regionName) || Promise.resolve(); }
  // @ts-expect-error TS migration - TS2339
  region.loading = true;
  const startTime = performance.now();
  _log('info', 'Carregando regiao:', regionName);
  // @ts-expect-error TS migration - TS2339
  const promise = _loadRegionComponents(regionName).then((results: unknown[]) => {
    // @ts-expect-error TS migration - TS2339
    region.loaded = true;
    // @ts-expect-error TS migration - TS2339
    region.loading = false;
    // @ts-expect-error TS migration - TS2339
    region.components = results;
    _metrics.regionsLoaded++;
    (_metrics.loadTime as Record<string,unknown>)[regionName as string] = performance.now() - startTime;
    _metrics.lastLoadAt = Date.now();
    _pendingComponents.delete(regionName);
    // @ts-expect-error TS migration - TS2339
    _log('info', 'Regiao carregada:', regionName, `(${results.length} componentes,${(_metrics.loadTime as Record<string,unknown>)[regionName as string].toFixed(0)}ms)`);
    _emitEvent('region:loaded', { region: regionName, components: results.length, time: (_metrics.loadTime as Record<string,unknown>)[regionName as string] });
    return { region: regionName, components: results };
  // @ts-expect-error TS migration - TS2339
  }).catch((error: unknown) => { region.loading = false; _pendingComponents.delete(regionName); _log('error', 'Erro ao carregar regiao:', regionName, error.message); throw error; });
  _pendingComponents.set(regionName, promise);
  return promise;
}

function _loadRegionComponents(regionName: string) {
  if (!_componentsLoader) { return Promise.reject(new Error('ComponentsLoader nao configurado')); }
  const componentsList = _componentsLoader.componentsList || [];
  // @ts-expect-error TS migration - TS2339
  const regionComponents = componentsList.filter((comp: unknown) => comp.region === regionName);
  if (regionComponents.length === 0) { return Promise.resolve([]); }
  // @ts-expect-error TS migration - TS2362, TS2339, TS2363
  regionComponents.sort((a: unknown, b: unknown) => { const critOrder = { critical: 0, important: 1, optional: 2 }; return ((critOrder as Record<string,unknown>)[a.criticality as string] || 2) - ((critOrder as Record<string,unknown>)[b.criticality as string] || 2); });
  return _loadComponentsBatch(regionComponents, 0, []);
}

function _loadComponentsBatch(components: unknown, startIndex: number, results: unknown[]): unknown {
  // @ts-expect-error TS migration - TS2339
  if (startIndex >= components.length) { return Promise.resolve(results); }
  // @ts-expect-error TS migration - TS2339
  const batch = components.slice(startIndex, startIndex + _config.parallelLoads);
  // @ts-expect-error TS migration - TS2345, TS2339
  const promises = batch.map((comp: unknown) => _loadSingleComponent(comp).then((result: unknown) => { results.push(result); return result; }).catch((error: unknown): unknown => { results.push({ name: comp.name, success: false, error: error.message }); return null; }));
  return Promise.all(promises).then(() => _loadComponentsBatch(components, startIndex + _config.parallelLoads, results));
}

function _loadSingleComponent(config: Record<string,unknown>) {
  if (_loadedComponents.has(config.name)) { return Promise.resolve({ name: config.name, success: true, cached: true }); }
  _metrics.componentsLoaded++;
  // @ts-expect-error TS migration - TS2349
  return _componentsLoader.loadComponent(config).then((instance: Record<string,unknown>) => { _loadedComponents.add(config.name); return { name: config.name, success: !!instance, instance }; });
}

function loadAll(options?: { priorityOrder?: string[] }) {
  options = options || {};
  const priorityOrder = options.priorityOrder || _config.priorityOrder;
  _log('info', 'Carregando todas as regioes, ordem:', priorityOrder.join(' -> '));
  const criticalPromise = _config.eagerLoadCritical ? _loadCriticalComponents() : Promise.resolve();
  return criticalPromise.then(() => priorityOrder.reduce((promise, region) => promise.then(() => loadRegion(region)), Promise.resolve())).then(() => { _log('info', 'Todas as regioes carregadas'); _emitEvent('all:loaded', { regions: Object.keys(_regions), totalComponents: _loadedComponents.size }); return { regions: Object.keys(_regions), totalComponents: _loadedComponents.size }; });
}

function _loadCriticalComponents() {
  if (!_componentsLoader || !_componentsLoader.componentsList) { return Promise.resolve(); }
  // @ts-expect-error TS migration - TS2339
  const criticalComponents = _componentsLoader.componentsList.filter((comp: unknown) => comp.criticality === CRITICALITY.CRITICAL);
  if (criticalComponents.length === 0) { return Promise.resolve(); }
  _log('info', 'Carregando', criticalComponents.length, 'componentes criticos (eager)');
  // @ts-expect-error TS migration - TS2345, TS2339
  const promises = criticalComponents.map((comp: unknown) => { _metrics.eagerLoaded++; return _loadSingleComponent(comp).catch((error: unknown): unknown => { _log('error', 'Falha ao carregar componente critico:', comp.name, error.message); return null; }); });
  return Promise.all(promises);
}

function lazyLoad(componentName: string) {
  if (_loadedComponents.has(componentName)) { return Promise.resolve({ name: componentName, success: true, cached: true }); }
  if (!_componentsLoader || !_componentsLoader.componentsList) { return Promise.reject(new Error('ComponentsLoader nao configurado')); }
  // @ts-expect-error TS migration - TS2339
  const config = _componentsLoader.componentsList.find((c: unknown) => c.name === componentName);
  if (!config) { return Promise.reject(new Error(`Componente nao encontrado: ${componentName}`)); }
  _metrics.lazyLoaded++;
  _log('debug', 'Lazy loading:', componentName);
  return _loadSingleComponent(config);
}

function observeRegions() {
  if (!_intersectionObserver) { _log('warn', 'IntersectionObserver nao disponivel'); return; }
  // @ts-expect-error TS migration - TS2769, TS2349
  Object.keys(_regions).forEach(regionName => { const selector = (SELECTORS as Record<string,unknown>)[`HEADER_${regionName.toUpperCase()}`] || `.header-${regionName}`; const element = document.querySelector(selector); if (element) { element.setAttribute('data-lazy-region', regionName); _intersectionObserver.observe(element); _log('debug', 'Observando regiao:', regionName); } });
}

// @ts-expect-error TS migration - TS2349
function unobserveRegions() { if (_intersectionObserver) { _intersectionObserver.disconnect(); } }
function preloadRegion(regionName: string) { _log('debug', 'Preloading regiao:', regionName); return loadRegion(regionName); }
// @ts-expect-error TS migration - TS2339
function getRegionStatus(regionName: string) { const region = (_regions as Record<string,unknown>)[regionName as string]; if (!region) return null; return { name: regionName, loaded: region.loaded, loading: region.loading, componentsCount: region.components.length, priority: region.priority }; }
function getAllRegionsStatus() { const result = {}; Object.keys(_regions).forEach(name => { (result as Record<string,unknown>)[name] = getRegionStatus(name); }); return result; }
function isComponentLoaded(componentName: string) { return _loadedComponents.has(componentName); }
function getLoadedComponents() { return Array.from(_loadedComponents); }
// @ts-expect-error TS migration - TS2339
function reset() { Object.keys(_regions).forEach(name => { (_regions as Record<string,unknown>)[name].loaded = false; (_regions as Record<string,unknown>)[name].loading = false; (_regions as Record<string,unknown>)[name].components = []; }); _loadedComponents.clear(); _pendingComponents.clear(); _log('info', 'LazyLoader resetado'); }
function _emitEvent(eventName: string, data: Record<string,unknown>) { const eventBus = _getPort('eventBus'); if (eventBus && eventBus.emit) { eventBus.emit(`header:lazy-loader:${eventName}`, Object.assign({ timestamp: Date.now() }, data)); } }
function getMetrics() { return Object.assign({}, _metrics); }

function healthCheck() {
  _initPorts();
  const checks = { hasComponentsLoader: !!_componentsLoader, hasObserver: !!_intersectionObserver || !window.IntersectionObserver, someRegionsLoaded: _metrics.regionsLoaded > 0 || _metrics.componentsLoaded === 0, portsInitialized: _portsInitialized };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  return { status: passed === total ? 'HEALTHY' : passed >= 2 ? 'DEGRADED' : 'UNHEALTHY', score: passed, maxScore: total, scoreDisplay: `${passed}/${total}`, checks, regionsLoaded: `${_metrics.regionsLoaded}/3`, componentsLoaded: _loadedComponents.size, version: VERSION, moduleId: MODULE_ID, timestamp: new Date().toISOString() };
}

function info() { return { version: VERSION, moduleId: MODULE_ID, config: Object.assign({}, _config), regions: getAllRegionsStatus(), loadedComponents: getLoadedComponents(), metrics: getMetrics(), portsInitialized: _portsInitialized, healthCheck: healthCheck() }; }

export { init, loadRegion, loadAll, lazyLoad, preloadRegion, observeRegions, unobserveRegions, getRegionStatus, getAllRegionsStatus, isComponentLoaded, getLoadedComponents, reset, getMetrics, healthCheck, info };
export default { VERSION, MODULE_ID, init, loadRegion, loadAll, lazyLoad, preloadRegion, observeRegions, getAllRegionsStatus, isComponentLoaded, reset, healthCheck, info };
