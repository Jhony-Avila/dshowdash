import { createLogger } from "./logger.js";
const VERSION = "1.0.0-PHASE5";
const MODULE_ID = "container-main:request-queue";
const PRIORITIES = Object.freeze({
  CRITICAL: 0,
  HIGH: 1,
  NORMAL: 2,
  LOW: 3,
  BACKGROUND: 4
});
const REQUEST_STATES = Object.freeze({
  PENDING: "pending",
  RUNNING: "running",
  COMPLETED: "completed",
  FAILED: "failed",
  CANCELLED: "cancelled",
  RETRYING: "retrying"
});
function createRequestQueue(options = {}) {
  const {
    maxConcurrent = 6,
    maxQueueSize = 100,
    defaultTimeout = 3e4,
    defaultRetries = 3,
    retryDelay = 1e3,
    retryBackoff = 2,
    onRequestStart = null,
    onRequestComplete = null,
    onRequestError = null,
    onQueueEmpty = null
  } = options;
  const _logger = createLogger(MODULE_ID);
  let _queue = [];
  let _running = /* @__PURE__ */ new Map();
  let _requestCounter = 0;
  let _paused = false;
  let _metrics = { total: 0, completed: 0, failed: 0, cancelled: 0, retried: 0 };
  function _processNext() {
    if (_paused) return;
    if (_running.size >= maxConcurrent) return;
    if (_queue.length === 0) {
      if (_running.size === 0) onQueueEmpty?.();
      return;
    }
    _queue.sort((a, b) => a.priority - b.priority);
    const request = _queue.shift();
    _executeRequest(request);
  }
  async function _executeRequest(request) {
    request.state = REQUEST_STATES.RUNNING;
    request.startedAt = Date.now();
    _running.set(request.id, request);
    onRequestStart?.({ id: request.id, url: request.url, priority: request.priority });
    const controller = new AbortController();
    request.controller = controller;
    const timeoutId = setTimeout(() => {
      controller.abort();
      _logger.warn(`Request timeout: ${request.id}`);
    }, request.timeout);
    try {
      const fetchOptions = {
        // @ts-expect-error TS migration - TS2698
        ...request.options,
        signal: controller.signal
      };
      const response = await fetch(request.url, fetchOptions);
      clearTimeout(timeoutId);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const data = await _parseResponse(response, request.responseType);
      request.state = REQUEST_STATES.COMPLETED;
      request.completedAt = Date.now();
      request.response = data;
      _metrics.completed++;
      onRequestComplete?.({ id: request.id, url: request.url, data, duration: request.completedAt - request.startedAt });
      request.resolve(data);
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === "AbortError" && request.state === REQUEST_STATES.CANCELLED) {
        _metrics.cancelled++;
        request.reject(new Error("Request cancelled"));
      } else if (request.retries < request.maxRetries) {
        request.retries++;
        request.state = REQUEST_STATES.RETRYING;
        _metrics.retried++;
        _logger.warn(`Retrying request ${request.id} (${request.retries}/${request.maxRetries})`);
        const delay = retryDelay * Math.pow(retryBackoff, request.retries - 1);
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
        request.reject(error);
      }
    } finally {
      _running.delete(request.id);
      _processNext();
    }
  }
  async function _parseResponse(response, type) {
    switch (type) {
      case "json":
        return response.json();
      case "text":
        return response.text();
      case "blob":
        return response.blob();
      case "arrayBuffer":
        return response.arrayBuffer();
      case "formData":
        return response.formData();
      default: {
        const contentType = response.headers.get("content-type") || "";
        if (contentType.includes("application/json")) return response.json();
        return response.text();
      }
    }
  }
  const queue = {
    // Adiciona requisição à fila
    add(url, options2 = {}) {
      return new Promise((resolve, reject) => {
        if (_queue.length >= maxQueueSize) {
          reject(new Error("Queue is full"));
          return;
        }
        const request = {
          id: `req-${++_requestCounter}`,
          url,
          options: options2.fetchOptions || {},
          priority: options2.priority ?? PRIORITIES.NORMAL,
          timeout: options2.timeout ?? defaultTimeout,
          maxRetries: options2.retries ?? defaultRetries,
          responseType: options2.responseType || "auto",
          retries: 0,
          state: REQUEST_STATES.PENDING,
          createdAt: Date.now(),
          resolve,
          reject,
          meta: options2.meta || {}
        };
        _queue.push(request);
        _metrics.total++;
        _logger.debug(`Request queued: ${request.id} (priority: ${request.priority})`);
        _processNext();
      });
    },
    // Shortcuts
    get(url, options2 = {}) {
      return this.add(url, { ...options2, fetchOptions: { method: "GET", ...options2.fetchOptions } });
    },
    post(url, body, options2 = {}) {
      const fetchOptions = {
        method: "POST",
        headers: { "Content-Type": "application/json", ...options2.headers },
        body: typeof body === "string" ? body : JSON.stringify(body),
        ...options2.fetchOptions
      };
      return this.add(url, { ...options2, fetchOptions });
    },
    put(url, body, options2 = {}) {
      const fetchOptions = {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...options2.headers },
        body: typeof body === "string" ? body : JSON.stringify(body),
        ...options2.fetchOptions
      };
      return this.add(url, { ...options2, fetchOptions });
    },
    delete(url, options2 = {}) {
      return this.add(url, { ...options2, fetchOptions: { method: "DELETE", ...options2.fetchOptions } });
    },
    // Cancela requisição
    cancel(requestId) {
      const queueIndex = _queue.findIndex((r) => r.id === requestId);
      if (queueIndex !== -1) {
        const request = _queue.splice(queueIndex, 1)[0];
        request.state = REQUEST_STATES.CANCELLED;
        request.reject(new Error("Request cancelled"));
        _metrics.cancelled++;
        return true;
      }
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
      for (const request of _queue) {
        request.state = REQUEST_STATES.CANCELLED;
        request.reject(new Error("All requests cancelled"));
      }
      _metrics.cancelled += _queue.length;
      _queue = [];
      for (const [id, request] of _running) {
        request.state = REQUEST_STATES.CANCELLED;
        request.controller?.abort();
      }
    },
    // Pausa/Resume
    pause() {
      _paused = true;
      _logger.debug("Queue paused");
    },
    resume() {
      _paused = false;
      _logger.debug("Queue resumed");
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
        successRate: _metrics.total > 0 ? `${(_metrics.completed / _metrics.total * 100).toFixed(2)}%` : "0%",
        ...this.getStatus()
      };
    },
    resetMetrics() {
      _metrics = { total: 0, completed: 0, failed: 0, cancelled: 0, retried: 0 };
    },
    // Lista requisições pendentes
    listPending() {
      return _queue.map((r) => ({
        id: r.id,
        url: r.url,
        priority: r.priority,
        state: r.state,
        createdAt: r.createdAt
      }));
    },
    // Lista requisições em execução
    listRunning() {
      return Array.from(_running.values()).map((r) => ({
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
      let health = "HEALTHY";
      if (status.queued > maxQueueSize * 0.8) health = "WARNING";
      if (status.queued >= maxQueueSize) health = "DEGRADED";
      if (_paused) health = "PAUSED";
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
let _instance = null;
function getRequestQueue(options = {}) {
  if (!_instance) {
    _instance = createRequestQueue(options);
  }
  return _instance;
}
function resetRequestQueue() {
  if (_instance) {
    _instance.destroy();
    _instance = null;
  }
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, priorities: Object.keys(PRIORITIES) };
}
function healthCheck() {
  if (_instance) return _instance.healthCheck();
  return { status: "NOT_INITIALIZED", version: VERSION, moduleId: MODULE_ID };
}
var request_queue_default = {
  VERSION,
  MODULE_ID,
  PRIORITIES,
  REQUEST_STATES,
  createRequestQueue,
  getRequestQueue,
  resetRequestQueue,
  info,
  healthCheck
};
export {
  MODULE_ID,
  PRIORITIES,
  REQUEST_STATES,
  VERSION,
  createRequestQueue,
  request_queue_default as default,
  getRequestQueue,
  healthCheck,
  info,
  resetRequestQueue
};
