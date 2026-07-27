
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (10.1.0-LOGGER-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: container-main:init-components
// PURPOSE: Init Components - Inicializador de componentes com Lazy Loading e Lifecycle Guard
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   getLifecycleGuard from ./resources/lifecycle-guard.js
//   getMetricsPersistence from ./resources/metrics-persistence.js
//   createLogger from ./utils/logger.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   getState() — exported function
//   getComponent() — exported function
//   listComponents() — exported function
//   getErrors() — exported function
//   healthCheck() — exported function
//   info() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   event
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { getLifecycleGuard } from './resources/lifecycle-guard.js';
import { getMetricsPersistence } from './resources/metrics-persistence.js';
import { createLogger } from './utils/logger.js';

export const VERSION = '10.1.0-LOGGER-INTEGRATED';
export const MODULE_ID = 'container-main:init-components';

// Logger dedicado para este módulo
const logger = createLogger(MODULE_ID);

// Componentes core (carregam síncronos - essenciais para boot)
const CORE_COMPONENTS = [
  'header',
  'controls',
  'errorBoundary',
  'eventHooks',
  'configPresets'
];

// Componentes lazy (carregam sob demanda)
const LAZY_COMPONENTS = [
  'adaptiveUI',
  'analytics',
  'announcer',
  'autoSave',
  'breadcrumbs',
  'cache',
  'clipboard',
  'colorPicker',
  'commandPalette',
  'comments',
  'comparison',
  'contextMenu',
  'dataExport',
  'dateRange',
  'debugPanel',
  'dragDrop',
  'favorites',
  'filePreview',
  'filterBuilder',
  'fullscreen',
  'helpTooltips',
  'history',
  'hotkeys',
  'infiniteScroll',
  'localization',
  'markdown',
  'mediaPlayer',
  'mentions',
  'multiSelect',
  'notifications',
  'offline',
  'pagination',
  'performance',
  'permissions',
  'print',
  'progressTracker',
  'quickActions',
  'ratings',
  'recentItems',
  'search',
  'sharing',
  'sidebar',
  'sortable',
  'statusIndicator',
  'steps',
  'tableView',
  'tabs',
  'tags',
  'templates',
  'themes',
  'timeline',
  'tour',
  'tree',
  'undo',
  'upload',
  'validation',
  'version',
  'virtualScroll',
  'widgets',
  'wizard',
  'zoom'
];

// Estado da inicialização
let _state = {
  initialized: false,
  coreLoaded: false,
  lazyLoaded: false,
  components: new Map(),
  errors: [] as unknown[],
  metrics: {
    coreLoadTime: 0,
    lazyLoadTime: 0,
    totalComponents: 0,
    loadedComponents: 0,
    failedComponents: 0
  }
};

interface ManagerRef {
  [key: string]: ((...args: unknown[]) => unknown) | unknown;
}

// Managers
let _lifecycleGuard: ManagerRef | null = null;
let _metricsPersistence: ManagerRef | null = null;
let _eventBus: ManagerRef | null = null;

// Promise de lazy loading
let _lazyPromise: unknown = null;

// Emite evento
function _emit(event: string, data: Record<string, unknown>) {
  if (_eventBus?.emit) {
    (_eventBus.emit as (...args: unknown[]) => void)(event, { ...data, source: MODULE_ID, timestamp: Date.now() });
  }
}

// Registra métrica
function _recordMetric(name: string, value: unknown, tags = {}) {
  (_metricsPersistence?.record as ((...args: unknown[]) => void) | undefined)?.(MODULE_ID, name, value, { tags });
}

// Carrega componente individual com guard
async function _loadComponent(name: string, isCore = false) {
  const componentId = `component:${name}`;
  
  // Registra no lifecycle guard
  (_lifecycleGuard?.register as ((...args: unknown[]) => void) | undefined)?.(componentId);

  try {
    // Guarda o init
    const result = await (_lifecycleGuard?.guardInit as ((...args: unknown[]) => Promise<Record<string, unknown>>) | undefined)?.(componentId, async () => {
      const startTime = performance.now();
      
      // Simula import dinâmico (em produção seria import real)
      // const module = await import(`./components/${name}/index.js`);
      
      const loadTime = performance.now() - startTime;
      
      const componentRecord = {
        name,
        isCore,
        status: 'loaded',
        loadTime,
        loadedAt: Date.now()
      };

      _state.components.set(name, componentRecord);
      _state.metrics.loadedComponents++;
      
      _recordMetric('component_load_time', loadTime, { component: name, isCore });
      
      return componentRecord;
    });

    if (result?.blocked) {
      // Já estava inicializado - retorna existente
      return _state.components.get(name);
    }

    return result?.result;
  } catch (error: any) {
    const errorRecord = {
      name,
      isCore,
      status: 'error',
      error: (error as Error).message,
      failedAt: Date.now()
    };

    _state.components.set(name, errorRecord);
    _state.errors.push({ component: name, error: (error as Error).message });
    _state.metrics.failedComponents++;
    
    _recordMetric('component_load_error', 1, { component: name });
    _emit('init-components:error', { component: name, error: error.message });
    
    // Core components são críticos
    if (isCore) {
      throw error;
    }
    
    return errorRecord;
  }
}

// Carrega componentes core (síncronos)
async function _loadCoreComponents() {
  const startTime = performance.now();
  
  _emit('init-components:core-start', { count: CORE_COMPONENTS.length });
  
  for (const name of CORE_COMPONENTS) {
    await _loadComponent(name, true);
  }
  
  _state.metrics.coreLoadTime = performance.now() - startTime;
  _state.coreLoaded = true;
  
  _recordMetric('core_load_time', _state.metrics.coreLoadTime);
  _emit('init-components:core-complete', { 
    count: CORE_COMPONENTS.length, 
    time: _state.metrics.coreLoadTime 
  });
}

// Carrega componentes lazy (assíncronos, não bloqueante)
async function _loadLazyComponents() {
  const startTime = performance.now();
  
  _emit('init-components:lazy-start', { count: LAZY_COMPONENTS.length });
  
  // Carrega em batches para não sobrecarregar
  const batchSize = 5;
  for (let i = 0; i < LAZY_COMPONENTS.length; i += batchSize) {
    const batch = LAZY_COMPONENTS.slice(i, i + batchSize);
    await Promise.all(batch.map(name => _loadComponent(name, false)));
  }
  
  _state.metrics.lazyLoadTime = performance.now() - startTime;
  _state.lazyLoaded = true;
  
  _recordMetric('lazy_load_time', _state.metrics.lazyLoadTime);
  _emit('init-components:lazy-complete', { 
    count: LAZY_COMPONENTS.length, 
    time: _state.metrics.lazyLoadTime 
  });
}

// API Pública
export async function initComponents(options: Record<string, unknown> = {}) {
  const {
    eventBus = null,
    lifecycleGuard = null,
    metricsPersistence = null,
    enableLazyLoading = true
  } = options;

  // Já inicializado - retorna estado atual (idempotente)
  if (_state.initialized && _state.coreLoaded) {
    return {
      success: true,
      cached: true,
      state: getState()
    };
  }

  // Configura managers
  _eventBus = eventBus as ManagerRef | null;
  _lifecycleGuard = (lifecycleGuard || getLifecycleGuard({ eventBus })) as ManagerRef;
  _metricsPersistence = (metricsPersistence || getMetricsPersistence({ eventBus })) as ManagerRef;

  // Inicializa metrics persistence se necessário
  if (_metricsPersistence.init) {
    (_metricsPersistence.init as () => void)();
  }

  _state.metrics.totalComponents = CORE_COMPONENTS.length + LAZY_COMPONENTS.length;

  try {
    // Carrega core primeiro (bloqueante)
    await _loadCoreComponents();
    
    // Inicia lazy loading em background (não bloqueante)
    if (enableLazyLoading) {
      _lazyPromise = _loadLazyComponents().catch(error => {
        logger.warn('Lazy loading failed', { error: error.message });
      });
    }
    
    _state.initialized = true;
    
    _emit('init-components:ready', {
      coreLoaded: _state.coreLoaded,
      lazyPending: enableLazyLoading && !_state.lazyLoaded
    });

    return {
      success: true,
      cached: false,
      state: getState(),
      lazyPromise: _lazyPromise
    };
  } catch (error: any) {
    _emit('init-components:failed', { error: (error as Error).message });
    throw error;
  }
}

// Inicialização completa (aguarda lazy)
export async function initComponentsAsync(options = {}) {
  const result = await initComponents(options);
  
  if (_lazyPromise) {
    await _lazyPromise;
  }
  
  return {
    ...result,
    lazyLoaded: _state.lazyLoaded
  };
}

// Aguarda lazy components
export async function waitForLazyComponents() {
  if (_lazyPromise) {
    await _lazyPromise;
  }
  return _state.lazyLoaded;
}

// Carrega componente sob demanda
export async function loadComponentOnDemand(name: string) {
  if (_state.components.has(name)) {
    const existing = _state.components.get(name);
    if (existing.status === 'loaded') {
      return existing;
    }
  }
  
  return _loadComponent(name, false);
}

// Destrói componente
export async function destroyComponent(name: string) {
  const componentId = `component:${name}`;
  
  const result = await (_lifecycleGuard?.guardDestroy as ((...args: unknown[]) => Promise<Record<string, unknown>>) | undefined)?.(componentId, async () => {
    const record = _state.components.get(name);
    if (record) {
      record.status = 'destroyed';
      record.destroyedAt = Date.now();
    }
    return record;
  });

  if (result?.success) {
    _emit('init-components:component-destroyed', { component: name });
  }

  return result?.success || false;
}

// Reinicia componente
export async function restartComponent(name: string) {
  await destroyComponent(name);
  (_lifecycleGuard?.reset as ((...args: unknown[]) => void) | undefined)?.(`component:${name}`);
  return loadComponentOnDemand(name);
}

// Obtém estado atual
export function getState() {
  return {
    initialized: _state.initialized,
    coreLoaded: _state.coreLoaded,
    lazyLoaded: _state.lazyLoaded,
    metrics: { ..._state.metrics },
    componentCount: _state.components.size,
    errorCount: _state.errors.length
  };
}

// Obtém componente
export function getComponent(name: string) {
  return _state.components.get(name) || null;
}

// Lista componentes
export function listComponents(filter: string | null = null) {
  const list: unknown[] = [];
  _state.components.forEach((record, name) => {
    if (!filter || record.status === filter) {
      list.push({ name, ...record });
    }
  });
  return list;
}

// Obtém erros
export function getErrors() {
  return [..._state.errors];
}

// Reset completo
export async function reset() {
  // Destrói todos os componentes
  for (const name of _state.components.keys()) {
    await destroyComponent(name);
  }

  // Reseta estado
  _state = {
    initialized: false,
    coreLoaded: false,
    lazyLoaded: false,
    components: new Map(),
    errors: [],
    metrics: {
      coreLoadTime: 0,
      lazyLoadTime: 0,
      totalComponents: 0,
      loadedComponents: 0,
      failedComponents: 0
    }
  };

  _lazyPromise = null;
  (_lifecycleGuard?.resetAll as (() => void) | undefined)?.();

  _emit('init-components:reset', {});
}

// Health check
export function healthCheck() {
  const errorRate = _state.metrics.totalComponents > 0
    ? _state.metrics.failedComponents / _state.metrics.totalComponents
    : 0;

  let status = 'HEALTHY';
  if (!_state.initialized) status = 'NOT_INITIALIZED';
  else if (errorRate > 0.1) status = 'ERROR';
  else if (errorRate > 0) status = 'WARNING';
  else if (!_state.lazyLoaded) status = 'LOADING';

  return {
    status,
    version: VERSION,
    moduleId: MODULE_ID,
    state: getState(),
    lifecycleGuardActive: !!_lifecycleGuard
  };
}

// Info
export function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    coreComponents: CORE_COMPONENTS.length,
    lazyComponents: LAZY_COMPONENTS.length,
    totalComponents: CORE_COMPONENTS.length + LAZY_COMPONENTS.length,
    features: {
      lazyLoading: true,
      lifecycleGuard: true,
      metricsPersistence: true
    }
  };
}

export default {
  VERSION, MODULE_ID,
  initComponents,
  initComponentsAsync,
  waitForLazyComponents,
  loadComponentOnDemand,
  destroyComponent,
  restartComponent,
  getState,
  getComponent,
  listComponents,
  getErrors,
  reset,
  healthCheck,
  info
};
