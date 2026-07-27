// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v5.5.0-ES6)
// ═══════════════════════════════════════════════════════════════
// MODULE: header/utils/dom
// PURPOSE: DOM helper utilities for header (escape, debounce, throttle, etc.)
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createUiPorts from /core/runtime/ports-profiles.js
// PROVIDES:
//   DOMHelpers (constructor) — escapeHtml, debounce, throttle, waitForElement, etc.
//   getVersion() / setDebug() — version and debug control
//   getMetrics() / healthCheck() / info() — observability
//   injectPorts() / getPorts() — port dependency injection
//   MODULE_ID, VERSION — module identity constants
// ═══════════════════════════════════════════════════════════════
// Header - DOM Helpers Enterprise AAA
// @version 5.5.0-ES6
// @changelog v5.5.0-ES6 - Task 10.1 B04: var → const/let
'use strict';

import { createUiPorts } from '/core/runtime/ports-profiles.js';

export const VERSION = '5.5.0-ES6';
export const MODULE_ID = 'header/utils/dom';

const Ports = createUiPorts({ moduleId: MODULE_ID });

function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }

export function injectPorts(p: Record<string,unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

let _debug = false;
const _debugEnabled = () => { const cfg = _getPort('config'); return _debug || (cfg && cfg.app && cfg.app.debug); };
const _log = function(level: string, ...args: any[]) {
  const logger = _getPort('logger');
  if (!logger) return;
  const prefix = `[${MODULE_ID}]`;
  if (level === 'error') { if (logger.error) logger.error(...[prefix].concat(args)); return; }
  if (level === 'warn') { if (logger.warn) logger.warn(...[prefix].concat(args)); return; }
  if (level === 'info') { if (logger.info) logger.info(...[prefix].concat(args)); return; }
  if (_debugEnabled() && logger.debug) logger.debug(...[prefix].concat(args));
};

let _metrics = { escapeHtmlCalls: 0, debounceCreated: 0, throttleCreated: 0, waitForElementCalls: 0 };

export function DOMHelpers() {}

DOMHelpers.escapeHtml = (text: string) => { _metrics.escapeHtmlCalls++; const div = document.createElement('div'); div.textContent = text; return div.innerHTML; };
// @ts-expect-error strict migration — TS2769
DOMHelpers.getVisibleElements = (container: HTMLElement|null, selector: string) => { if (!container) return []; return Array.from(container.querySelectorAll(selector)).filter((el: HTMLElement) => el.offsetParent !== null); };
DOMHelpers.setAttributes = (element: HTMLElement|null, attrs: Record<string,unknown>) => { if (!element) return; Object.entries(attrs).forEach(entry => { const key = entry[0]; const value = entry[1]; if (value === null || value === undefined) element.removeAttribute(key); else element.setAttribute(key, String(value)); }); };
DOMHelpers.addClass = function(element: HTMLElement|null) { if (!element) return; element.classList.add(...Array.prototype.slice.call(arguments, 1)); };
DOMHelpers.removeClass = function(element: HTMLElement|null) { if (!element) return; element.classList.remove(...Array.prototype.slice.call(arguments, 1)); };
DOMHelpers.toggleClass = (element: HTMLElement|null, className: string, force: boolean) => { if (!element) return; return element.classList.toggle(className, force); };

DOMHelpers.debounce = (fn: Function, delay: number) => {
  _metrics.debounceCreated++;
  // @ts-expect-error strict migration — TS7034
  let timer;
  // @ts-expect-error strict migration — TS7005
  const debounced = function(this: any) { const args = arguments; const self = this; clearTimeout(timer); timer = setTimeout(() => { fn.apply(self, args); }, delay); };
  // @ts-expect-error strict migration — TS7005
  debounced.cancel = () => { clearTimeout(timer); };
  return debounced;
};

DOMHelpers.throttle = (fn: Function, delay: number) => {
  _metrics.throttleCreated++;
  let lastCall = 0; let timer: ReturnType<typeof setInterval>|null = null;
  const throttled = function(this: any) {
    const args = arguments; const self = this;
    const now = Date.now(); const timeSinceLastCall = now - lastCall;
    if (timeSinceLastCall >= delay) { lastCall = now; fn.apply(self, args); }
    // @ts-expect-error strict migration — TS2769
    else { clearTimeout(timer); timer = setTimeout(() => { lastCall = Date.now(); fn.apply(self, args); }, delay - timeSinceLastCall); }
  };
  // @ts-expect-error strict migration — TS2769
  throttled.cancel = () => { clearTimeout(timer); };
  return throttled;
};

DOMHelpers.waitForElement = (selector: string, timeout: number) => {
  timeout = timeout || 5000;
  _metrics.waitForElementCalls++;
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(selector);
    if (existing) { resolve(existing); return; }
    const observer = new MutationObserver((mutations, obs) => { const element = document.querySelector(selector); if (element) { obs.disconnect(); clearTimeout(timer); resolve(element); } });
    observer.observe(document.body, { childList: true, subtree: true });
    const timer = setTimeout(() => { observer.disconnect(); reject(new Error(`Element ${selector} not found within ${timeout}ms`)); }, timeout);
  });
};

// @ts-expect-error TS migration - TS2339, TS2362, TS2363
DOMHelpers.median = (arr: unknown) => { if (arr.length === 0) return 0; const sorted = arr.slice().sort((a: unknown, b: unknown) => a - b); const mid = Math.floor(sorted.length / 2); return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2; };
// @ts-expect-error TS migration - TS2339, TS2362
DOMHelpers.mad = (arr: unknown) => { if (arr.length === 0) return 0; const med = DOMHelpers.median(arr); const deviations = arr.map((v: unknown) => Math.abs(v - med)); return DOMHelpers.median(deviations); };
// @ts-expect-error TS migration - TS2345
DOMHelpers.clamp = (value: unknown, min: number, max: number) => Math.max(min, Math.min(max, value));
// @ts-expect-error TS migration - TS2365, TS2362, TS2363
DOMHelpers.lerp = (start: unknown, end: unknown, t: unknown) => start + (end - start) * DOMHelpers.clamp(t, 0, 1);

DOMHelpers.getMetrics = () => Object.assign({}, _metrics);
DOMHelpers.resetMetrics = () => { _metrics = { escapeHtmlCalls: 0, debounceCreated: 0, throttleCreated: 0, waitForElementCalls: 0 }; };

DOMHelpers.healthCheck = () => {
  const logger = _getPort('logger');
  const checks = { documentReady: document.readyState !== 'loading', bodyExists: !!document.body, loggerAvailable: !!logger };
  const passed = Object.values(checks).filter(Boolean).length; const total = Object.keys(checks).length;
  return { status: passed === total ? 'HEALTHY' : 'DEGRADED', score: passed, maxScore: total, scoreDisplay: `${passed}/${total}`, checks, issues: Object.entries(checks).filter(e => !e[1]).map(e => e[0]), version: VERSION, moduleId: MODULE_ID, portsInitialized: Ports.isInitialized(), timestamp: new Date().toISOString() };
};

DOMHelpers.info = () => ({
  version: VERSION,
  moduleId: MODULE_ID,
  portsInitialized: Ports.isInitialized(),
  metrics: DOMHelpers.getMetrics(),
  healthCheck: DOMHelpers.healthCheck()
});

export function getVersion() { return VERSION; }
export function setDebug(enabled: boolean) { _debug = !!enabled; }
export function getMetrics() { return DOMHelpers.getMetrics(); }
export function healthCheck() { return DOMHelpers.healthCheck(); }
export function info() { return DOMHelpers.info(); }
export default DOMHelpers;
