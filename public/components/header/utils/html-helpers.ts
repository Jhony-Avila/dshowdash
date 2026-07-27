// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v2.4.0-ES6)
// ═══════════════════════════════════════════════════════════════
// MODULE: header/utils/html-helpers
// PURPOSE: HTML sanitization and element creation utilities
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createUiPorts from /core/runtime/ports-profiles.js
// PROVIDES:
//   escapeHtml() — escapes HTML entities in strings
//   sanitizeString() — sanitizes and truncates strings
//   createElementFromHTML() — creates DOM element from HTML string
//   getVersion() / setDebug() — version and debug control
//   getMetrics() / healthCheck() / info() — observability
//   injectPorts() / getPorts() — port dependency injection
//   MODULE_ID, VERSION — module identity constants
// ═══════════════════════════════════════════════════════════════
// Header - HTML Helpers Enterprise AAA
// @version 2.4.0-ES6
// @changelog v2.4.0-ES6 - Task 10.1 B04: var → const/let
'use strict';

import { createUiPorts } from '/core/runtime/ports-profiles.js';

export const VERSION = '2.4.0-ES6';
export const MODULE_ID = 'header/utils/html-helpers';

const Ports = createUiPorts({ moduleId: MODULE_ID });

function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }

export function injectPorts(p: Record<string,unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

let _debug = false;
const _debugEnabled = () => { const cfg = _getPort('config'); return _debug || (cfg && cfg.app && cfg.app.debug); };
const _log = function(level: string) {
  const args = Array.prototype.slice.call(arguments, 1);
  const logger = _getPort('logger');
  if (!logger) return;
  const prefix = `[${MODULE_ID}]`;
  if (level === 'error') { if (logger.error) logger.error(...[prefix].concat(args)); return; }
  if (level === 'warn') { if (logger.warn) logger.warn(...[prefix].concat(args)); return; }
  if (level === 'info') { if (logger.info) logger.info(...[prefix].concat(args)); return; }
  if (_debugEnabled() && logger.debug) logger.debug(...[prefix].concat(args));
};

let _metrics = { escapeHtmlCalls: 0, sanitizeStringCalls: 0, createElementCalls: 0 };

export function escapeHtml(text: string) {
  _metrics.escapeHtmlCalls++;
  const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
  // @ts-expect-error TS migration - TS2769
  return String(text).replace(/[&<>"']/g, m => (map as Record<string,unknown>)[m]);
}

export function sanitizeString(str: unknown, maxLength: number) {
  maxLength = maxLength || 200;
  _metrics.sanitizeStringCalls++;
  if (!str || typeof str !== 'string') return '';
  return escapeHtml(str.substring(0, maxLength));
}

export function createElementFromHTML(htmlString: unknown) {
  _metrics.createElementCalls++;
  const div = document.createElement('div');
  // @ts-expect-error TS migration - TS2339
  div.innerHTML = htmlString.trim();
  return div.firstChild;
}

export function getMetrics() { return Object.assign({}, _metrics); }
export function resetMetrics() { _metrics = { escapeHtmlCalls: 0, sanitizeStringCalls: 0, createElementCalls: 0 }; }

export function healthCheck() {
  const logger = _getPort('logger');
  const checks = { documentExists: !!document, loggerAvailable: !!logger };
  const passed = Object.values(checks).filter(Boolean).length; const total = Object.keys(checks).length;
  return { status: passed === total ? 'HEALTHY' : 'DEGRADED', score: passed, maxScore: total, scoreDisplay: `${passed}/${total}`, checks, issues: Object.entries(checks).filter(e => !e[1]).map(e => e[0]), version: VERSION, moduleId: MODULE_ID, portsInitialized: Ports.isInitialized(), timestamp: new Date().toISOString() };
}

export function info() { return { version: VERSION, moduleId: MODULE_ID, portsInitialized: Ports.isInitialized(), metrics: getMetrics(), healthCheck: healthCheck() }; }
export function getVersion() { return VERSION; }
export function setDebug(enabled: boolean) { _debug = !!enabled; }

export default { escapeHtml, sanitizeString, createElementFromHTML, getMetrics, resetMetrics, healthCheck, info, getVersion, VERSION, MODULE_ID };
