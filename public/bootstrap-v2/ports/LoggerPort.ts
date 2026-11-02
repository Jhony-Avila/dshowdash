// Logger Port
// @version 1.4.0-DOMAIN-PURE
// @changelog v1.4.0-DOMAIN-PURE: _initPorts() via windowAdapter → window.Logger fallback (cadeia AAA)
// @changelog v1.3.0: ES5 conversion
//
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v1.4.0)
// ═══════════════════════════════════════════════════════════════
// RESOLVES Logger via _initPorts():
//   1. windowAdapter.get('Logger') — adapter layer
//   2. window.Logger               — último fallback
// ACCEPTS injection via injectPorts({ logger })
// ═══════════════════════════════════════════════════════════════
'use strict';

const MODULE_ID = 'logger-port';
const VERSION = '1.4.0-DOMAIN-PURE';

const hasWindow = typeof window !== 'undefined';
const _ports: { logger: unknown; _initialized: boolean } = { logger: null, _initialized: false };

// v1.4.0: Resolver via windowAdapter → window fallback
function _resolveGlobal(name: string) {
  if (!hasWindow) return null;
  if (window.Core && window.Core.windowAdapter && window.Core.windowAdapter.get) {
    const resolved = window.Core.windowAdapter.get(name);
    if (resolved) return resolved;
  }
  return (window as unknown as Record<string, unknown>)[name] || null;
}

function _initPorts() {
  if (_ports._initialized) return;
  if (hasWindow) { _ports.logger = _resolveGlobal('Logger'); }
  _ports._initialized = true;
}

function _getPort(name: string) { if (!_ports._initialized) _initPorts(); return (_ports as Record<string, unknown>)[name] || null; }

function injectPorts(ports: Record<string, unknown>) {
  if (ports) {
    for (const k in ports) {
      if (k !== '_initialized' && ports.hasOwnProperty(k)) (_ports as Record<string, unknown>)[k] = ports[k];
    }
  }
  _ports._initialized = true;
}

function getPorts() { return Object.assign({}, _ports); }

const LOG_LEVELS = { DEBUG: 'debug', INFO: 'info', WARN: 'warn', ERROR: 'error' };
const LOGGER_CONTRACT = { debug: 'function', info: 'function', warn: 'function', error: 'function' };

function createNullLogger() {
  return { debug: function() {}, info: function() {}, warn: function() {}, error: function() {} };
}

function createConsoleLogger(prefix?: string) {
  if (prefix === undefined) prefix = 'bootstrap-v2';

  function format(level: string, message: string, data: unknown) {
    const timestamp = new Date().toISOString().substr(11, 12);
    return ['[' + timestamp + '][' + prefix + '][' + level + ']', message, data];
  }

  return {
    debug: function(message: string, data?: unknown) {
      if (data === undefined) data = {};
      const logger = _getPort('logger') as Record<string, Function> | null;
      if (logger && logger.debug) { const args = format('DEBUG', message, data); logger.debug.apply(logger, args); }
    },
    info: function(message: string, data?: unknown) {
      if (data === undefined) data = {};
      const logger = _getPort('logger') as Record<string, Function> | null;
      if (logger && logger.debug) { const args = format('INFO', message, data); logger.debug.apply(logger, args); }
    },
    warn: function(message: string, data?: unknown) {
      if (data === undefined) data = {};
      const logger = _getPort('logger') as Record<string, Function> | null;
      if (logger && logger.warn) { const args = format('WARN', message, data); logger.warn.apply(logger, args); }
    },
    error: function(message: string, data?: unknown) {
      if (data === undefined) data = {};
      const logger = _getPort('logger') as Record<string, Function> | null;
      if (logger && logger.error) { const args = format('ERROR', message, data); logger.error.apply(logger, args); }
    }
  };
}

function validateLogger(logger: unknown) {
  if (!logger) return { valid: false, errors: ['Logger is null'] };
  const errors: string[] = [];
  const loggerObj = logger as Record<string, unknown>;
  const methods = ['debug', 'info', 'warn', 'error'];
  for (let i = 0; i < methods.length; i++) {
    if (typeof loggerObj[methods[i]] !== 'function') {
      errors.push('Missing ' + methods[i] + ' function');
    }
  }
  return { valid: errors.length === 0, errors: errors };
}

export { LOG_LEVELS, LOGGER_CONTRACT, createNullLogger, createConsoleLogger, validateLogger, injectPorts, getPorts, MODULE_ID, VERSION };
export default { LOG_LEVELS: LOG_LEVELS, LOGGER_CONTRACT: LOGGER_CONTRACT, createNullLogger: createNullLogger, createConsoleLogger: createConsoleLogger, validateLogger: validateLogger };
