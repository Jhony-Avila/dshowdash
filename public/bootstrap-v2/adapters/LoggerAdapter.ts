// Logger Adapter
// @version 1.5.0-DOMAIN-PURE
// @changelog v1.5.0-DOMAIN-PURE: _initPorts() via windowAdapter → window.Logger fallback (cadeia AAA)
// @changelog v1.4.0: ES5 conversion
//
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v1.5.0)
// ═══════════════════════════════════════════════════════════════
// RESOLVES Logger via _initPorts():
//   1. windowAdapter.get('Logger') — adapter layer
//   2. window.Logger               — último fallback
// ACCEPTS injection via injectPorts({ logger })
// ═══════════════════════════════════════════════════════════════
'use strict';

const MODULE_ID = 'logger-adapter';
const VERSION = '1.5.0-DOMAIN-PURE';

const hasWindow = typeof window !== 'undefined';

interface LoggerLike {
  debug?: (message: string, data: Record<string, unknown>) => void;
  info?: (message: string, data: Record<string, unknown>) => void;
  warn?: (message: string, data: Record<string, unknown>) => void;
  error?: (message: string, data: Record<string, unknown>) => void;
}

interface Ports {
  logger: LoggerLike | null;
  _initialized: boolean;
  [key: string]: unknown;
}

const _ports: Ports = { logger: null, _initialized: false };

// v1.5.0: Resolver via windowAdapter → window fallback
function _resolveGlobal(name: string): unknown {
  if (!hasWindow) return null;
  if (window.Core && window.Core.windowAdapter && window.Core.windowAdapter.get) {
    const resolved = window.Core.windowAdapter.get(name);
    if (resolved) return resolved;
  }
  return (window as unknown as Record<string, unknown>)[name] || null;
}

function _initPorts(): void {
  if (_ports._initialized) return;
  if (hasWindow) { _ports.logger = _resolveGlobal('Logger') as LoggerLike | null; }
  _ports._initialized = true;
}

function _getPort(name: string): unknown { if (!_ports._initialized) _initPorts(); return _ports[name] || null; }

function injectPorts(ports: Record<string, unknown>): void {
  if (ports) {
    for (const k in ports) {
      if (k !== '_initialized' && ports.hasOwnProperty(k)) _ports[k] = ports[k];
    }
  }
  _ports._initialized = true;
}

function getPorts() { return Object.assign({}, _ports); }

interface LoggerAdapterOptions {
  prefix?: string;
  debug?: boolean;
}

function createLoggerAdapter(options?: LoggerAdapterOptions) {
  if (options === undefined) options = {};
  const prefix = options.prefix || 'bootstrap-v2';
  const debug = options.debug || false;

  function formatMessage(message: string): string { return '[' + prefix + '] ' + message; }
  function formatData(data: Record<string, unknown>): Record<string, unknown> { return Object.assign({}, data, { module: prefix, timestamp: Date.now() }); }
  function shouldLog(level: string): boolean { if (level === 'debug' && !debug) return false; return true; }

  return {
    debug: function(message: string, data?: Record<string, unknown>) {
      if (data === undefined) data = {};
      if (!shouldLog('debug')) return;
      const logger = _getPort('logger') as LoggerLike | null;
      if (logger && logger.debug) { logger.debug(formatMessage(message), formatData(data)); }
    },
    info: function(message: string, data?: Record<string, unknown>) {
      if (data === undefined) data = {};
      if (!shouldLog('info')) return;
      const logger = _getPort('logger') as LoggerLike | null;
      if (logger && logger.info) { logger.info(formatMessage(message), formatData(data)); }
    },
    warn: function(message: string, data?: Record<string, unknown>) {
      if (data === undefined) data = {};
      if (!shouldLog('warn')) return;
      const logger = _getPort('logger') as LoggerLike | null;
      if (logger && logger.warn) { logger.warn(formatMessage(message), formatData(data)); }
    },
    error: function(message: string, data?: Record<string, unknown>) {
      if (data === undefined) data = {};
      const logger = _getPort('logger') as LoggerLike | null;
      if (logger && logger.error) { logger.error(formatMessage(message), formatData(data)); }
    },
    getInfo: function() {
      return { moduleId: MODULE_ID, version: VERSION, hasGlobalLogger: !!_getPort('logger'), debug: debug };
    },
    healthCheck: function() {
      return { healthy: !!_getPort('logger'), version: VERSION };
    }
  };
}

export { createLoggerAdapter, injectPorts, getPorts, MODULE_ID, VERSION };
export default createLoggerAdapter;
