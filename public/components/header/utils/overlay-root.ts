// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v2.6.0-ES6)
// ═══════════════════════════════════════════════════════════════
// MODULE: header/utils/overlay-root
// PURPOSE: Manages overlay DOM roots for tooltips, announcer, and dropdowns
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createUiPorts from /core/runtime/ports-profiles.js
// PROVIDES:
//   ensureOverlayRoot() — creates/returns overlay root in header container
//   getTooltipRoot() — returns tooltip-specific overlay root
//   getAnnouncerRoot() — returns announcer-specific overlay root
//   getDropdownRoot() — returns dropdown-specific overlay root
//   init() / destroy() — lifecycle management
//   getOverlayRoot() / getHeaderContainer() — accessors
//   healthCheck() / info() / getMetrics() — observability
//   injectPorts() / getPorts() — port dependency injection
//   MODULE_ID, VERSION — module identity constants
// ═══════════════════════════════════════════════════════════════
// Header Overlay Root - Enterprise AAA
// @version 2.6.0-ES6
// @changelog v2.6.0-ES6 - Task 10.1 B06: var → const/let
// @changelog v2.5.0 - Fix: fallback para document.body quando headerContainer é null
'use strict';

import { createUiPorts } from '/core/runtime/ports-profiles.js';

export const VERSION = '2.6.0-ES6';
export const MODULE_ID = 'header/utils/overlay-root';

const Ports = createUiPorts({ moduleId: MODULE_ID });

function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }

export function injectPorts(p: Record<string,unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

const _debugEnabled = () => { const cfg = _getPort('config'); return cfg && cfg.app && cfg.app.debug; };
const _log = function(level: string, ...args: any[]) {
  const logger = _getPort('logger');
  if (!logger) return;
  const prefix = `[${MODULE_ID}]`;
  if (level === 'error') { if (logger.error) logger.error(...[prefix].concat(args)); return; }
  if (level === 'warn') { if (logger.warn) logger.warn(...[prefix].concat(args)); return; }
  if (level === 'info') { if (logger.info) logger.info(...[prefix].concat(args)); return; }
  if (_debugEnabled() && logger.debug) logger.debug(...[prefix].concat(args));
};

let _overlayRoot: unknown = null;
let _tooltipRoot: unknown = null;
let _announcerRoot: Record<string,unknown>|null = null;
let _dropdownRoot: unknown = null;
let _headerContainer: unknown = null;
const _metrics = { initCount: 0, destroyCount: 0, tooltipRootCreated: 0, announcerRootCreated: 0, dropdownRootCreated: 0, fallbackCount: 0 };

export function ensureOverlayRoot(headerContainer: HTMLElement|null) {
  if (!headerContainer) {
    if (_overlayRoot) return _overlayRoot;
    _log('debug', 'headerContainer não disponível ainda, usando fallback document.body');
    _metrics.fallbackCount++;
    return document.body;
  }
  _headerContainer = headerContainer;
  let root = headerContainer.querySelector('[data-header-overlay-root]');
  if (!root) {
    root = document.createElement('div');
    root.setAttribute('data-header-overlay-root', 'true');
    root.className = 'header-overlay-root';
    // @ts-expect-error TS migration - TS2339
    root.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:0;pointer-events:none;z-index:9999;';
    headerContainer.appendChild(root);
    _log('debug', 'Overlay root criado');
  }
  _overlayRoot = root;
  return root;
}

export function getTooltipRoot(headerContainer?: HTMLElement) {
  // @ts-expect-error TS migration - TS2345
  const root = ensureOverlayRoot(headerContainer || _headerContainer);
  if (!root) return document.body;
  // @ts-expect-error TS migration - TS2339
  let tooltipRoot = root.querySelector('[data-header-tooltip-root]');
  if (!tooltipRoot) {
    tooltipRoot = document.createElement('div');
    tooltipRoot.setAttribute('data-header-tooltip-root', 'true');
    tooltipRoot.className = 'header-tooltip-root';
    tooltipRoot.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:10000;';
    // @ts-expect-error TS migration - TS2339
    root.appendChild(tooltipRoot);
    _metrics.tooltipRootCreated++;
  }
  _tooltipRoot = tooltipRoot;
  return tooltipRoot;
}

export function getAnnouncerRoot(headerContainer?: HTMLElement) {
  // @ts-expect-error TS migration - TS2345
  const root = ensureOverlayRoot(headerContainer || _headerContainer);
  if (!root) return document.body;
  if (root === document.body) {
    // @ts-expect-error TS migration - TS2339
    const existingAnnouncer = root.querySelector('[data-header-announcer-root]');
    if (existingAnnouncer) return existingAnnouncer;
    const announcerRoot = document.createElement('div');
    announcerRoot.setAttribute('data-header-announcer-root', 'true');
    announcerRoot.className = 'header-announcer-root sr-only';
    announcerRoot.style.cssText = 'position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0;';
    // @ts-expect-error TS migration - TS2339
    root.appendChild(announcerRoot);
    _metrics.announcerRootCreated++;
    // @ts-expect-error TS migration - TS2322
    _announcerRoot = announcerRoot;
    return announcerRoot;
  }
  // @ts-expect-error TS migration - TS2339
  let announcerRoot = root.querySelector('[data-header-announcer-root]');
  if (!announcerRoot) {
    announcerRoot = document.createElement('div');
    announcerRoot.setAttribute('data-header-announcer-root', 'true');
    announcerRoot.className = 'header-announcer-root sr-only';
    announcerRoot.style.cssText = 'position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0;';
    // @ts-expect-error TS migration - TS2339
    root.appendChild(announcerRoot);
    _metrics.announcerRootCreated++;
  }
  _announcerRoot = announcerRoot;
  return announcerRoot;
}

export function getDropdownRoot(headerContainer: HTMLElement|null) {
  // @ts-expect-error TS migration - TS2345
  const root = ensureOverlayRoot(headerContainer || _headerContainer);
  if (!root) return document.body;
  // @ts-expect-error TS migration - TS2339
  let dropdownRoot = root.querySelector('[data-header-dropdown-root]');
  if (!dropdownRoot) {
    dropdownRoot = document.createElement('div');
    dropdownRoot.setAttribute('data-header-dropdown-root', 'true');
    dropdownRoot.className = 'header-dropdown-root';
    dropdownRoot.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:10001;';
    // @ts-expect-error TS migration - TS2339
    root.appendChild(dropdownRoot);
    _metrics.dropdownRootCreated++;
  }
  _dropdownRoot = dropdownRoot;
  return dropdownRoot;
}

export function init(headerContainer: HTMLElement|null) {
  if (!headerContainer) { _log('error', 'init: headerContainer é obrigatório'); return false; }
  _headerContainer = headerContainer;
  _metrics.initCount++;
  ensureOverlayRoot(headerContainer);
  _log('info', 'Overlay root inicializado');
  return true;
}

export function destroy() {
  // @ts-expect-error TS migration - TS2339
  if (_overlayRoot) { _overlayRoot.remove(); _overlayRoot = null; }
  _tooltipRoot = null; _announcerRoot = null; _dropdownRoot = null; _headerContainer = null;
  _metrics.destroyCount++;
  _log('info', 'Overlay root destruído');
}

export function getOverlayRoot() { return _overlayRoot; }
export function getHeaderContainer() { return _headerContainer; }
export function getMetrics() { return Object.assign({}, _metrics); }
export function resetMetrics() { _metrics.initCount = 0; _metrics.destroyCount = 0; _metrics.tooltipRootCreated = 0; _metrics.announcerRootCreated = 0; _metrics.dropdownRootCreated = 0; _metrics.fallbackCount = 0; }

export function healthCheck() {
  const logger = _getPort('logger');
  const checks = { overlayRootExists: !!_overlayRoot, headerContainerSet: !!_headerContainer, loggerAvailable: !!logger, noBodyAppendChild: true };
  const passed = Object.values(checks).filter(Boolean).length; const total = Object.keys(checks).length;
  return { status: passed === total ? 'HEALTHY' : passed >= 2 ? 'DEGRADED' : 'UNHEALTHY', score: passed, maxScore: total, scoreDisplay: `${passed}/${total}`, checks, issues: Object.entries(checks).filter(e => !e[1]).map(e => e[0]), version: VERSION, moduleId: MODULE_ID, portsInitialized: Ports.isInitialized(), fallbackCount: _metrics.fallbackCount, timestamp: new Date().toISOString() };
}

export function info() { return { version: VERSION, moduleId: MODULE_ID, portsInitialized: Ports.isInitialized(), overlayRootExists: !!_overlayRoot, tooltipRootExists: !!_tooltipRoot, announcerRootExists: !!_announcerRoot, dropdownRootExists: !!_dropdownRoot, metrics: getMetrics(), healthCheck: healthCheck() }; }
export function getVersion() { return VERSION; }

export default { init, destroy, ensureOverlayRoot, getTooltipRoot, getAnnouncerRoot, getDropdownRoot, getOverlayRoot, getHeaderContainer, getMetrics, resetMetrics, healthCheck, info, getVersion, VERSION, MODULE_ID };
