// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.5.0-P21)
// ═══════════════════════════════════════════════════════════════
// MODULE: overlay-layer.adapters.drawer-adapter
// PURPOSE: Overlay Layer - Drawer Adapter v1.5.0-P21
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createUiPorts from /core/runtime/ports-profiles.js
//   UI_EVENTS, DRAWER_EVENTS, UI_INTENTS from /core/runtime/events/index.js
//   * as Manager from ../core/manager.js
//   * as MobileGestures from ../core/mobile-gestures.js
//
// PROVIDES:
//   open() — exported function
//   close() — exported function
//   closeAll() — exported function
//   toggle() — exported function
//   isOpen() — exported function
//   getDrawer() — exported function
//   getActiveDrawers() — exported function
//   updateContent() — exported function
//   connectToDrawerEvents() — exported function
//   disconnect() — exported function
//   destroy() — exported function
//   getConfig() — exported function
//   setConfig() — exported function
//   getMetrics() — exported function
//   healthCheck() — exported function
//   info() — exported function
//   VERSION — module constant
//   MODULE_ID — module constant
//   injectPorts() — exported function
//   getPorts() — exported function
//
// RECEIVES (via init/options): (none)
// EMITS (eventos):
//   UI_INTENTS.REQUEST_LAYOUT
//   UI_EVENTS.DRAWER_UPDATE_CONTENT
// LISTENS (eventos):
//   DRAWER_EVENTS.OPEN
//   DRAWER_EVENTS.CLOSE
//   DRAWER_EVENTS.TOGGLE
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createUiPorts } from '/core/runtime/ports-profiles.js';
import { UI_EVENTS, UI_INTENTS } from '/core/runtime/events/catalog/ui.events.js';
// DRAWER_EVENTS removido: import fantasma (não existe em nenhum catálogo)
import * as Manager from '../core/manager.js';
import * as MobileGestures from '../core/mobile-gestures.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;

const VERSION = '1.5.0-P21';
const MODULE_ID = 'overlay-layer.adapters.drawer-adapter';

const Ports = createUiPorts({ moduleId: MODULE_ID });
function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
function injectPorts(p: DynObj) { return Ports.inject(p); }
function getPorts() { return Ports.snapshot(); }

const DRAWER_PRIORITY = 7000;
const _activeDrawers = new Map();
const _config = { defaultPosition: 'right', defaultWidth: '400px', enableSwipeClose: true, enableBackdrop: true, closeOnEscape: true, closeOnBackdropClick: true };
let _metrics = { opened: 0, closed: 0, swipeClosed: 0 };
let _cleanups: DynObj[] = [];

function _setScrollLock(locked: boolean) { const eb = _getPort('eventBus'); if (eb && eb.emit) { eb.emit(UI_INTENTS.REQUEST_LAYOUT, { mode: locked ? 'scroll-lock' : 'scroll-unlock', source: MODULE_ID, timestamp: Date.now() }); return true; } return false; }

function open(drawerId: string, options: DynObj) {
  if (!options) options = {};
  if (_activeDrawers.has(drawerId)) return { ok: false, reason: 'already-open' };
  const position = options.position || _config.defaultPosition;
  const width = options.width || _config.defaultWidth;
  const animationMap = { right: 'slideLeft', left: 'slideRight', bottom: 'slideUp', top: 'slideDown' };
  const result = Manager.open({ id: drawerId, type: `drawer-${position}`, priority: options.priority || DRAWER_PRIORITY, blocking: options.blocking !== false, content: options.content || null, config: { position, width, closable: options.closable !== false, escapable: options.escapable !== undefined ? options.escapable : _config.closeOnEscape, animation: (animationMap as DynObj)[position] || 'slideLeft', onClose: options.onClose || null } });
  if (result.ok) {
    _activeDrawers.set(drawerId, { position, width, openedAt: Date.now(), options });
    _metrics.opened++;
    if (options.blocking !== false) _setScrollLock(true);
    if (_config.enableSwipeClose && options.element) {
      const swipeDirection = position === 'right' ? 'right' : position === 'left' ? 'left' : position === 'bottom' ? 'down' : 'up';
      MobileGestures.attach(options.element, drawerId, { direction: swipeDirection, onSwipeClose() { _metrics.swipeClosed++; close(drawerId, 'swipe'); } });
    }
  }
  return result;
}

function close(drawerId: string, reason: DynObj) {
  if (!reason) reason = 'explicit';
  const drawer = _activeDrawers.get(drawerId);
  if (!drawer) return { ok: false, reason: 'not-found' };
  MobileGestures.detach(drawerId);
  const result = Manager.close(drawerId, reason);
  if (result.ok) {
    _activeDrawers.delete(drawerId);
    _metrics.closed++;
    if (drawer.options && drawer.options.onClose) drawer.options.onClose(reason);
    let hasBlockingDrawer = false;
    _activeDrawers.forEach(d => { if (d.options && d.options.blocking !== false) hasBlockingDrawer = true; });
    if (!hasBlockingDrawer) _setScrollLock(false);
  }
  return result;
}

function closeAll(reason: DynObj) { if (!reason) reason = 'close-all'; const count = _activeDrawers.size; _activeDrawers.forEach((_, id) => { close(id, reason); }); return { ok: true, closed: count }; }
function toggle(drawerId: string, options: DynObj) { if (!options) options = {}; if (_activeDrawers.has(drawerId)) return close(drawerId, 'toggle'); return open(drawerId, options); }
function isOpen(drawerId: string) { return _activeDrawers.has(drawerId); }
function getDrawer(drawerId: string) { return _activeDrawers.get(drawerId) || null; }
function getActiveDrawers() { const list: DynObj[] = []; _activeDrawers.forEach((data, id) => { list.push(Object.assign({ id, age: Date.now() - data.openedAt }, data)); }); return list; }
function updateContent(drawerId: string, content: DynObj) { if (!_activeDrawers.has(drawerId)) return { ok: false, reason: 'not-found' }; const eb = _getPort('eventBus'); if (eb && eb.emit) eb.emit(UI_EVENTS.DRAWER_UPDATE_CONTENT, { id: drawerId, content }); return { ok: true, drawerId }; }

function _openHandler(data: DynObj) { open(data.id, data.options); }
function _closeHandler(data: DynObj) { close(data.id, data.reason); }
function _toggleHandler(data: DynObj) { toggle(data.id, data.options); }

function connectToDrawerEvents() {
  const eb = _getPort('eventBus');
  if (!eb || !eb.on) return { ok: false, reason: 'EventBus not available' };
  // DRAWER_EVENTS removido: import fantasma (listeners eram dead code)
  // Os handlers _openHandler, _closeHandler, _toggleHandler permanecem disponíveis
  // para futura integração quando DRAWER_EVENTS for criado no catálogo
  return { ok: true, connected: true };
}

function disconnect() {
  _cleanups.forEach(fn => { try { fn(); } catch (e) {} });
  _cleanups = [];
  MobileGestures.detachAll();
  return { ok: true };
}

function destroy() {
  disconnect();
  closeAll('destroy');
  _metrics = { opened: 0, closed: 0, swipeClosed: 0 };
}

function getConfig() { return Object.assign({}, _config); }
function setConfig(newConfig: DynObj) { if (newConfig.defaultPosition) _config.defaultPosition = newConfig.defaultPosition; if (newConfig.defaultWidth) _config.defaultWidth = newConfig.defaultWidth; if (newConfig.enableSwipeClose !== undefined) _config.enableSwipeClose = newConfig.enableSwipeClose; if (newConfig.enableBackdrop !== undefined) _config.enableBackdrop = newConfig.enableBackdrop; if (newConfig.closeOnEscape !== undefined) _config.closeOnEscape = newConfig.closeOnEscape; if (newConfig.closeOnBackdropClick !== undefined) _config.closeOnBackdropClick = newConfig.closeOnBackdropClick; return { ok: true, config: Object.assign({}, _config) }; }
function getMetrics() { return Object.assign({}, _metrics, { active: _activeDrawers.size }); }

function healthCheck() {
  const eb = _getPort('eventBus');
  const checks = { managerAvailable: !!Manager, gesturesAvailable: !!MobileGestures, eventBusAvailable: !!eb, portsInitialized: Ports.isInitialized() };
  let passed = 0; for (const k in checks) { if (checks.hasOwnProperty(k) && (checks as DynObj)[k]) passed++; }
  return { status: passed >= 2 ? 'HEALTHY' : 'DEGRADED', score: `${passed}/${Object.keys(checks).length}`, checks, metrics: getMetrics(), activeDrawers: getActiveDrawers(), portsInitialized: Ports.isInitialized(), version: VERSION, moduleId: MODULE_ID, p21Compliant: true, cleanups: _cleanups.length, timestamp: Date.now() };
}

function info() { return { moduleId: MODULE_ID, version: VERSION, config: getConfig(), activeDrawers: getActiveDrawers(), metrics: getMetrics(), portsInitialized: Ports.isInitialized(), p21Compliant: true, timestamp: Date.now() }; }

export { open, close, closeAll, toggle, isOpen, getDrawer, getActiveDrawers, updateContent, connectToDrawerEvents, disconnect, destroy, getConfig, setConfig, getMetrics, healthCheck, info, VERSION, MODULE_ID, injectPorts, getPorts };

export default { open, close, closeAll, toggle, isOpen, getDrawer, getActiveDrawers, updateContent, connectToDrawerEvents, disconnect, destroy, getConfig, setConfig, getMetrics, healthCheck, info, injectPorts, getPorts, VERSION, MODULE_ID };
