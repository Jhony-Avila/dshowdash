// Telemetry Adapter
// @version 1.2.0-DOMAIN-PURE
// @changelog v1.2.0-DOMAIN-PURE: getTelemetry() via windowAdapter → window fallback (cadeia AAA)
// @changelog v1.1.0: ES5 conversion
//
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v1.2.0)
// ═══════════════════════════════════════════════════════════════
// RESOLVES Telemetry via getTelemetry():
//   1. windowAdapter.get('Telemetry') — adapter layer
//   2. windowAdapter.get('TelemetryCore') — adapter layer alt
//   3. window.Telemetry || window.TelemetryCore — último fallback
// ═══════════════════════════════════════════════════════════════
'use strict';

const MODULE_ID = 'telemetry-adapter';
const VERSION = '1.2.0-DOMAIN-PURE';

interface TelemetryLike {
  track?: (event: string, payload: Record<string, unknown>) => void;
  error?: (event: string, payload: Record<string, unknown>) => void;
  info?: (event: string, payload: Record<string, unknown>) => void;
  warn?: (event: string, payload: Record<string, unknown>) => void;
}

interface TelemetryAdapterOptions {
  namespace?: string;
  enabled?: boolean;
}

function createTelemetryAdapter(options?: TelemetryAdapterOptions) {
  if (options === undefined) options = {};
  const namespace = options.namespace || 'bootstrap-v2';
  const enabled = options.enabled !== false;

  const timers: Record<string, number> = {};
  const metrics = { events: 0, errors: 0, warnings: 0 };

  // v1.2.0: Resolver via windowAdapter → window fallback
  function getTelemetry(): TelemetryLike | null {
    if (typeof window === 'undefined') return null;
    if (window.Core && window.Core.windowAdapter && window.Core.windowAdapter.get) {
      let resolved = window.Core.windowAdapter.get('Telemetry');
      if (resolved) return resolved as TelemetryLike;
      resolved = window.Core.windowAdapter.get('TelemetryCore');
      if (resolved) return resolved as TelemetryLike;
    }
    return (window.Telemetry || window.TelemetryCore || null) as TelemetryLike | null;
  }

  function formatEvent(event: string): string { return namespace + ':' + event; }
  function formatPayload(payload: Record<string, unknown>): Record<string, unknown> { return Object.assign({}, payload, { namespace: namespace, timestamp: Date.now() }); }

  return {
    track: function(event: string, payload?: Record<string, unknown>) {
      if (payload === undefined) payload = {};
      if (!enabled) return;
      metrics.events++;
      const telemetry = getTelemetry();
      if (telemetry && telemetry.track) {
        telemetry.track(formatEvent(event), formatPayload(payload));
      }
    },

    error: function(event: string, payload?: Record<string, unknown>) {
      if (payload === undefined) payload = {};
      metrics.errors++;
      const telemetry = getTelemetry();
      if (telemetry && telemetry.error) {
        telemetry.error(formatEvent(event), formatPayload(payload));
      } else if (telemetry && telemetry.track) {
        telemetry.track(formatEvent(event), Object.assign({}, formatPayload(payload), { level: 'error' }));
      }
    },

    logInfo: function(event: string, payload?: Record<string, unknown>) {
      if (payload === undefined) payload = {};
      if (!enabled) return;
      const telemetry = getTelemetry();
      if (telemetry && telemetry.info) {
        telemetry.info(formatEvent(event), formatPayload(payload));
      } else {
        this.track(event, Object.assign({}, payload, { level: 'info' }));
      }
    },

    warn: function(event: string, payload?: Record<string, unknown>) {
      if (payload === undefined) payload = {};
      metrics.warnings++;
      const telemetry = getTelemetry();
      if (telemetry && telemetry.warn) {
        telemetry.warn(formatEvent(event), formatPayload(payload));
      } else {
        this.track(event, Object.assign({}, payload, { level: 'warn' }));
      }
    },

    startTimer: function(label: string) { timers[label] = performance.now(); },

    endTimer: function(label: string) {
      const start = timers[label];
      if (!start) return 0;
      const duration = Math.round(performance.now() - start);
      delete timers[label];
      this.track('timer', { label: label, duration: duration });
      return duration;
    },

    getMetrics: function() { return Object.assign({}, metrics); },

    getInfo: function() {
      return { moduleId: MODULE_ID, version: VERSION, hasTelemetry: !!getTelemetry(), enabled: enabled, metrics: Object.assign({}, metrics) };
    }
  };
}

export { createTelemetryAdapter, MODULE_ID, VERSION };
export default createTelemetryAdapter;
