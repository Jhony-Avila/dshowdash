// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-PHASE4-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: container-main:event-bus-adapter
// PURPOSE: Event Bus Adapter - Adaptador centralizado para comunicação entre módulos
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   getEventBus, createEventBridge from ../core/event-bridge.js
//   createLogger from ../utils/logger.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   EVENT_NAMESPACES — exported value
//   SYSTEM_EVENTS — exported value
//   createEventBusAdapter() — exported function
//   getEventBusAdapter() — exported function
//   resetEventBusAdapter() — exported function
//   info() — exported function
//   healthCheck() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   `${namespace}:${event}`
//   result.event
// LISTENS (eventos):
//   e
//   event
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { getEventBus, createEventBridge } from '../core/event-bridge.js';
import { createLogger } from '../utils/logger.js';

export const VERSION = '1.0.0-PHASE4';
export const MODULE_ID = 'container-main:event-bus-adapter';

// Namespaces de eventos
export const EVENT_NAMESPACES = Object.freeze({
  BOOTSTRAP: 'bootstrap',
  KERNEL: 'kernel',
  SLOT: 'slot',
  PANEL: 'panel',
  RESOURCE: 'resource',
  LIFECYCLE: 'lifecycle',
  PERFORMANCE: 'performance',
  UI: 'ui',
  USER: 'user',
  SYSTEM: 'system'
});

// Eventos padrão do sistema
export const SYSTEM_EVENTS = Object.freeze({
  // Bootstrap
  'bootstrap:starting': { namespace: 'bootstrap', description: 'Bootstrap iniciando' },
  'bootstrap:ready': { namespace: 'bootstrap', description: 'Bootstrap pronto' },
  'bootstrap:error': { namespace: 'bootstrap', description: 'Erro no bootstrap' },
  'bootstrap:shutdown': { namespace: 'bootstrap', description: 'Shutdown iniciado' },
  
  // Kernel
  'kernel:initialized': { namespace: 'kernel', description: 'Kernel inicializado' },
  'kernel:started': { namespace: 'kernel', description: 'Kernel iniciado' },
  'kernel:paused': { namespace: 'kernel', description: 'Kernel pausado' },
  'kernel:resumed': { namespace: 'kernel', description: 'Kernel retomado' },
  'kernel:error': { namespace: 'kernel', description: 'Erro no kernel' },
  
  // Slot
  'slot:registered': { namespace: 'slot', description: 'Slot registrado' },
  'slot:activated': { namespace: 'slot', description: 'Slot ativado' },
  'slot:deactivated': { namespace: 'slot', description: 'Slot desativado' },
  'slot:destroyed': { namespace: 'slot', description: 'Slot destruído' },
  
  // Panel
  'panel:loaded': { namespace: 'panel', description: 'Panel carregado' },
  'panel:ready': { namespace: 'panel', description: 'Panel pronto' },
  'panel:error': { namespace: 'panel', description: 'Erro no panel' },
  'panel:refresh': { namespace: 'panel', description: 'Panel atualizado' },
  
  // Performance
  'performance:warning': { namespace: 'performance', description: 'Alerta de performance' },
  'performance:critical': { namespace: 'performance', description: 'Performance crítica' },
  
  // Lifecycle
  'lifecycle:beforeInit': { namespace: 'lifecycle', description: 'Antes de inicializar' },
  'lifecycle:afterInit': { namespace: 'lifecycle', description: 'Após inicializar' },
  'lifecycle:beforeDestroy': { namespace: 'lifecycle', description: 'Antes de destruir' },
  'lifecycle:afterDestroy': { namespace: 'lifecycle', description: 'Após destruir' }
});

// Cria o adapter
export function createEventBusAdapter(options: Record<string, unknown> = {}) {
  const { eventBus = null, debug = false, maxListeners = 100, enableHistory = true } = options;

  const _logger = createLogger(MODULE_ID) as any;
  let _eventBus = eventBus || getEventBus({});
  let _bridge = createEventBridge(_eventBus);
  let _subscriptions = new Map();
  let _history: unknown[] = [];
  let _historyLimit = 100;
  let _middlewares: Array<(event: string, data: Record<string, unknown>) => false | Record<string, unknown> | void> = [];
  let _paused = false;

  // Métricas
  let _metrics = {
    emitted: 0,
    received: 0,
    errors: 0,
    byNamespace: {}
  };

  // Normaliza nome do evento
  function _normalizeEvent(event: string) {
    if (typeof event !== 'string') return null;
    return event.toLowerCase().trim();
  }

  // Extrai namespace
  function _getNamespace(event: string) {
    const parts = event.split(':');
    return parts[0] || 'unknown';
  }

  // Registra no histórico
  function _recordHistory(type: string, event: string, data: Record<string, unknown>) {
    if (!enableHistory) return;
    _history.push({ type, event, data, timestamp: Date.now() });
    if (_history.length > _historyLimit) _history.shift();
  }

  // Aplica middlewares
  function _applyMiddlewares(event: string, data: Record<string, unknown>) {
    let result = { event, data, cancelled: false };
    
    for (const middleware of _middlewares) {
      try {
        const output = middleware(result.event, result.data);
        if (output === false) {
          result.cancelled = true;
          break;
        }
        if (output && typeof output === 'object') {
          result = { ...result, ...output };
        }
      } catch (e: any) {
        _logger.error(`Middleware error: ${e.message}`);
      }
    }
    
    return result;
  }

  // Atualiza métricas
  function _updateMetrics(type: string, event: string) {
    const namespace = _getNamespace(event);
    
    if (type === 'emit') _metrics.emitted++;
    if (type === 'receive') _metrics.received++;
    if (type === 'error') _metrics.errors++;
    
    if (!(_metrics.byNamespace as Record<string, unknown>)[namespace]) {
      (_metrics.byNamespace as Record<string, unknown>)[namespace] = { emitted: 0, received: 0 };
    }
    
    if (type === 'emit') ((_metrics.byNamespace as Record<string, Record<string, number>>)[namespace]).emitted++;
    if (type === 'receive') ((_metrics.byNamespace as Record<string, Record<string, number>>)[namespace]).received++;
  }

  const adapter = {
    // Emite evento
    emit(event: string, data: Record<string, unknown> = {}) {
      if (_paused) return false;
      
      const normalized = _normalizeEvent(event);
      if (!normalized) return false;

      const result = _applyMiddlewares(normalized, data);
      if (result.cancelled) {
        if (debug) _logger.debug(`Event cancelled by middleware: ${normalized}`);
        return false;
      }

      try {
        _bridge.emit(result.event, { ...result.data, __source: MODULE_ID, __timestamp: Date.now() });
        _updateMetrics('emit', result.event);
        _recordHistory('emit', result.event, result.data);
        
        if (debug) _logger.debug(`Emitted: ${result.event}`, result.data);
        return true;
      } catch (e: any) {
        _updateMetrics('error', result.event);
        _logger.error(`Emit error: ${e.message}`);
        return false;
      }
    },

    // Escuta evento
    on(event: string, callback: Function, options: Record<string, unknown> = {}) {
      const { once = false, priority = 0 } = options;
      const normalized = _normalizeEvent(event);
      if (!normalized || typeof callback !== 'function') return null;

      const wrappedCallback = (data: Record<string, unknown>) => {
        if (_paused) return;
        _updateMetrics('receive', normalized);
        _recordHistory('receive', normalized, data);
        
        try {
          callback(data);
        } catch (e: any) {
          _updateMetrics('error', normalized);
          _logger.error(`Handler error for ${normalized}: ${e.message}`);
        }
      };

      const method = once ? 'once' : 'on';
      _eventBus[method](normalized, wrappedCallback);

      // Guarda referência para cleanup
      const subscriptionId = `${normalized}-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
      _subscriptions.set(subscriptionId, { event: normalized, callback: wrappedCallback, original: callback });

      if (debug) _logger.debug(`Subscribed to: ${normalized}`);

      return subscriptionId;
    },

    // Escuta uma vez
    once(event: string, callback: (...args: unknown[]) => void) {
      return this.on(event, callback, { once: true });
    },

    // Remove listener
    off(subscriptionIdOrEvent: string, callback: ((...args: unknown[]) => void) | null = null) {
      if (_subscriptions.has(subscriptionIdOrEvent)) {
        const sub = _subscriptions.get(subscriptionIdOrEvent);
        _eventBus.off(sub.event, sub.callback);
        _subscriptions.delete(subscriptionIdOrEvent);
        return true;
      }

      if (typeof subscriptionIdOrEvent === 'string' && callback) {
        const normalized = _normalizeEvent(subscriptionIdOrEvent);
        _eventBus.off(normalized, callback);
        return true;
      }

      return false;
    },

    // Remove todos os listeners de um evento
    offAll(event: string | null = null) {
      if (event) {
        const normalized = _normalizeEvent(event);
        for (const [id, sub] of _subscriptions) {
          if (sub.event === normalized) {
            _eventBus.off(sub.event, sub.callback);
            _subscriptions.delete(id);
          }
        }
      } else {
        for (const [id, sub] of _subscriptions) {
          _eventBus.off(sub.event, sub.callback);
        }
        _subscriptions.clear();
      }
    },

    // Adiciona middleware
    use(middleware: (event: string, data: Record<string, unknown>) => false | Record<string, unknown> | void) {
      if (typeof middleware === 'function') {
        _middlewares.push(middleware);
        return () => {
          const idx = _middlewares.indexOf(middleware);
          if (idx > -1) _middlewares.splice(idx, 1);
        };
      }
      return null;
    },

    // Pausa/Resume
    pause() { _paused = true; },
    resume() { _paused = false; },
    isPaused() { return _paused; },

    // Emite para namespace
    emitTo(namespace: string, event: string, data: Record<string, unknown> = {}) {
      return this.emit(`${namespace}:${event}`, data);
    },

    // Escuta namespace inteiro
    onNamespace(namespace: string, callback: (...args: unknown[]) => void) {
      const pattern = `${namespace}:`;
      const wrappedCallback = (event: string, data: Record<string, unknown>) => {
        if (event.startsWith(pattern)) {
          callback(event, data);
        }
      };
      
      // Isso requer suporte a wildcard no EventBus
      // Por enquanto, registra eventos conhecidos
      const knownEvents = Object.keys(SYSTEM_EVENTS).filter(e => e.startsWith(pattern));
      const subscriptions = knownEvents.map(e => this.on(e, (data: Record<string, unknown>) => callback(e, data)));
      
      // @ts-expect-error strict migration — TS2345
      return () => subscriptions.forEach(id => this.off(id));
    },

    // Getters
    getHistory(limit = 50) { return _history.slice(-limit); },
    getMetrics() { return { ..._metrics }; },
    getSubscriptionCount() { return _subscriptions.size; },
    getEventBus() { return _eventBus; },
    getBridge() { return _bridge; },

    // Reset
    resetMetrics() {
      _metrics = { emitted: 0, received: 0, errors: 0, byNamespace: {} };
    },

    clearHistory() {
      _history = [];
    },

    // Health check
    healthCheck() {
      return {
        status: _subscriptions.size < Number(maxListeners) ? 'HEALTHY' : 'WARNING',
        version: VERSION,
        moduleId: MODULE_ID,
        subscriptions: _subscriptions.size,
        maxListeners,
        paused: _paused,
        metrics: _metrics
      };
    },

    // Info
    info() {
      return {
        moduleId: MODULE_ID,
        version: VERSION,
        namespaces: Object.keys(EVENT_NAMESPACES),
        systemEvents: Object.keys(SYSTEM_EVENTS).length,
        subscriptions: _subscriptions.size,
        middlewares: _middlewares.length,
        historySize: _history.length
      };
    },

    // Destroy
    destroy() {
      this.offAll();
      _middlewares = [];
      _history = [];
      _logger.info('EventBusAdapter destroyed');
    }
  };

  return adapter;
}

// Singleton
let _instance: ReturnType<typeof createEventBusAdapter> | null = null;

export function getEventBusAdapter(options = {}) {
  if (!_instance) {
    _instance = createEventBusAdapter(options);
  }
  return _instance;
}

export function resetEventBusAdapter() {
  if (_instance) {
    _instance.destroy();
    _instance = null;
  }
}

export function info() {
  return { moduleId: MODULE_ID, version: VERSION, namespaces: Object.keys(EVENT_NAMESPACES) };
}

export function healthCheck() {
  if (_instance) return _instance.healthCheck();
  return { status: 'NOT_INITIALIZED', version: VERSION, moduleId: MODULE_ID };
}

export default {
  VERSION, MODULE_ID,
  EVENT_NAMESPACES, SYSTEM_EVENTS,
  createEventBusAdapter, getEventBusAdapter, resetEventBusAdapter,
  info, healthCheck
};
