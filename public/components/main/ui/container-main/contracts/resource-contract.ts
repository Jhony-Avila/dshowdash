
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.1.0-LOGGER-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: container-main:contracts:resource
// PURPOSE: Resource Contract - Interface para gerenciamento de recursos
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createLogger from ../utils/logger.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   RESOURCE_TYPES — exported value
//   RESOURCE_STATES — exported value
//   CLEANUP_POLICIES — exported value
//   RESOURCE_INTERFACE — exported value
//   registerResource() — exported function
//   getRegisteredResources() — exported function
//   getResourcesByType() — exported function
//   pauseResourcesByType() — exported function
//   resumeResourcesByType() — exported function
//   createResource() — exported function
//   createVideoResource() — exported function
//   createCanvasResource() — exported function
//   createTimerResource() — exported function
//   getResourceStats() — exported function
//   info() — exported function
//   healthCheck() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createLogger } from '../utils/logger.js';

export const VERSION = '1.1.0-LOGGER-INTEGRATED';
export const MODULE_ID = 'container-main:contracts:resource';

const logger = createLogger(MODULE_ID);

// Tipos de recursos
export const RESOURCE_TYPES = Object.freeze({
  VIDEO: 'video',
  AUDIO: 'audio',
  IMAGE: 'image',
  IFRAME: 'iframe',
  CANVAS: 'canvas',
  WEBGL: 'webgl',
  STREAM: 'stream',
  WEBSOCKET: 'websocket',
  WORKER: 'worker',
  ANIMATION: 'animation',
  TIMER: 'timer',
  GENERIC: 'generic'
});

// Estados de recurso
export const RESOURCE_STATES = Object.freeze({
  IDLE: 'idle',
  LOADING: 'loading',
  READY: 'ready',
  ACTIVE: 'active',
  PAUSED: 'paused',
  ERROR: 'error',
  DISPOSED: 'disposed'
});

// Políticas de cleanup
export const CLEANUP_POLICIES = Object.freeze({
  IMMEDIATE: 'immediate',
  DEFERRED: 'deferred',
  ON_IDLE: 'on-idle',
  MANUAL: 'manual'
});

// Interface de recurso
export const RESOURCE_INTERFACE = {
  required: [
    'getId',
    'getType',
    'getState',
    'load',
    'dispose',
    'healthCheck'
  ],
  optional: [
    'pause',
    'resume',
    'reset',
    'getMemoryUsage',
    'onError'
  ]
};

// Registro global de recursos (para cleanup)
const _resourceRegistry = new Map();
let _resourceIdCounter = 0;

// Gera ID único para recurso
function _generateResourceId(type: string) {
  return `resource-${type}-${++_resourceIdCounter}-${Date.now().toString(36)}`;
}

// Registra um recurso no registry global
export function registerResource(resource: Record<string, unknown>) {
  const id = (resource.getId as () => string)();
  _resourceRegistry.set(id, resource);
  return () => _resourceRegistry.delete(id);
}

// Obtém todos os recursos registrados
export function getRegisteredResources() {
  return Array.from(_resourceRegistry.values());
}

// Obtém recursos por tipo
export function getResourcesByType(type: string) {
  return getRegisteredResources().filter(r => r.getType() === type);
}

// Dispõe todos os recursos de um tipo
export async function disposeResourcesByType(type: string) {
  const resources = getResourcesByType(type);
  await Promise.all(resources.map(r => r.dispose()));
  return resources.length;
}

// Dispõe todos os recursos
export async function disposeAllResources() {
  const resources = getRegisteredResources();
  await Promise.all(resources.map(r => r.dispose()));
  _resourceRegistry.clear();
  return resources.length;
}

// Pausa todos os recursos de um tipo
export function pauseResourcesByType(type: string) {
  const resources = getResourcesByType(type);
  resources.forEach(r => r.pause?.());
  return resources.length;
}

// Resume todos os recursos de um tipo
export function resumeResourcesByType(type: string) {
  const resources = getResourcesByType(type);
  resources.forEach(r => r.resume?.());
  return resources.length;
}

// Factory para criar um recurso compatível com o contrato
export function createResource(type: string, options: Record<string, any> = {}) {
  const {
    onLoad,
    onError,
    onDispose,
    cleanupPolicy = CLEANUP_POLICIES.DEFERRED,
    autoRegister = true
  } = options;

  const _id = _generateResourceId(type);
  let _state: string = RESOURCE_STATES.IDLE;
  let _error: unknown = null;
  let _loadPromise: unknown = null;
  let _memoryEstimate = 0;
  let _unregister: unknown = null;

  const resource = {
    getId: () => _id,
    getType: () => type,
    
    getState: () => ({
      id: _id,
      type,
      state: _state,
      error: (_error as Error)?.message || null,
      memoryEstimate: _memoryEstimate
    }),

    async load(loader: () => Promise<Record<string, unknown> | null>) {
      if (_state === RESOURCE_STATES.LOADING) return _loadPromise;
      if (_state === RESOURCE_STATES.READY || _state === RESOURCE_STATES.ACTIVE) return this;

      _state = RESOURCE_STATES.LOADING;
      _error = null;

      _loadPromise = (async () => {
        try {
          const result = await loader();
          _memoryEstimate = (result?.memoryEstimate as number) || 0;
          _state = RESOURCE_STATES.READY;
          onLoad?.(result);
          return result;
        } catch (e) {
          _error = e;
          _state = RESOURCE_STATES.ERROR;
          onError?.(e);
          throw e;
        }
      })();

      return _loadPromise;
    },

    async dispose() {
      if (_state === RESOURCE_STATES.DISPOSED) return this;

      _state = RESOURCE_STATES.DISPOSED;
      
      try {
        await onDispose?.();
      } catch (e) {
        logger.error(`Error during dispose`, { resourceId: _id, error: (e as Error).message });
      }

      if (_unregister) (_unregister as () => void)();
      _memoryEstimate = 0;
      _error = null;
      _loadPromise = null;

      return this;
    },

    pause() {
      if (_state === RESOURCE_STATES.ACTIVE) {
        _state = RESOURCE_STATES.PAUSED;
      }
      return this;
    },

    resume() {
      if (_state === RESOURCE_STATES.PAUSED) {
        _state = RESOURCE_STATES.ACTIVE;
      }
      return this;
    },

    activate() {
      if (_state === RESOURCE_STATES.READY || _state === RESOURCE_STATES.PAUSED) {
        _state = RESOURCE_STATES.ACTIVE;
      }
      return this;
    },

    reset() {
      _state = RESOURCE_STATES.IDLE;
      _error = null;
      _loadPromise = null;
      _memoryEstimate = 0;
      return this;
    },

    getMemoryUsage: () => _memoryEstimate,

    healthCheck() {
      return {
        status: _error ? 'ERROR' : _state === RESOURCE_STATES.DISPOSED ? 'DISPOSED' : 'HEALTHY',
        resourceId: _id,
        resourceType: type,
        state: _state,
        error: (_error as Error)?.message || null,
        memoryEstimate: _memoryEstimate,
        cleanupPolicy
      };
    }
  };

  // Auto-registra se configurado
  if (autoRegister) {
    _unregister = registerResource(resource);
  }

  return resource;
}

// Cria recurso especializado para vídeo
export function createVideoResource(videoElement: any, options: Record<string, any> = {}) {
  const resource = createResource(RESOURCE_TYPES.VIDEO, {
    ...options,
    onDispose: async () => {
      if (videoElement) {
        videoElement.pause();
        videoElement.src = '';
        videoElement.load();
      }
      options.onDispose?.();
    }
  });

  return {
    ...resource,
    play: () => { videoElement?.play(); resource.activate(); },
    pause: () => { videoElement?.pause(); resource.pause(); },
    stop: () => { videoElement?.pause(); videoElement.currentTime = 0; resource.pause(); },
    setVolume: (v: string) => { if (videoElement) videoElement.volume = v; },
    getVideoElement: () => videoElement
  };
}

// Cria recurso especializado para canvas/WebGL
export function createCanvasResource(canvas: any, options: Record<string, any> = {}) {
  let _animationId: unknown = null;

  const resource = createResource(
    options.webgl ? RESOURCE_TYPES.WEBGL : RESOURCE_TYPES.CANVAS,
    {
      ...options,
      onDispose: async () => {
        if (_animationId) cancelAnimationFrame(_animationId as number);
        if (canvas) {
          const ctx = canvas.getContext('2d') || canvas.getContext('webgl');
          if (ctx?.clearRect) ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
        options.onDispose?.();
      }
    }
  );

  return {
    ...resource,
    startAnimation: (callback: (...args: unknown[]) => void) => {
      const loop = () => {
        if (resource.getState().state === RESOURCE_STATES.ACTIVE) {
          callback();
          _animationId = requestAnimationFrame(loop);
        }
      };
      resource.activate();
      loop();
    },
    stopAnimation: () => {
      if (_animationId) cancelAnimationFrame(_animationId as number);
      _animationId = null;
      resource.pause();
    },
    getCanvas: () => canvas
  };
}

// Cria recurso para timers/intervals
export function createTimerResource(options: Record<string, any> = {}) {
  const _timers = new Set();
  const _intervals = new Set();

  const resource = createResource(RESOURCE_TYPES.TIMER, {
    ...options,
    onDispose: async () => {
      // @ts-expect-error strict migration — TS2345
      _timers.forEach((t: ReturnType<typeof setTimeout>) => clearTimeout(t));
      // @ts-expect-error strict migration — TS2345
      _intervals.forEach((i: ReturnType<typeof setInterval>) => clearInterval(i));
      _timers.clear();
      _intervals.clear();
      options.onDispose?.();
    }
  });

  return {
    ...resource,
    setTimeout: (fn: Function, delay: number) => {
      const id = setTimeout(() => { _timers.delete(id); fn(); }, delay);
      _timers.add(id);
      return id;
    },
    clearTimeout: (id: string) => { clearTimeout(id); _timers.delete(id); },
    setInterval: (fn: Function, delay: number) => {
      const id = setInterval(fn, delay);
      _intervals.add(id);
      return id;
    },
    clearInterval: (id: string) => { clearInterval(id); _intervals.delete(id); },
    clearAll: () => {
      // @ts-expect-error strict migration — TS2345
      _timers.forEach((t: ReturnType<typeof setTimeout>) => clearTimeout(t));
      // @ts-expect-error strict migration — TS2345
      _intervals.forEach((i: ReturnType<typeof setInterval>) => clearInterval(i));
      _timers.clear();
      _intervals.clear();
    }
  };
}

// Obtém estatísticas do registry
export function getResourceStats() {
  const resources = getRegisteredResources();
  const byType = {};
  const byState = {};
  let totalMemory = 0;

  resources.forEach(r => {
    const state = r.getState();
    (byType as Record<string, number>)[state.type] = ((byType as Record<string, number>)[state.type] || 0) + 1;
    (byState as Record<string, number>)[state.state] = ((byState as Record<string, number>)[state.state] || 0) + 1;
    totalMemory += state.memoryEstimate || 0;
  });

  return {
    total: resources.length,
    byType,
    byState,
    totalMemoryEstimate: totalMemory
  };
}

export function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    resourceTypes: Object.keys(RESOURCE_TYPES).length,
    cleanupPolicies: Object.keys(CLEANUP_POLICIES).length,
    registeredResources: _resourceRegistry.size
  };
}

export function healthCheck() {
  const stats = getResourceStats();
  return {
    status: 'HEALTHY',
    version: VERSION,
    moduleId: MODULE_ID,
    stats
  };
}

export default {
  VERSION, MODULE_ID,
  RESOURCE_TYPES, RESOURCE_STATES, CLEANUP_POLICIES,
  RESOURCE_INTERFACE,
  registerResource, getRegisteredResources, getResourcesByType,
  disposeResourcesByType, disposeAllResources,
  pauseResourcesByType, resumeResourcesByType,
  createResource, createVideoResource, createCanvasResource, createTimerResource,
  getResourceStats,
  info, healthCheck
};
