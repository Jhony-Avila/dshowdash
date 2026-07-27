// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v1.1.0-ES6)
// ═══════════════════════════════════════════════════════════════
// MODULE: header/shell/header-shell
// PURPOSE: Header UI/DOM shell — mount, render, events, fallback
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createCorePorts from /core/runtime/ports-profiles.js
//   SELECTORS, CSS_CLASSES, DATA_ATTRS from ../core/constants.js
// PROVIDES:
//   init(selector, deps) — initialize shell with container
//   mount() — mount shell and setup listeners
//   unmount() — unmount and cleanup
//   render() — trigger render cycle
//   updateComponent(name, html) — update named component
//   showFallback(type, msg, opts) — show fallback UI
//   hideFallback() — hide fallback UI
//   show() / hide() / isVisible() — visibility control
//   getElements() / getRegion(name) — DOM access
//   healthCheck() — module health status
//   info() — module info
//   injectPorts(p) — inject port dependencies
//   getPorts() — return ports snapshot
// EVENTS EMITTED:
//   header:shell:panel:trigger
//   header:shell:uarps:trigger
//   header:shell:escape:pressed
// WINDOW:
//   Reads: window.scrollY, window.innerWidth, window.innerHeight
//   Uses: window.addEventListener (scroll, resize)
//   Uses: window.ResizeObserver
// ═══════════════════════════════════════════════════════════════
// Header - Shell (UI/DOM Layer)
// @version 1.1.0-ES6
// @changelog v1.1.0-ES6 - Task 10.1 B07: var → const/let
// Camada de UI do Header - manipulacao de DOM e eventos de usuario
'use strict';

import { createCorePorts } from '/core/runtime/ports-profiles.js';
import { SELECTORS, CSS_CLASSES, DATA_ATTRS } from '../core/constants.js';

export const VERSION = '1.1.0-ES6';
export const MODULE_ID = 'header/shell/header-shell';

const Ports = createCorePorts({ moduleId: MODULE_ID });
function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
export function injectPorts(p: Record<string,unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

const _debugEnabled = () => { const cfg = _getPort('config'); return (cfg && cfg.app && cfg.app.debug) ? true : false; };
const _log = function(level: string, ...args: any[]) {const logger = _getPort('logger'); if (!logger) return; const prefix = `[${MODULE_ID}]`; if (level === 'error') { if (logger.error) logger.error(prefix, args.join(' ')); return; } if (level === 'warn') { if (logger.warn) logger.warn(prefix, args.join(' ')); return; } if (level === 'info') { if (logger.info) logger.info(prefix, args.join(' ')); return; } if (_debugEnabled() && logger.debug) logger.debug(prefix, args.join(' ')); };

const _elements = { container: (null as HTMLElement|null|null), header: (null as Record<string,unknown>|null), left: (null as unknown|null), center: (null as unknown|null), right: (null as unknown|null), statusTray: (null as unknown|null) };
const _state = { mounted: false, visible: true, scrolled: false, resizeObserver: (null as unknown|null) };
let _abortController: AbortController|null = null;
let _coreUnsubscribe: unknown = null;
let _Core = null;
let _PluginSystem: Record<string,unknown>|null = null;

function init(containerSelector: string, dependencies: Record<string,unknown>) {
  _initPorts();
  dependencies = dependencies || {};
  _Core = dependencies.Core || null;
  // @ts-expect-error TS migration - TS2322
  _PluginSystem = dependencies.PluginSystem || null;
  containerSelector = containerSelector || SELECTORS.CONTAINER;
  _elements.container = document.querySelector(containerSelector);
  if (!_elements.container) { _log('error', 'Container nao encontrado:', containerSelector); return false; }
  // @ts-expect-error strict migration — TS2339
  if (_Core && _Core.setShell) { _Core.setShell({ render, showFallback, hideFallback, updateComponent }); }
  // @ts-expect-error strict migration — TS2339
  if (_Core && _Core.onStateChange) { _coreUnsubscribe = _Core.onStateChange(_handleCoreStateChange); }
  _log('info', 'HeaderShell inicializado');
  return true;
}

function mount() {
  if (_state.mounted) { _log('warn', 'Shell ja montado'); return Promise.resolve(); }
  _abortController = new AbortController();
  const signal = _abortController.signal;
  // @ts-expect-error TS migration - TS2349
  const hookPromise = _PluginSystem ? _PluginSystem.executeHook('beforeMount', { shell: this }) : Promise.resolve();
  return hookPromise.then(function() {
    // @ts-expect-error TS migration - TS2322
    _elements.header = _elements.container.querySelector(SELECTORS.HEADER) || _createHeaderStructure();
    // @ts-expect-error strict migration — TS18047
    _elements.left = _elements.container.querySelector(SELECTORS.HEADER_LEFT);
    // @ts-expect-error strict migration — TS18047
    _elements.center = _elements.container.querySelector(SELECTORS.HEADER_CENTER);
    // @ts-expect-error strict migration — TS18047
    _elements.right = _elements.container.querySelector(SELECTORS.HEADER_RIGHT);
    // @ts-expect-error strict migration — TS18047
    _elements.statusTray = _elements.container.querySelector(SELECTORS.STATUS_TRAY);
    // @ts-expect-error TS migration - TS2345
    _setupEventListeners(signal);
    _setupObservers();
    _state.mounted = true;
    _log('info', 'Shell montado');
    // @ts-expect-error TS migration - TS2349
    if (_PluginSystem) { return _PluginSystem.executeHook('afterMount', { shell: this, elements: _elements }); }
  });
}

function unmount() {
  if (!_state.mounted) return;
  // @ts-expect-error TS migration - TS2349
  if (_PluginSystem) { _PluginSystem.executeHook('beforeUnmount', { shell: this }); }
  if (_abortController) { _abortController.abort(); _abortController = null; }
  // @ts-expect-error TS migration - TS2339
  if (_state.resizeObserver) { _state.resizeObserver.disconnect(); _state.resizeObserver = null; }
  // @ts-expect-error TS migration - TS2349
  if (_coreUnsubscribe) { _coreUnsubscribe(); _coreUnsubscribe = null; }
  _state.mounted = false;
  _log('info', 'Shell desmontado');
  // @ts-expect-error TS migration - TS2349
  if (_PluginSystem) { _PluginSystem.executeHook('afterUnmount', { shell: this }); }
}

function _createHeaderStructure() {
  const header = document.createElement('header');
  header.className = 'header';
  header.setAttribute('role', 'banner');
  header.innerHTML = '<div class="header-left"></div><div class="header-center"></div><div class="header-right"></div>';
  // @ts-expect-error strict migration — TS18047
  _elements.container.appendChild(header);
  return header;
}

function _setupEventListeners(signal: string) {
  // @ts-expect-error TS migration - TS2769
  window.addEventListener('scroll', _handleScroll, { passive: true, signal });
  // @ts-expect-error TS migration - TS2769
  window.addEventListener('resize', _debounce(_handleResize, 150), { signal });
  // @ts-expect-error TS migration - TS2769
  _elements.container.addEventListener('click', _handleClick, { signal });
  // @ts-expect-error TS migration - TS2769
  _elements.container.addEventListener('keydown', _handleKeydown, { signal });
  // @ts-expect-error TS migration - TS2769
  _elements.container.addEventListener('focusin', _handleFocusIn, { signal });
  // @ts-expect-error TS migration - TS2769
  _elements.container.addEventListener('focusout', _handleFocusOut, { signal });
}

function _setupObservers() {
  if (window.ResizeObserver) {
    // @ts-expect-error TS migration - TS2345
    _state.resizeObserver = new ResizeObserver(_debounce((entries: unknown[]) => { _handleContainerResize(entries[0]); }, 100));
    // @ts-expect-error TS migration - TS2339
    _state.resizeObserver.observe(_elements.container);
  }
}

function _handleCoreStateChange(event: string) {
  // @ts-expect-error TS migration - TS2339
  _log('debug', 'Core state change:', event.type);
  // @ts-expect-error TS migration - TS2339
  switch (event.type) {
    case 'health:updated': _updateHealthIndicators(); break;
    case 'alerts:updated': _updateAlertsIndicators(); break;
    // @ts-expect-error TS migration - TS2339
    case 'network:changed': _updateNetworkIndicator(event.state.networkStatus); break;
  }
}

function _handleScroll() {
  const scrolled = window.scrollY > 50;
  // @ts-expect-error TS migration - TS2339
  if (scrolled !== _state.scrolled) { _state.scrolled = scrolled; if (_elements.header) { _elements.header.classList.toggle('header-scrolled', scrolled); } }
}

// @ts-expect-error TS migration - TS2349
function _handleResize() { if (_PluginSystem) { _PluginSystem.executeHook('onResize', { width: window.innerWidth, height: window.innerHeight }); } }
// @ts-expect-error TS migration - TS2339
function _handleContainerResize(entry: Record<string,unknown>) { _log('debug', 'Container resized:', entry.contentRect.width); }

function _handleClick(event: string) {
  // @ts-expect-error TS migration - TS2339
  const target = event.target.closest(`[${DATA_ATTRS.PANEL_TRIGGER}]`);
  if (target) { const panelId = target.getAttribute(DATA_ATTRS.PANEL_TRIGGER); _emitEvent('panel:trigger', { panelId, target }); return; }
  // @ts-expect-error TS migration - TS2339
  const uarpsTrigger = event.target.closest(`[${DATA_ATTRS.UARPS_TRIGGER}]`);
  if (uarpsTrigger) { const uarpsId = uarpsTrigger.getAttribute(DATA_ATTRS.UARPS_TRIGGER); _emitEvent('uarps:trigger', { uarpsId, target: uarpsTrigger }); return; }
}

// @ts-expect-error TS migration - TS2339
function _handleKeydown(event: string) { if (event.key === 'Escape') { _emitEvent('escape:pressed'); } }
// @ts-expect-error TS migration - TS2339
function _handleFocusIn(event: string) { const component = event.target.closest(`[${DATA_ATTRS.COMPONENT_KEY}]`); if (component) { component.classList.add('header-component-focused'); } }
// @ts-expect-error TS migration - TS2339
function _handleFocusOut(event: string) { const component = event.target.closest(`[${DATA_ATTRS.COMPONENT_KEY}]`); if (component) { component.classList.remove('header-component-focused'); } }

function render() {
  if (!_state.mounted) { _log('warn', 'Shell nao montado'); return; }
  // @ts-expect-error TS migration - TS2349
  if (_PluginSystem) { _PluginSystem.executeHook('beforeRender', { elements: _elements }); }
  // @ts-expect-error TS migration - TS2349
  if (_PluginSystem) { _PluginSystem.executeHook('afterRender', { elements: _elements }); }
}

function updateComponent(name: string, html: string) {
  // @ts-expect-error strict migration — TS18047
  const wrapper = _elements.container.querySelector(`[${DATA_ATTRS.COMPONENT_KEY}="${name}"]`);
  if (wrapper && html) { wrapper.innerHTML = html; }
}

function _updateHealthIndicators() { }
function _updateAlertsIndicators() { }
// @ts-expect-error TS migration - TS2349
function _updateNetworkIndicator(status: string) { if (_elements.header) { _elements.header.setAttribute('data-network-status', status); } }

function showFallback(type: string, message: string, options: Record<string,unknown>) {
  options = options || {};
  // @ts-expect-error strict migration — TS18047
  const existingFallback = _elements.container.querySelector(SELECTORS.FALLBACK);
  if (existingFallback) { existingFallback.remove(); }
  const fallback = document.createElement('div');
  fallback.className = `header-fallback header-fallback-${type}`;
  fallback.setAttribute('role', 'alert');
  fallback.setAttribute(DATA_ATTRS.FALLBACK_TYPE, type);
  fallback.innerHTML = `<span class="header-fallback-message">${_escapeHtml(message)}</span><button class="header-fallback-close" aria-label="Fechar">x</button>`;
  // @ts-expect-error strict migration — TS18047
  _elements.container.appendChild(fallback);
  requestAnimationFrame(() => { fallback.classList.add(CSS_CLASSES.FALLBACK_VISIBLE); });
  const closeBtn = fallback.querySelector('.header-fallback-close');
  if (closeBtn && _abortController) { closeBtn.addEventListener('click', () => { hideFallback(); }, { signal: _abortController.signal }); }
  // @ts-expect-error TS migration - TS2769
  if (options.autoHide !== false) { setTimeout(() => { hideFallback(); }, options.duration || 8000); }
}

function hideFallback() {
  // @ts-expect-error strict migration — TS18047
  const fallback = _elements.container.querySelector(SELECTORS.FALLBACK);
  if (!fallback) return;
  fallback.classList.add(CSS_CLASSES.FALLBACK_HIDING);
  fallback.classList.remove(CSS_CLASSES.FALLBACK_VISIBLE);
  setTimeout(() => { if (fallback.parentNode) { fallback.remove(); } }, 300);
}

// @ts-expect-error TS migration - TS2339
function show() { if (_elements.header) { _elements.header.style.display = ''; _state.visible = true; } }
// @ts-expect-error TS migration - TS2339
function hide() { if (_elements.header) { _elements.header.style.display = 'none'; _state.visible = false; } }
function isVisible() { return _state.visible; }

// @ts-expect-error strict migration — TS2683
function _debounce(this: any, fn: Function, delay: number) { let timeoutId: any; return function() { const args = arguments; const context = this; clearTimeout(timeoutId); timeoutId = setTimeout(() => { fn.apply(context, args); }, delay); }; }
// @ts-expect-error TS migration - TS2322
function _escapeHtml(str: unknown) { const div = document.createElement('div'); div.textContent = str; return div.innerHTML; }
function _emitEvent(eventName: string, data?: Record<string, unknown>) { const eventBus = _getPort('eventBus'); if (eventBus && eventBus.emit) { eventBus.emit(`header:shell:${eventName}`, Object.assign({ timestamp: Date.now() }, data)); } }

function getElements() { return Object.assign({}, _elements); }
function getRegion(regionName: string) { return (_elements as Record<string,unknown>)[regionName as string] || null; }

function healthCheck() {
  const checks = { mounted: _state.mounted, hasContainer: !!_elements.container, hasHeader: !!_elements.header, visible: _state.visible, portsInitialized: Ports.isInitialized() };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  return { status: passed === total ? 'HEALTHY' : passed >= 3 ? 'DEGRADED' : 'UNHEALTHY', score: passed, maxScore: total, scoreDisplay: `${passed}/${total}`, checks, version: VERSION, moduleId: MODULE_ID, timestamp: new Date().toISOString() };
}

function info() {
  return { version: VERSION, moduleId: MODULE_ID, mounted: _state.mounted, visible: _state.visible, scrolled: _state.scrolled, hasElements: { container: !!_elements.container, header: !!_elements.header, left: !!_elements.left, center: !!_elements.center, right: !!_elements.right }, portsInitialized: Ports.isInitialized(), healthCheck: healthCheck() };
}

export { init, mount, unmount, render, updateComponent, showFallback, hideFallback, show, hide, isVisible, getElements, getRegion, healthCheck, info };
export default { VERSION, MODULE_ID, init, mount, unmount, render, showFallback, hideFallback, show, hide, getElements, healthCheck, info };
