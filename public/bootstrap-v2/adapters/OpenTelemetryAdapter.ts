
// OpenTelemetry Adapter
// @version 1.1.0-HEALTH-CONTRACT
// @changelog v1.1.0-HEALTH-CONTRACT: healthCheck migrado para HEALTH CONTRACT v1.0.0 (createHealthResult + HEALTH_STATUS)
// @changelog v1.0.1-CONTRACTS: Dependency Contract formalizado
// @description #13 - Exportação de métricas em formato OpenTelemetry
// @changelog v1.0.0-OBSERVABILITY: Versão inicial
//
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v1.1.0)
// ═══════════════════════════════════════════════════════════════
// IMPORTS:
//   createHealthResult, HEALTH_STATUS from contracts/health-contract.ts
// PROVIDES: createSpan(), endSpan(), addSpanEvent(), recordMetric(),
//   recordCounter(), recordHistogram(), recordGauge(), startTrace(),
//   endTrace(), exportSpans(), exportMetrics(), recordBootPhase(),
//   recordBootComplete(), configure()
// WINDOW ACCESS: None (no window.* globals)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createHealthResult, HEALTH_STATUS } from '../contracts/health-contract.ts';

var MODULE_ID = 'opentelemetry-adapter';
var VERSION = '1.1.0-HEALTH-CONTRACT';

// OpenTelemetry Semantic Conventions
var OTEL_ATTRIBUTES = {
  SERVICE_NAME: 'service.name',
  SERVICE_VERSION: 'service.version',
  SERVICE_NAMESPACE: 'service.namespace',
  DEPLOYMENT_ENVIRONMENT: 'deployment.environment',

  // Bootstrap specific
  BOOT_PHASE_ID: 'bootstrap.phase.id',
  BOOT_PHASE_NAME: 'bootstrap.phase.name',
  BOOT_MODULE_ID: 'bootstrap.module.id',
  BOOT_SUCCESS: 'bootstrap.success',
  BOOT_DEGRADED: 'bootstrap.degraded',
  BOOT_DURATION_MS: 'bootstrap.duration_ms',
  BOOT_HEALTH_STATUS: 'bootstrap.health.status',
  BOOT_HEALTH_SCORE: 'bootstrap.health.score'
};

// Span status codes
var SPAN_STATUS = {
  UNSET: 0,
  OK: 1,
  ERROR: 2
};

// Metric types
var METRIC_TYPES = {
  COUNTER: 'counter',
  HISTOGRAM: 'histogram',
  GAUGE: 'gauge'
};

// Type definitions
interface OtelAttribute {
  key: string;
  value: Record<string, string | number | boolean>;
}

interface SpanEvent {
  timeUnixNano: number;
  name: string;
  attributes: OtelAttribute[];
}

interface Span {
  traceId: string;
  spanId: string;
  parentSpanId: string | null;
  name: string;
  kind: string;
  startTimeUnixNano: number;
  endTimeUnixNano: number | null;
  attributes: OtelAttribute[];
  status: { code: number; message?: string };
  events: SpanEvent[];
}

interface Metric {
  name: string;
  description: string;
  unit: string;
  type: string;
  value: number;
  attributes: OtelAttribute[];
  timestamp: number;
}

interface OtelConfig {
  serviceName: string;
  serviceVersion: string;
  serviceNamespace: string;
  environment: string;
  enabled: boolean;
  exportEndpoint: string | null;
  batchSize: number;
  flushInterval: number;
}

interface ConfigureOptions {
  serviceName?: string;
  serviceVersion?: string;
  serviceNamespace?: string;
  environment?: string;
  enabled?: boolean;
  exportEndpoint?: string;
}

// Internal storage for spans and metrics
var _spans: Span[] = [];
var _metrics: Metric[] = [];
var _maxSpans = 100;
var _maxMetrics = 500;

// Configuration
var _config: OtelConfig = {
  serviceName: 'dshowdash-bootstrap',
  serviceVersion: '2.8.0-PERSISTENCE',
  serviceNamespace: 'bootstrap-v2',
  environment: 'production',
  enabled: true,
  exportEndpoint: null,
  batchSize: 50,
  flushInterval: 30000
};

// Generate trace/span IDs
function generateTraceId(): string {
  var chars = '0123456789abcdef';
  var id = '';
  for (var i = 0; i < 32; i++) {
    id += chars[Math.floor(Math.random() * 16)];
  }
  return id;
}

function generateSpanId(): string {
  var chars = '0123456789abcdef';
  var id = '';
  for (var i = 0; i < 16; i++) {
    id += chars[Math.floor(Math.random() * 16)];
  }
  return id;
}

// Create a span (trace segment)
function createSpan(name: string, attributes: Record<string, string | number | boolean> | undefined, parentSpanId: string | null): Span {
  var span: Span = {
    traceId: _currentTraceId || generateTraceId(),
    spanId: generateSpanId(),
    parentSpanId: parentSpanId || null,
    name: name,
    kind: 'INTERNAL',
    startTimeUnixNano: Date.now() * 1000000,
    endTimeUnixNano: null,
    attributes: formatAttributes(Object.assign({}, getDefaultAttributes(), attributes || {})),
    status: { code: SPAN_STATUS.UNSET },
    events: []
  };

  _spans.unshift(span);
  while (_spans.length > _maxSpans) {
    _spans.pop();
  }

  return span;
}

// End a span
function endSpan(span: Span | null, status: string, errorMessage: string | undefined): Span | null {
  if (!span) return null;

  span.endTimeUnixNano = Date.now() * 1000000;
  span.status = {
    code: status === 'error' ? SPAN_STATUS.ERROR : SPAN_STATUS.OK,
    message: errorMessage || undefined
  };

  // Calculate duration and add as attribute
  var durationMs = (span.endTimeUnixNano - (span.startTimeUnixNano || 0)) / 1000000;
  span.attributes.push({
    key: OTEL_ATTRIBUTES.BOOT_DURATION_MS,
    value: { intValue: Math.round(durationMs) }
  });

  return span;
}

// Add event to span
function addSpanEvent(span: Span | null, name: string, attributes: Record<string, string | number | boolean> | undefined): void {
  if (!span) return;

  span.events.push({
    timeUnixNano: Date.now() * 1000000,
    name: name,
    attributes: formatAttributes(attributes || {})
  });
}

// Record a metric
function recordMetric(name: string, value: number, type: string | undefined, attributes: Record<string, string | number | boolean> | undefined, unit: string | undefined): Metric {
  var metric: Metric = {
    name: 'bootstrap.' + name,
    description: 'Bootstrap metric: ' + name,
    unit: unit || 'ms',
    type: type || METRIC_TYPES.GAUGE,
    value: value,
    attributes: formatAttributes(Object.assign({}, getDefaultAttributes(), attributes || {})),
    timestamp: Date.now()
  };

  _metrics.unshift(metric);
  while (_metrics.length > _maxMetrics) {
    _metrics.pop();
  }

  return metric;
}

// Convenience methods for metrics
function recordCounter(name: string, value: number, attributes: Record<string, string | number | boolean> | undefined): Metric {
  return recordMetric(name, value, METRIC_TYPES.COUNTER, attributes, '1');
}

function recordHistogram(name: string, value: number, attributes: Record<string, string | number | boolean> | undefined, unit: string | undefined): Metric {
  return recordMetric(name, value, METRIC_TYPES.HISTOGRAM, attributes, unit || 'ms');
}

function recordGauge(name: string, value: number, attributes: Record<string, string | number | boolean> | undefined, unit: string | undefined): Metric {
  return recordMetric(name, value, METRIC_TYPES.GAUGE, attributes, unit || '1');
}

// Format attributes to OTEL format
function formatAttributes(attrs: Record<string, string | number | boolean>): OtelAttribute[] {
  var formatted: OtelAttribute[] = [];
  for (var key in attrs) {
    if (attrs.hasOwnProperty(key)) {
      var value = attrs[key];
      var otelValue: Record<string, string | number | boolean> = {};

      if (typeof value === 'string') {
        otelValue = { stringValue: value };
      } else if (typeof value === 'number') {
        otelValue = Number.isInteger(value) ? { intValue: value } : { doubleValue: value };
      } else if (typeof value === 'boolean') {
        otelValue = { boolValue: value };
      } else {
        otelValue = { stringValue: String(value) };
      }

      formatted.push({ key: key, value: otelValue });
    }
  }
  return formatted;
}

// Get default attributes
function getDefaultAttributes(): Record<string, string> {
  var attrs: Record<string, string> = {};
  attrs[OTEL_ATTRIBUTES.SERVICE_NAME] = _config.serviceName;
  attrs[OTEL_ATTRIBUTES.SERVICE_VERSION] = _config.serviceVersion;
  attrs[OTEL_ATTRIBUTES.SERVICE_NAMESPACE] = _config.serviceNamespace;
  attrs[OTEL_ATTRIBUTES.DEPLOYMENT_ENVIRONMENT] = _config.environment;
  return attrs;
}

// Current trace context
var _currentTraceId: string | null = null;
var _currentParentSpanId: string | null = null;

function startTrace(name: string, attributes: Record<string, string | number | boolean> | undefined): Span {
  _currentTraceId = generateTraceId();
  _currentParentSpanId = null;
  return createSpan(name, attributes, null);
}

function endTrace(): void {
  _currentTraceId = null;
  _currentParentSpanId = null;
}

// Export data in OTLP format
function exportSpans() {
  return {
    resourceSpans: [{
      resource: {
        attributes: formatAttributes(getDefaultAttributes())
      },
      scopeSpans: [{
        scope: {
          name: MODULE_ID,
          version: VERSION
        },
        spans: _spans.map(function(s) {
          return {
            traceId: s.traceId,
            spanId: s.spanId,
            parentSpanId: s.parentSpanId,
            name: s.name,
            kind: 1,
            startTimeUnixNano: String(s.startTimeUnixNano),
            endTimeUnixNano: s.endTimeUnixNano ? String(s.endTimeUnixNano) : undefined,
            attributes: s.attributes,
            status: s.status,
            events: s.events
          };
        })
      }]
    }]
  };
}

function exportMetrics() {
  return {
    resourceMetrics: [{
      resource: {
        attributes: formatAttributes(getDefaultAttributes())
      },
      scopeMetrics: [{
        scope: {
          name: MODULE_ID,
          version: VERSION
        },
        metrics: _metrics.map(function(m) {
          var dataPoint = {
            attributes: m.attributes,
            timeUnixNano: String(m.timestamp * 1000000),
            asDouble: m.value
          };

          var metricData: Record<string, unknown> = {
            name: m.name,
            description: m.description,
            unit: m.unit
          };

          if (m.type === METRIC_TYPES.COUNTER) {
            metricData.sum = {
              dataPoints: [dataPoint],
              aggregationTemporality: 2,
              isMonotonic: true
            };
          } else if (m.type === METRIC_TYPES.HISTOGRAM) {
            metricData.histogram = {
              dataPoints: [Object.assign({}, dataPoint, { count: 1, sum: m.value })]
            };
          } else {
            metricData.gauge = {
              dataPoints: [dataPoint]
            };
          }

          return metricData;
        })
      }]
    }]
  };
}

// Bootstrap-specific helpers
function recordBootPhase(phaseId: string, phaseName: string, duration: number, success: boolean, degraded: boolean | undefined): void {
  var attrs: Record<string, string | number | boolean> = {};
  attrs[OTEL_ATTRIBUTES.BOOT_PHASE_ID] = phaseId;
  attrs[OTEL_ATTRIBUTES.BOOT_PHASE_NAME] = phaseName;
  attrs[OTEL_ATTRIBUTES.BOOT_SUCCESS] = success;
  attrs[OTEL_ATTRIBUTES.BOOT_DEGRADED] = degraded || false;

  recordHistogram('phase.duration', duration, attrs, undefined);
  recordCounter('phase.count', 1, attrs);
  if (!success) {
    recordCounter('phase.errors', 1, attrs);
  }
}

function recordBootComplete(totalTime: number, success: boolean, healthStatus: string, healthScore: number): void {
  var attrs: Record<string, string | number | boolean> = {};
  attrs[OTEL_ATTRIBUTES.BOOT_SUCCESS] = success;
  attrs[OTEL_ATTRIBUTES.BOOT_HEALTH_STATUS] = healthStatus;
  attrs[OTEL_ATTRIBUTES.BOOT_HEALTH_SCORE] = healthScore;

  recordHistogram('boot.duration', totalTime, attrs, undefined);
  recordGauge('boot.health_score', healthScore, attrs, '%');
  recordCounter('boot.count', 1, attrs);
  if (!success) {
    recordCounter('boot.failures', 1, attrs);
  }
}

// Configuration
function configure(options: ConfigureOptions): void {
  if (options.serviceName) _config.serviceName = options.serviceName;
  if (options.serviceVersion) _config.serviceVersion = options.serviceVersion;
  if (options.serviceNamespace) _config.serviceNamespace = options.serviceNamespace;
  if (options.environment) _config.environment = options.environment;
  if (options.enabled !== undefined) _config.enabled = options.enabled;
  if (options.exportEndpoint) _config.exportEndpoint = options.exportEndpoint;
}

function getConfig() {
  return Object.assign({}, _config);
}

// Clear data
function clearSpans() {
  _spans = [];
}

function clearMetrics() {
  _metrics = [];
}

function clearAll() {
  clearSpans();
  clearMetrics();
}

function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    config: getConfig(),
    spansCount: _spans.length,
    metricsCount: _metrics.length,
    improvements: ['#13-OpenTelemetryExport']
  };
}

function healthCheck() {
  var status: string = HEALTH_STATUS.HEALTHY;
  if (!_config.enabled) {
    status = HEALTH_STATUS.DEGRADED;
  }

  return createHealthResult({
    status: status,
    moduleId: MODULE_ID,
    version: VERSION,
    checks: {
      enabled: _config.enabled,
      hasSpans: _spans.length > 0,
      hasMetrics: _metrics.length > 0
    },
    details: {
      enabled: _config.enabled,
      spansCount: _spans.length,
      metricsCount: _metrics.length
    }
  });
}

export {
  OTEL_ATTRIBUTES,
  SPAN_STATUS,
  METRIC_TYPES,
  createSpan,
  endSpan,
  addSpanEvent,
  recordMetric,
  recordCounter,
  recordHistogram,
  recordGauge,
  startTrace,
  endTrace,
  exportSpans,
  exportMetrics,
  recordBootPhase,
  recordBootComplete,
  configure,
  getConfig,
  clearSpans,
  clearMetrics,
  clearAll,
  info,
  healthCheck,
  MODULE_ID,
  VERSION
};

export default {
  OTEL_ATTRIBUTES: OTEL_ATTRIBUTES,
  SPAN_STATUS: SPAN_STATUS,
  METRIC_TYPES: METRIC_TYPES,
  createSpan: createSpan,
  endSpan: endSpan,
  addSpanEvent: addSpanEvent,
  recordMetric: recordMetric,
  recordCounter: recordCounter,
  recordHistogram: recordHistogram,
  recordGauge: recordGauge,
  startTrace: startTrace,
  endTrace: endTrace,
  exportSpans: exportSpans,
  exportMetrics: exportMetrics,
  recordBootPhase: recordBootPhase,
  recordBootComplete: recordBootComplete,
  configure: configure,
  getConfig: getConfig,
  clearSpans: clearSpans,
  clearMetrics: clearMetrics,
  clearAll: clearAll,
  info: info,
  healthCheck: healthCheck,
  MODULE_ID: MODULE_ID,
  VERSION: VERSION
};
