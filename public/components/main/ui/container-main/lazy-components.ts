// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-ADAPTIVE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: container-main:lazy-components
// PURPOSE: Lazy Components - Sistema de carregamento sob demanda
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   isLoaded() — exported function
//   getLoaded() — exported function
//   getLoadedList() — exported function
//   getMetrics() — exported function
//   clearCache() — exported function
//   info() — exported function
//   healthCheck() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   window.js
// ═══════════════════════════════════════════════════════════════
'use strict';

export const VERSION = '1.0.0-ADAPTIVE';
export const MODULE_ID = 'container-main:lazy-components';

// Mapa de componentes para lazy loading
const COMPONENT_MAP = {
  // Core components (sempre carregados)
  core: [
    'header',
    'controls',
    'errorBoundary',
    'eventHooks',
    'configPresets'
  ],
  
  // Componentes sob demanda
  lazy: {
    contextMenu: () => import('./components/context-menu.js'),
    keyboard: () => import('./components/keyboard-handler.js'),
    drag: () => import('./components/drag-handler.js'),
    resize: () => import('./components/resize-handler.js'),
    tabs: () => import('./components/tab-manager.js'),
    breadcrumb: () => import('./components/breadcrumb.js'),
    splitView: () => import('./components/split-view.js'),
    notificationBadge: () => import('./components/notification-badge.js'),
    statePersistence: () => import('./components/state-persistence.js'),
    toolbar: () => import('./components/toolbar.js'),
    searchBox: () => import('./components/search-box.js'),
    progressBar: () => import('./components/progress-bar.js'),
    toast: () => import('./components/toast.js'),
    snapDock: () => import('./components/snap-dock.js'),
    multiWindow: () => import('./components/multi-window.js'),
    zoomControls: () => import('./components/zoom-controls.js'),
    accessibility: () => import('./components/accessibility.js'),
    usageMetrics: () => import('./components/usage-metrics.js'),
    performanceMonitor: () => import('./components/performance-monitor.js'),
    debugPanel: () => import('./components/debug-panel.js'),
    pluginSystem: () => import('./components/plugin-system.js'),
    modal: () => import('./components/modal.js'),
    tooltip: () => import('./components/tooltip.js'),
    dropdown: () => import('./components/dropdown.js'),
    popover: () => import('./components/popover.js'),
    tabsEnhanced: () => import('./components/tabs-enhanced.js'),
    accordion: () => import('./components/accordion.js'),
    slider: () => import('./components/slider.js'),
    badge: () => import('./components/badge.js'),
    avatar: () => import('./components/avatar.js'),
    spinner: () => import('./components/spinner.js'),
    chip: () => import('./components/chip.js'),
    alert: () => import('./components/alert.js'),
    card: () => import('./components/card.js')
  }
};

// Cache de módulos carregados
const _loadedModules = new Map();
const _loadingPromises = new Map();
let _metrics = {
  totalLoaded: 0,
  loadTimes: {},
  errors: [] as unknown[]
};

// Carrega um componente sob demanda
export async function loadComponent(name: string) {
  // Já carregado?
  if (_loadedModules.has(name)) {
    return _loadedModules.get(name);
  }

  // Já carregando?
  if (_loadingPromises.has(name)) {
    return _loadingPromises.get(name);
  }

  // Componente existe?
  const loader = (COMPONENT_MAP.lazy as Record<string, () => Promise<unknown>>)[name];
  if (!loader) {
    throw new Error(`Component "${name}" not found in lazy map`);
  }

  // Carrega
  const startTime = performance.now();

  const loadPromise = (async () => {
    try {
      const module = await loader();
      const loadTime = Math.round(performance.now() - startTime);
      
      _loadedModules.set(name, module);
      _metrics.totalLoaded++;
      (_metrics.loadTimes as Record<string, unknown>)[name] = loadTime;
      
      return module;
    } catch (error) {
      _metrics.errors.push({ name, error: (error as Error).message, timestamp: Date.now() });
      throw error;
    } finally {
      _loadingPromises.delete(name);
    }
  })();

  _loadingPromises.set(name, loadPromise);
  return loadPromise;
}

// Carrega múltiplos componentes em paralelo
export async function loadComponents(names: string[]) {
  const results: Record<string, unknown> = {};
  const promises = names.map(async (name: string) => {
    try {
      results[name] = await loadComponent(name);
    } catch (e) {
      results[name] = null;
    }
  });
  
  await Promise.all(promises);
  return results;
}

// Precarrega componentes baseado nas opções
export async function preloadFromOptions(options: Record<string, unknown>) {
  const toLoad = [];

  if (options.contextMenuEnabled) toLoad.push('contextMenu');
  if (options.keyboardEnabled) toLoad.push('keyboard');
  if (options.draggable) toLoad.push('drag');
  if (options.resizable) toLoad.push('resize');
  if (options.tabsEnabled) toLoad.push('tabs');
  if (options.breadcrumbEnabled) toLoad.push('breadcrumb');
  if (options.splitViewEnabled) toLoad.push('splitView');
  if (options.notificationBadgeEnabled) toLoad.push('notificationBadge');
  if (options.statePersistenceEnabled) toLoad.push('statePersistence');
  if (options.toolbarEnabled) toLoad.push('toolbar');
  if (options.searchEnabled) toLoad.push('searchBox');
  if (options.progressEnabled) toLoad.push('progressBar');
  if (options.toastEnabled) toLoad.push('toast');
  if (options.snapEnabled) toLoad.push('snapDock');
  if (options.multiWindowEnabled) toLoad.push('multiWindow');
  if (options.zoomEnabled) toLoad.push('zoomControls');
  if (options.accessibilityEnabled) toLoad.push('accessibility');
  if (options.metricsEnabled) toLoad.push('usageMetrics');
  if (options.performanceEnabled) toLoad.push('performanceMonitor');
  if (options.debugEnabled) toLoad.push('debugPanel');
  if (options.pluginSystemEnabled) toLoad.push('pluginSystem');

  if (toLoad.length > 0) {
    return loadComponents(toLoad);
  }
  
  return {};
}

// Verifica se componente está carregado
export function isLoaded(name: string) {
  return _loadedModules.has(name);
}

// Obtém componente carregado
export function getLoaded(name: string) {
  return _loadedModules.get(name) || null;
}

// Lista componentes carregados
export function getLoadedList() {
  return Array.from(_loadedModules.keys());
}

// Obtém métricas
export function getMetrics() {
  return { ..._metrics };
}

// Limpa cache (para testes)
export function clearCache() {
  _loadedModules.clear();
  _loadingPromises.clear();
  _metrics = { totalLoaded: 0, loadTimes: {}, errors: [] };
}

export function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    coreComponents: COMPONENT_MAP.core.length,
    lazyComponents: Object.keys(COMPONENT_MAP.lazy).length,
    loadedCount: _loadedModules.size
  };
}

export function healthCheck() {
  return {
    status: 'HEALTHY',
    version: VERSION,
    moduleId: MODULE_ID,
    metrics: getMetrics(),
    loadedComponents: getLoadedList()
  };
}

export default {
  VERSION, MODULE_ID,
  loadComponent, loadComponents, preloadFromOptions,
  isLoaded, getLoaded, getLoadedList,
  getMetrics, clearCache,
  info, healthCheck
};
