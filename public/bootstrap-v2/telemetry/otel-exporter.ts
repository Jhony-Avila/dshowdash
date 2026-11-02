
// OpenTelemetry Exporter - Trace & Metrics Export
// @version 1.0.1-CONTRACTS
// @changelog v1.0.1-CONTRACTS: Dependency Contract formalizado
// @description Sprint 7B #13 - Export de métricas no formato OpenTelemetry
// @changelog v1.0.0-OTEL: Versão inicial
//
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v1.0.1)
// ═══════════════════════════════════════════════════════════════
// IMPORTS: None (self-contained)
// PROVIDES: init(), createSpan(), startBootTrace(), startPhaseSpan(),
//   startModuleSpan(), flush(), getExportData(), getTraceContext(), shutdown()
// BROWSER APIs:
//   fetch — LEGÍTIMO: OTLP HTTP export to collector endpoint
//   AbortSignal.timeout — LEGÍTIMO: request timeout control
// WINDOW ACCESS: None (no window.* globals)
import { createHealthResult, HEALTH_STATUS } from '../contracts/health-contract.ts';
// ═══════════════════════════════════════════════════════════════
'use strict';

var MODULE_ID = 'otel-exporter';
var VERSION = '1.1.0-HEALTH-CONTRACT';

// Configuration
var _config: {
  enabled: boolean;
  endpoint: string | null;
  serviceName: string;
  serviceVersion: string;
  environment: string;
  batchSize: number;
  flushIntervalMs: number;
  timeout: number;
  headers: Record<string, string>;
} = {
  enabled: false,
  endpoint: null,
  serviceName: 'bootstrap-v2',
  serviceVersion: '3.3.0',
  environment: 'production',
  batchSize: 10,
  flushIntervalMs: 5000,
  timeout: 10000,
  headers: {}
};

// State
var _initialized = false;
var _bootTraceId: string | null = null;
var _bootSpanId: string | null = null;
var _spans: Record<string, unknown>[] = [];
var _pendingSpans: Record<string, unknown>[] = [];
var _flushTimer: ReturnType<typeof setInterval> | null = null;
var _metrics = {
  spansCreated: 0,
  spansExported: 0,
  spansFailed: 0,
  flushCount: 0
};

// Generate trace/span IDs (simplified, not full OTel spec)
function generateTraceId() {
  var chars = '0123456789abcdef';
  var id = '';
  for (var i = 0; i < 32; i++) {
    id += chars[Math.floor(Math.random() * 16)];
  }
  return id;
}

function generateSpanId() {
  var chars = '0123456789abcdef';
  var id = '';
  for (var i = 0; i < 16; i++) {
    id += chars[Math.floor(Math.random() * 16)];
  }
  return id;
}

// Get timestamp in nanoseconds (OTel format)
function getNanoTimestamp() {
  return Date.now() * 1000000;
}

// Initialize exporter
function init(options?: Record<string, unknown>) {
  if (options === undefined) options = {};
  
  _config.enabled = options.enabled !== false;
  _config.endpoint = (options.endpoint as string) || null;
  _config.serviceName = (options.serviceName as string) || _config.serviceName;
  _config.serviceVersion = (options.serviceVersion as string) || _config.serviceVersion;
  _config.environment = (options.environment as string) || _config.environment;
  _config.batchSize = (options.batchSize as number) || _config.batchSize;
  _config.flushIntervalMs = (options.flushIntervalMs as number) || _config.flushIntervalMs;
  _config.timeout = (options.timeout as number) || _config.timeout;
  _config.headers = (options.headers as Record<string, string>) || {};
  
  _initialized = true;
  
  // Start flush timer
  if (_config.enabled && _config.endpoint) {
    _startFlushTimer();
  }
  
  return {
    success: true,
    config: {
      enabled: _config.enabled,
      endpoint: _config.endpoint ? 'configured' : 'not-configured',
      serviceName: _config.serviceName
    }
  };
}

// Start periodic flush
function _startFlushTimer() {
  if (_flushTimer) clearInterval(_flushTimer);
  
  _flushTimer = setInterval(function() {
    if (_pendingSpans.length > 0) {
      flush();
    }
  }, _config.flushIntervalMs);
}

// Stop flush timer
function _stopFlushTimer() {
  if (_flushTimer) {
    clearInterval(_flushTimer);
    _flushTimer = null;
  }
}

// Create a span
function createSpan(name: string, options?: Record<string, unknown>) {
  if (options === undefined) options = {};
  
  var spanId = generateSpanId();
  var traceId = (options.traceId as string) || _bootTraceId || generateTraceId();
  var parentSpanId = (options.parentSpanId as string) || _bootSpanId || null;
  
  var span: {
    traceId: string;
    spanId: string;
    parentSpanId: string | null;
    name: string;
    kind: unknown;
    startTimeUnixNano: number;
    endTimeUnixNano: number | null;
    attributes: Record<string, unknown>[];
    events: Record<string, unknown>[];
    status: Record<string, unknown>;
    resource: Record<string, string>;
  } = {
    traceId: traceId,
    spanId: spanId,
    parentSpanId: parentSpanId,
    name: name,
    kind: options.kind || 'INTERNAL',
    startTimeUnixNano: getNanoTimestamp(),
    endTimeUnixNano: null,
    attributes: [],
    events: [],
    status: { code: 'UNSET' },
    resource: {
      'service.name': _config.serviceName,
      'service.version': _config.serviceVersion,
      'deployment.environment': _config.environment
    }
  };
  
  // Add initial attributes
  if (options.attributes) {
    var initAttrs = options.attributes as Record<string, unknown>;
    Object.keys(initAttrs).forEach(function(key) {
      span.attributes.push({
        key: key,
        value: { stringValue: String(initAttrs[key]) }
      });
    });
  }
  
  _spans.push(span);
  _metrics.spansCreated++;
  
  return {
    spanId: spanId,
    traceId: traceId,
    
    setAttribute: function(key: string, value: unknown) {
      span.attributes.push({
        key: key,
        value: _formatAttributeValue(value)
      });
      return this;
    },

    setAttributes: function(attrs: Record<string, unknown>) {
      Object.keys(attrs).forEach(function(key) {
        span.attributes.push({
          key: key,
          value: _formatAttributeValue(attrs[key])
        });
      });
      return this;
    },

    addEvent: function(name: string, attributes?: Record<string, unknown>) {
      span.events.push({
        name: name,
        timeUnixNano: getNanoTimestamp(),
        attributes: attributes ? Object.keys(attributes).map(function(key) {
          return { key: key, value: _formatAttributeValue(attributes[key]) };
        }) : []
      });
      return this;
    },
    
    setStatus: function(code: string, message?: string) {
      span.status = {
        code: code,
        message: message || null
      } as any;
      return this;
    },
    
    end: function(endTime?: number) {
      span.endTimeUnixNano = endTime ? endTime * 1000000 : getNanoTimestamp();
      
      // Move to pending for export
      var idx = _spans.indexOf(span);
      if (idx !== -1) {
        _spans.splice(idx, 1);
        _pendingSpans.push(span);
      }
      
      // Auto-flush if batch size reached
      if (_pendingSpans.length >= _config.batchSize) {
        flush();
      }
      
      return this;
    },
    
    getSpan: function() {
      return span;
    }
  };
}

// Format attribute value for OTel
function _formatAttributeValue(value: unknown): Record<string, unknown> {
  if (typeof value === 'string') {
    return { stringValue: value };
  } else if (typeof value === 'number') {
    if (Number.isInteger(value)) {
      return { intValue: String(value) };
    }
    return { doubleValue: value };
  } else if (typeof value === 'boolean') {
    return { boolValue: value };
  } else if (Array.isArray(value)) {
    return { 
      arrayValue: { 
        values: value.map(function(v) { return _formatAttributeValue(v); }) 
      } 
    };
  }
  return { stringValue: String(value) };
}

// Start boot trace
function startBootTrace(bootId?: string) {
  _bootTraceId = generateTraceId();
  _bootSpanId = null;
  
  var rootSpan = createSpan('bootstrap-v2:boot', {
    traceId: _bootTraceId,
    kind: 'INTERNAL',
    attributes: {
      'boot.id': bootId || _bootTraceId,
      'boot.start_time': new Date().toISOString()
    }
  });
  
  _bootSpanId = rootSpan.spanId;
  
  return rootSpan;
}

// Create phase span
function startPhaseSpan(phaseId: string, phaseName: string, options?: Record<string, unknown>) {
  if (options === undefined) options = {};
  
  return createSpan('phase:' + phaseId, {
    traceId: _bootTraceId,
    parentSpanId: options.parentSpanId || _bootSpanId,
    kind: 'INTERNAL',
    attributes: {
      'phase.id': phaseId,
      'phase.name': phaseName || phaseId,
      'phase.critical': options.critical ? 'true' : 'false',
      'phase.order': options.order !== undefined ? String(options.order) : null
    }
  });
}

// Create module span
function startModuleSpan(phaseId: string, moduleId: string, moduleName: string, parentSpanId?: string) {
  return createSpan('module:' + moduleId, {
    traceId: _bootTraceId,
    parentSpanId: parentSpanId || _bootSpanId,
    kind: 'INTERNAL',
    attributes: {
      'module.id': moduleId,
      'module.name': moduleName || moduleId,
      'module.phase': phaseId
    }
  });
}

// Build OTLP export payload
function _buildExportPayload(spans: Record<string, unknown>[]) {
  return {
    resourceSpans: [{
      resource: {
        attributes: [
          { key: 'service.name', value: { stringValue: _config.serviceName } },
          { key: 'service.version', value: { stringValue: _config.serviceVersion } },
          { key: 'deployment.environment', value: { stringValue: _config.environment } }
        ]
      },
      scopeSpans: [{
        scope: {
          name: MODULE_ID,
          version: VERSION
        },
        spans: spans.map(function(s: Record<string, unknown>) {
          return {
            traceId: s.traceId,
            spanId: s.spanId,
            parentSpanId: s.parentSpanId || '',
            name: s.name,
            kind: s.kind === 'INTERNAL' ? 1 : s.kind === 'SERVER' ? 2 : s.kind === 'CLIENT' ? 3 : 1,
            startTimeUnixNano: String(s.startTimeUnixNano),
            endTimeUnixNano: String(s.endTimeUnixNano || getNanoTimestamp()),
            attributes: s.attributes,
            events: s.events,
            status: s.status
          };
        })
      }]
    }]
  };
}

// Flush pending spans to endpoint
async function flush() {
  if (!_config.enabled || !_config.endpoint || _pendingSpans.length === 0) {
    return { success: true, exported: 0, reason: 'nothing-to-flush' };
  }
  
  var spansToExport = _pendingSpans.slice();
  _pendingSpans = [];
  
  var payload = _buildExportPayload(spansToExport);
  
  try {
    var response = await fetch(_config.endpoint, {
      method: 'POST',
      headers: Object.assign({
        'Content-Type': 'application/json'
      }, _config.headers),
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout ? AbortSignal.timeout(_config.timeout) : undefined
    });
    
    if (response.ok) {
      _metrics.spansExported += spansToExport.length;
      _metrics.flushCount++;
      return { success: true, exported: spansToExport.length };
    } else {
      // Put spans back for retry
      _pendingSpans = spansToExport.concat(_pendingSpans);
      _metrics.spansFailed += spansToExport.length;
      return { success: false, error: 'HTTP ' + response.status, exported: 0 };
    }
  } catch (e: any) {
    // Put spans back for retry
    _pendingSpans = spansToExport.concat(_pendingSpans);
    _metrics.spansFailed += spansToExport.length;
    return { success: false, error: e.message, exported: 0 };
  }
}

// Get export data without sending (for debugging/logging)
function getExportData() {
  var allSpans = _spans.concat(_pendingSpans);
  if (allSpans.length === 0) return null;
  return _buildExportPayload(allSpans);
}

// Get current trace context
function getTraceContext() {
  return {
    traceId: _bootTraceId,
    spanId: _bootSpanId
  };
}

// Shutdown exporter
function shutdown() {
  _stopFlushTimer();
  
  // Final flush
  if (_pendingSpans.length > 0) {
    flush();
  }
  
  _initialized = false;
}

// Reset state
function reset() {
  _stopFlushTimer();
  _bootTraceId = null;
  _bootSpanId = null;
  _spans = [];
  _pendingSpans = [];
  _metrics = {
    spansCreated: 0,
    spansExported: 0,
    spansFailed: 0,
    flushCount: 0
  };
}

function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    initialized: _initialized,
    enabled: _config.enabled,
    endpoint: _config.endpoint ? 'configured' : null,
    serviceName: _config.serviceName,
    activeSpans: _spans.length,
    pendingSpans: _pendingSpans.length,
    metrics: Object.assign({}, _metrics),
    traceContext: getTraceContext(),
    improvements: ['#13-OpenTelemetryExport']
  };
}

function healthCheck() {
  var status: string = HEALTH_STATUS.HEALTHY;

  if (!_initialized) {
    status = HEALTH_STATUS.DEGRADED;
  } else if (!_config.enabled) {
    status = HEALTH_STATUS.DEGRADED;
  } else if (_metrics.spansFailed > _metrics.spansExported * 0.1) {
    status = HEALTH_STATUS.DEGRADED;
  }

  return createHealthResult({
    status: status,
    moduleId: MODULE_ID,
    version: VERSION,
    details: {
      enabled: _config.enabled,
      initialized: _initialized,
      pendingSpans: _pendingSpans.length,
      exportSuccessRate: _metrics.spansExported > 0
        ? Math.round((_metrics.spansExported / (_metrics.spansExported + _metrics.spansFailed)) * 100)
        : 100
    }
  });
}

export {
  init,
  createSpan,
  startBootTrace,
  startPhaseSpan,
  startModuleSpan,
  flush,
  getExportData,
  getTraceContext,
  shutdown,
  reset,
  info,
  healthCheck,
  MODULE_ID,
  VERSION
};

export default {
  init: init,
  createSpan: createSpan,
  startBootTrace: startBootTrace,
  startPhaseSpan: startPhaseSpan,
  startModuleSpan: startModuleSpan,
  flush: flush,
  getExportData: getExportData,
  getTraceContext: getTraceContext,
  shutdown: shutdown,
  reset: reset,
  info: info,
  healthCheck: healthCheck,
  MODULE_ID: MODULE_ID,
  VERSION: VERSION
};
