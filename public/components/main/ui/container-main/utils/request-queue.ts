
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-PHASE5-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: container-main:request-queue
// PURPOSE: Request Queue - Fila de requisições com prioridade
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createLogger from ./logger.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   PRIORITIES — exported value
//   REQUEST_STATES — exported value
//   createRequestQueue() — exported function
//   getRequestQueue() — exported function
//   resetRequestQueue() — exported function
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

import { createLogger } from './logger.js';

export const VERSION = '1.0.0-PHASE5';
export const MODULE_ID = 'container-main:request-queue';

// Prioridades
export const PRIORITIES = Object.freeze({
  CRITICAL: 0,
  HIGH: 1,
  NORMAL: 2,
  LOW: 3,
  BACKGROUND: 4
});

// Estados da requisição
export const REQUEST_STATES = Object.freeze({
  PENDING: 'pending',
  RUNNING: 'running',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
  RETRYING: 'retrying'
});

// Cria o Request Queue
export function createRequestQueue(options: Record<string, any> = {}) {
  const {
    maxConcurrent = 6,
    maxQueueSize = 100,
    defaultTimeout = 30000,
    defaultRetries = 3,
    retryDelay = 1000,
    retryBackoff = 2,
    onRequestStart = null,
    onRequestComplete = null,
    onRequestError = null,
    onQueueEmpty = null
  } = options;

  const _logger: ReturnType<typeof createLogger> = createLogger(MODULE_ID);
  let _queue: Record<string, unknown>[] = [];
  let _running = new Map();
  let _requestCounter = 0;
  let _paused = false;
  let _metrics = { total: 0, completed: 0, failed: 0, cancelled: 0, retried: 0 };

  // Processa próxima requisição
  function _processNext() {
    if (_paused) return;
    if (_running.size >= maxConcurrent) return;
    if (_queue.length === 0) {
      if (_running.size === 0) onQueueEmpty?.();
      return;
    }

    // Ordena por prioridade
    _queue.sort((a, b) => (a.priority as number) - (b.priority as number));
    
    const request = _queue.shift();
    // @ts-expect-error strict migration — TS2345
    _executeRequest(request);
  }

  // Executa requisição
  async function _executeRequest(request: Record<string, unknown>) {
    request.state = REQUEST_STATES.RUNNING;
    request.startedAt = Date.now();
    _running.set(request.id, request);

    onRequestStart?.({ id: request.id, url: request.url, priority: request.priority });

    const controller = new AbortController();
    request.controller = controller;

    const timeoutId = setTimeout(() => {
      controller.abort();
      _logger.warn(`Request timeout: ${request.id}`);
    // @ts-expect-error TS migration - TS2769
    }, request.timeout);

    try {
      const fetchOptions = {
        // @ts-expect-error TS migration - TS2698
        ...(request as Record<string, unknown>).options,
        signal: controller.signal
      };

      // @ts-expect-error TS migration - TS2769
      const response = await fetch(request.url, fetchOptions);
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // @ts-expect-error TS migration - TS2345
      const data = await _parseResponse(response, request.responseType);
      
      request.state = REQUEST_STATES.COMPLETED;
      request.completedAt = Date.now();
      request.response = data;
      _metrics.completed++;

      onRequestComplete?.({ id: request.id, url: request.url, data, duration: (request.completedAt as number) - (request.startedAt as number) });
      (request.resolve as (...args: unknown[]) => unknown)(data);

    } catch (error: any) {
      clearTimeout(timeoutId);

      if (error.name === 'AbortError' && request.state === REQUEST_STATES.CANCELLED) {
        _metrics.cancelled++;
        (request.reject as (...args: unknown[]) => unknown)(new Error('Request cancelled'));
      // @ts-expect-error strict migration — TS18046
      } else if (request.retries < request.maxRetries) {
        // Retry
        (request.retries as number)++;
        request.state = REQUEST_STATES.RETRYING;
        _metrics.retried++;
        _logger.warn(`Retrying request ${request.id} (${request.retries}/${request.maxRetries})`);
        
        const delay = retryDelay * Math.pow(retryBackoff, (request.retries as number) - 1);
        setTimeout(() => {
          if (request.state !== REQUEST_STATES.CANCELLED) {
            _queue.unshift(request);
            _processNext();
          }
        }, delay);
      } else {
        request.state = REQUEST_STATES.FAILED;
        request.error = error;
        _metrics.failed++;
        
        onRequestError?.({ id: request.id, url: request.url, error: error.message });
        (request.reject as (...args: unknown[]) => unknown)(error);
      }
    } finally {
      _running.delete(request.id);
      _processNext();
    }
  }

  // Parse response
  async function _parseResponse(response: Record<string, unknown>, type: string) {
    switch (type) {
      case 'json': return (response.json as (...args: unknown[]) => unknown)();
      case 'text': return (response.text as (...args: unknown[]) => unknown)();
      case 'blob': return (response.blob as (...args: unknown[]) => unknown)();
      case 'arrayBuffer': return (response.arrayBuffer as (...args: unknown[]) => unknown)();
      case 'formData': return (response.formData as (...args: unknown[]) => unknown)();
      default: {
        const contentType = ((response.headers as Record<string, unknown>).get as (...args: unknown[]) => unknown)('content-type') || '';
        if ((contentType as unknown[]).includes('application/json')) return (response.json as (...args: unknown[]) => unknown)();
        return (response.text as (...args: unknown[]) => unknown)();
      }
    }
  }

  const queue = {
    // Adiciona requisição à fila
    add(url: string, options: Record<string, any> = {}) {
      return new Promise((resolve, reject) => {
        if (_queue.length >= maxQueueSize) {
          reject(new Error('Queue is full'));
          return;
        }

        const request = {
          id: `req-${++_requestCounter}`,
          url,
          options: options.fetchOptions || {},
          priority: options.priority ?? PRIORITIES.NORMAL,
          timeout: options.timeout ?? defaultTimeout,
          maxRetries: options.retries ?? defaultRetries,
          responseType: options.responseType || 'auto',
          retries: 0,
          state: REQUEST_STATES.PENDING,
          createdAt: Date.now(),
          resolve,
          reject,
          meta: options.meta || {}
        };

        _queue.push(request);
        _metrics.total++;
        _logger.debug(`Request queued: ${request.id} (priority: ${request.priority})`);
        
        _processNext();
      });
    },

    // Shortcuts
    get(url: string, options: Record<string, any> = {}) {
      return this.add(url, { ...options, fetchOptions: { method: 'GET', ...options.fetchOptions } });
    },

    post(url: string, body: unknown, options: Record<string, any> = {}) {
      const fetchOptions = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...options.headers },
        body: typeof body === 'string' ? body : JSON.stringify(body),
        ...options.fetchOptions
      };
      return this.add(url, { ...options, fetchOptions });
    },

    put(url: string, body: unknown, options: Record<string, any> = {}) {
      const fetchOptions = {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...options.headers },
        body: typeof body === 'string' ? body : JSON.stringify(body),
        ...options.fetchOptions
      };
      return this.add(url, { ...options, fetchOptions });
    },

    delete(url: string, options: Record<string, any> = {}) {
      return this.add(url, { ...options, fetchOptions: { method: 'DELETE', ...options.fetchOptions } });
    },

    // Cancela requisição
    cancel(requestId: unknown) {
      // Verifica na fila
      const queueIndex = _queue.findIndex(r => r.id === requestId);
      if (queueIndex !== -1) {
        const request = _queue.splice(queueIndex, 1)[0];
        request.state = REQUEST_STATES.CANCELLED;
        (request.reject as (...args: unknown[]) => unknown)(new Error('Request cancelled'));
        _metrics.cancelled++;
        return true;
      }

      // Verifica em execução
      const running = _running.get(requestId);
      if (running) {
        running.state = REQUEST_STATES.CANCELLED;
        running.controller?.abort();
        return true;
      }

      return false;
    },

    // Cancela todas
    cancelAll() {
      // Cancela fila
      for (const request of _queue) {
        request.state = REQUEST_STATES.CANCELLED;
        (request.reject as (...args: unknown[]) => unknown)(new Error('All requests cancelled'));
      }
      _metrics.cancelled += _queue.length;
      _queue = [];

      // Cancela em execução
      for (const [id, request] of _running) {
        request.state = REQUEST_STATES.CANCELLED;
        request.controller?.abort();
      }
    },

    // Pausa/Resume
    pause() {
      _paused = true;
      _logger.debug('Queue paused');
    },

    resume() {
      _paused = false;
      _logger.debug('Queue resumed');
      _processNext();
    },

    isPaused() {
      return _paused;
    },

    // Status
    getStatus() {
      return {
        queued: _queue.length,
        running: _running.size,
        paused: _paused,
        maxConcurrent
      };
    },

    // Métricas
    getMetrics() {
      return {
        ..._metrics,
        successRate: _metrics.total > 0 ? `${((_metrics.completed / _metrics.total) * 100).toFixed(2)}%` : '0%',
        ...this.getStatus()
      };
    },

    resetMetrics() {
      _metrics = { total: 0, completed: 0, failed: 0, cancelled: 0, retried: 0 };
    },

    // Lista requisições pendentes
    listPending() {
      return _queue.map(r => ({
        id: r.id,
        url: r.url,
        priority: r.priority,
        state: r.state,
        createdAt: r.createdAt
      }));
    },

    // Lista requisições em execução
    listRunning() {
      return Array.from(_running.values()).map(r => ({
        id: r.id,
        url: r.url,
        priority: r.priority,
        state: r.state,
        startedAt: r.startedAt,
        retries: r.retries
      }));
    },

    // Health check
    healthCheck() {
      const status = this.getStatus();
      let health = 'HEALTHY';
      if (status.queued > maxQueueSize * 0.8) health = 'WARNING';
      if (status.queued >= maxQueueSize) health = 'DEGRADED';
      if (_paused) health = 'PAUSED';

      return {
        status: health,
        version: VERSION,
        moduleId: MODULE_ID,
        ...status,
        metrics: _metrics
      };
    },

    // Info
    info() {
      return {
        moduleId: MODULE_ID,
        version: VERSION,
        maxConcurrent,
        maxQueueSize,
        defaultTimeout,
        defaultRetries,
        priorities: Object.keys(PRIORITIES)
      };
    },

    // Destroy
    destroy() {
      this.cancelAll();
      _queue = [];
      _running.clear();
    }
  };

  return queue;
}

// Singleton
let _instance: Record<string, unknown> | null = null;

export function getRequestQueue(options = {}) {
  if (!_instance) {
    _instance = createRequestQueue(options);
  }
  return _instance;
}

export function resetRequestQueue() {
  if (_instance) {
    (_instance.destroy as (...args: unknown[]) => unknown)();
    _instance = null;
  }
}

export function info() {
  return { moduleId: MODULE_ID, version: VERSION, priorities: Object.keys(PRIORITIES) };
}

export function healthCheck() {
  if (_instance) return (_instance.healthCheck as (...args: unknown[]) => unknown)();
  return { status: 'NOT_INITIALIZED', version: VERSION, moduleId: MODULE_ID };
}

export default {
  VERSION, MODULE_ID, PRIORITIES, REQUEST_STATES,
  createRequestQueue, getRequestQueue, resetRequestQueue,
  info, healthCheck
};
