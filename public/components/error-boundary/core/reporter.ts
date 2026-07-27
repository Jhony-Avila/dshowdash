// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (2.6.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: components.error-boundary.core.reporter
// PURPOSE: Error reporting with batching, auto-flush, and remote endpoint
// ───────────────────────────────────────────────────────────────
// @contract CONFIGURE - configure(options) configures reporter settings
// @contract GET_CONFIG - getConfig() returns current configuration
// @contract IS_CONFIGURED - isConfigured() returns endpoint status
// @contract REPORT - report(error, metadata) adds error to queue
// @contract FLUSH - flush() sends queued errors to endpoint
// @contract START_AUTO_FLUSH - startAutoFlush() starts interval-based flushing
// @contract STOP_AUTO_FLUSH - stopAutoFlush() stops auto-flush timer
// @contract IS_AUTO_FLUSHING - isAutoFlushing() returns auto-flush status
// @contract GET_QUEUE_SIZE - getQueueSize() returns current queue size
// @contract CLEAR_QUEUE - clearQueue() clears all queued errors
// @contract GET_METRICS - getMetrics() returns reporter metrics
// @contract RESET_METRICS - resetMetrics() resets all metrics
// @contract PORTS - injectPorts()/getPorts() for dependency injection
// @contract HEALTH - healthCheck() and info() for observability
// ───────────────────────────────────────────────────────────────
// IMPORTS: createCorePorts from /core/runtime/ports-profiles.js
// IMPORTS: trackErrorEvent from ../telemetry/tracker.js
// PROVIDES: ErrorReporter, injectPorts, getPorts, healthCheck, info,
//           VERSION, MODULE_ID
// @changelog v2.6.0-P2-ENTERPRISE: Standardized DEPENDENCY CONTRACT header
// @changelog v2.5.1-ENTERPRISE: ES5 conversion (Object.values/entries → for loops)
// @changelog P17WI: Migração para PortsFactory/PortsProfiles
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createCorePorts } from '/core/runtime/ports-profiles.js';
import { trackErrorEvent } from '../telemetry/tracker.js';

export const VERSION = '2.6.0-P2-ENTERPRISE';
export const MODULE_ID = 'components.error-boundary.core.reporter';

const Ports = createCorePorts({ moduleId: MODULE_ID });

const _initPorts = () => Ports.init();
const _getPort = (name: string): unknown => Ports.get(name);

export const injectPorts = (p: unknown) => Ports.inject(p);
export const getPorts = () => Ports.snapshot();

const _getCurrentUrl = (): string => {
  _initPorts();
  const r = _getPort('router') as { getCurrentRoute?: () => { url?: string; href?: string } } | null;

  if (r && r.getCurrentRoute) {
    try {
      const route = r.getCurrentRoute();
      if (route && (route.url || route.href)) return (route.url || route.href) as string;
    } catch (e) { /* silent */ }
  }

  if (typeof window !== 'undefined' && window.location) {
    return window.location.href;
  }

  return 'unknown';
};

const CONFIG = {
  endpoint: null as string | null,
  batchSize: 10,
  flushInterval: 30000,
  maxQueueSize: 100
};

const _queue: Record<string, unknown>[] = [];
let _flushTimer: ReturnType<typeof setInterval> | null = null;

const _metrics = {
  reported: 0,
  flushed: 0,
  failed: 0,
  lastFlushAt: null as number | null
};

export const ErrorReporter = {
  configure(options: { endpoint?: string; batchSize?: number; flushInterval?: number; maxQueueSize?: number } = {}) {
    if (options.endpoint) CONFIG.endpoint = options.endpoint;
    if (typeof options.batchSize === 'number') CONFIG.batchSize = options.batchSize;
    if (typeof options.flushInterval === 'number') CONFIG.flushInterval = options.flushInterval;
    if (typeof options.maxQueueSize === 'number') CONFIG.maxQueueSize = options.maxQueueSize;

    trackErrorEvent('error:reporter:configured', {
      hasEndpoint: !!CONFIG.endpoint,
      batchSize: CONFIG.batchSize
    });

    return { ...CONFIG };
  },

  getConfig() {
    return { ...CONFIG };
  },

  isConfigured(): boolean {
    return !!CONFIG.endpoint;
  },

  report(error: Record<string, unknown>, metadata: Record<string, unknown> = {}): boolean {
    if (!CONFIG.endpoint) {
      trackErrorEvent('error:reporter:no-endpoint');
      return false;
    }

    if (_queue.length >= CONFIG.maxQueueSize) {
      trackErrorEvent('error:reporter:queue-full', { queueSize: _queue.length });
      _queue.shift();
    }

    _queue.push({
      ...error,
      metadata,
      reportedAt: Date.now(),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
      url: _getCurrentUrl()
    });

    _metrics.reported++;

    if (_queue.length >= CONFIG.batchSize) {
      this.flush();
    }

    return true;
  },

  flush(): Promise<{ success: boolean; count?: number; reason?: string; status?: number; error?: string }> {
    if (_queue.length === 0) {
      return Promise.resolve({ success: true, count: 0 });
    }

    if (!CONFIG.endpoint) {
      return Promise.resolve({ success: false, reason: 'no-endpoint' });
    }

    const batch = _queue.splice(0, CONFIG.batchSize);
    trackErrorEvent('error:reporter:flush:start', { count: batch.length });

    return fetch(CONFIG.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ errors: batch, timestamp: Date.now() })
    })
      .then(response => {
        if (response.ok) {
          _metrics.flushed += batch.length;
          _metrics.lastFlushAt = Date.now();
          trackErrorEvent('error:reporter:flush:success', { count: batch.length });
          return { success: true, count: batch.length };
        } else {
          _queue.unshift(...batch);
          _metrics.failed += batch.length;
          trackErrorEvent('error:reporter:flush:failed', { status: response.status });
          return { success: false, status: response.status };
        }
      })
      .catch(err => {
        _queue.unshift(...batch);
        _metrics.failed += batch.length;
        trackErrorEvent('error:reporter:flush:error', { error: (err as Error).message });
        return { success: false, error: (err as Error).message };
      });
  },

  startAutoFlush(): boolean {
    if (_flushTimer) return false;

    _flushTimer = setInterval(() => {
      this.flush();
    }, CONFIG.flushInterval);

    trackErrorEvent('error:reporter:auto-flush:started');
    return true;
  },

  stopAutoFlush(): boolean {
    if (!_flushTimer) return false;

    clearInterval(_flushTimer);
    _flushTimer = null;

    trackErrorEvent('error:reporter:auto-flush:stopped');
    return true;
  },

  isAutoFlushing(): boolean {
    return !!_flushTimer;
  },

  getQueueSize(): number {
    return _queue.length;
  },

  clearQueue(): number {
    const count = _queue.length;
    _queue.length = 0;
    return count;
  },

  getMetrics() {
    return {
      ..._metrics,
      queueSize: _queue.length
    };
  },

  resetMetrics(): boolean {
    _metrics.reported = 0;
    _metrics.flushed = 0;
    _metrics.failed = 0;
    _metrics.lastFlushAt = null;
    return true;
  },

  healthCheck() {
    const portsSnapshot = Ports.snapshot();
    const m = this.getMetrics();

    const checks = {
      endpointConfigured: !!CONFIG.endpoint,
      queueNotFull: m.queueSize < CONFIG.maxQueueSize * 0.8,
      lowFailureRate: m.reported === 0 || (m.failed / m.reported) < 0.3,
      portsInitialized: portsSnapshot._initialized
    };

    const passed = Object.values(checks).filter(Boolean).length;
    const total = Object.keys(checks).length;
    const issues = Object.entries(checks).filter(([, v]) => !v).map(([k]) => k);

    return {
      status: passed === total ? 'HEALTHY' : passed >= 2 ? 'DEGRADED' : 'UNHEALTHY',
      score: passed,
      maxScore: total,
      scoreDisplay: `${passed}/${total}`,
      checks,
      issues: issues.length > 0 ? issues : null,
      metrics: m,
      autoFlushing: this.isAutoFlushing(),
      configured: this.isConfigured(),
      version: VERSION,
      moduleId: MODULE_ID,
      portsInitialized: portsSnapshot._initialized,
      timestamp: Date.now()
    };
  },

  info() {
    const portsSnapshot = Ports.snapshot();

    return {
      moduleId: MODULE_ID,
      version: VERSION,
      configured: this.isConfigured(),
      config: {
        endpoint: CONFIG.endpoint ? '[configured]' : null,
        batchSize: CONFIG.batchSize,
        flushInterval: CONFIG.flushInterval,
        maxQueueSize: CONFIG.maxQueueSize
      },
      metrics: this.getMetrics(),
      autoFlushing: this.isAutoFlushing(),
      healthCheck: this.healthCheck(),
      portsInitialized: portsSnapshot._initialized,
      timestamp: Date.now()
    };
  },

  injectPorts,
  getPorts
};

export function healthCheck() {
  return ErrorReporter.healthCheck();
}

export function info() {
  return ErrorReporter.info();
}

export default ErrorReporter;
