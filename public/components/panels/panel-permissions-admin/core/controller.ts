// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.2.0-P17WI-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: uarps-admin-controller
// PURPOSE: UARPS Admin - Controller
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   Telemetry from ../telemetry/tracker.js
//   initPorts, injectPorts, getPorts as isPortsInitialized, emit, showToast from ...
//   UARPS_EVENTS from /core/runtime/events/catalog/uarps.events.js
//   loadInitialData, selectUser, refresh, syncInventoryFromDOM from ./data-loader.js
//   toggleTrigger, toggleRegion from ./toggle-operations.js
//   toggleBulkMode, toggleBulkItem, selectAllInArea, clearBulk, bulkGrant, bulkRe...
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   Controller() — exported function
//   injectPorts — exported value
//   getPorts — exported value
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   'keydown'
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { Telemetry } from '../telemetry/tracker.js';
import { initPorts, injectPorts, getPorts as isPortsInitialized, emit, showToast } from './ports.js';
import { UARPS_EVENTS } from '/core/runtime/events/catalog/uarps.events.js';
import { loadInitialData, selectUser, refresh, syncInventoryFromDOM } from './data-loader.js';
import { toggleTrigger, toggleRegion } from './toggle-operations.js';
import { toggleBulkMode, toggleBulkItem, selectAllInArea, clearBulk, bulkGrant, bulkRevoke, grantAllTriggers, revokeAllTriggers } from './bulk-operations.js';

export const VERSION = '9.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'uarps-admin-controller';

function Controller(this: any, options: Record<string, unknown> = {}) {
  this._store = options.store;
  this._initialized = false;
  this._pendingConfirm = null;
  this._keyboardHandler = null;
  this._abortController = null;
}

Controller.create = (options: Record<string, unknown>) => new (Controller as unknown as new (o: Record<string, unknown>) => unknown)(options);

Controller.prototype.init = function() {
  initPorts();
  this._setupKeyboardShortcuts();
  this._initialized = true;
};

Controller.prototype._setupKeyboardShortcuts = function() {
  const self = this;
  this._abortController = new AbortController();
  this._keyboardHandler = (e: KeyboardEvent) => {
    if (e.ctrlKey || e.metaKey) {
      if (e.key === 'z' && !e.shiftKey) { e.preventDefault(); self.undo(); }
      else if ((e.key === 'y') || (e.key === 'z' && e.shiftKey)) { e.preventDefault(); self.redo(); }
    }
  };
  document.addEventListener('keydown', this._keyboardHandler, { signal: this._abortController.signal });
};

Controller.prototype._removeKeyboardShortcuts = function() {
  if (this._abortController) { this._abortController.abort(); this._abortController = null; this._keyboardHandler = null; }
};

Controller.prototype.loadInitialData = function() {
  const self = this;
  return loadInitialData(this._store as Parameters<typeof loadInitialData>[0]).then(() => { self._initialized = true; });
};

Controller.prototype.selectUser = function(userId: string | number) { return selectUser(this._store as Parameters<typeof selectUser>[0], userId); };
Controller.prototype.refresh = function() { return refresh(this._store as Parameters<typeof refresh>[0]); };
Controller.prototype.syncInventoryFromDOM = function() { return syncInventoryFromDOM(this._store as Parameters<typeof syncInventoryFromDOM>[0]); };

Controller.prototype.undo = function() {
  if (!this._store.canUndo()) return false;
  const result = this._store.undo();

  // @ts-expect-error TS migration - TS2554
  if (result) { Telemetry.track('action:undo'); showToast('info', 'Desfeito', 'Ação revertida'); emit(UARPS_EVENTS.UNDO, {}, MODULE_ID); }
  return result;
};

Controller.prototype.redo = function() {
  if (!this._store.canRedo()) return false;
  const result = this._store.redo();

  // @ts-expect-error TS migration - TS2554
  if (result) { Telemetry.track('action:redo'); showToast('info', 'Refeito', 'Ação restaurada'); emit(UARPS_EVENTS.REDO, {}, MODULE_ID); }
  return result;
};

Controller.prototype.toggleTrigger = function(triggerId: string) { return toggleTrigger(this._store as Parameters<typeof toggleTrigger>[0], triggerId); };
Controller.prototype.toggleRegion = function(regionId: string) { return toggleRegion(this._store as Parameters<typeof toggleRegion>[0], regionId); };

Controller.prototype.toggleBulkMode = function() { return toggleBulkMode(this._store); };
Controller.prototype.toggleBulkItem = function(triggerId: string) { return toggleBulkItem(this._store, triggerId); };
Controller.prototype.selectAllInArea = function(area: string) { return selectAllInArea(this._store, area); };
Controller.prototype.clearBulk = function() { return clearBulk(this._store); };

Controller.prototype.bulkGrant = function() { return bulkGrant(this._store, this.requestConfirmation.bind(this)); };
Controller.prototype.bulkRevoke = function() { return bulkRevoke(this._store, this.requestConfirmation.bind(this)); };
Controller.prototype.grantAllTriggers = function(area: string | null) { return grantAllTriggers(this._store, area, this.requestConfirmation.bind(this)); };
Controller.prototype.revokeAllTriggers = function(area: string | null) { return revokeAllTriggers(this._store, area, this.requestConfirmation.bind(this)); };

Controller.prototype.requestConfirmation = function(opts: { title: string; message: string; requireReason: boolean }) {
  const self = this;
  return new Promise(resolve => {
    self._pendingConfirm = { resolve, requireReason: opts.requireReason };
    emit(UARPS_EVENTS.MODAL_SHOW, { title: opts.title, message: opts.message, requireReason: opts.requireReason }, MODULE_ID);
  });
};

Controller.prototype.confirmModal = function(reason: string) {
  if (this._pendingConfirm) {
    const pending = this._pendingConfirm;
    if (pending.requireReason && !reason) { showToast('warning', 'Motivo obrigatório', 'Digite o motivo para continuar'); return; }
    this._pendingConfirm = null;
    pending.resolve({ confirmed: true, reason });
    emit(UARPS_EVENTS.MODAL_HIDE, {}, MODULE_ID);
  }
};

Controller.prototype.cancelModal = function() {
  if (this._pendingConfirm) { this._pendingConfirm.resolve(false); this._pendingConfirm = null; emit(UARPS_EVENTS.MODAL_HIDE, {}, MODULE_ID); }
};

Controller.prototype.setUserFilter = function(filter: Record<string, unknown>) { this._store.setUserFilter(filter); Telemetry.track('user-filter:change', filter); };
Controller.prototype.setFilter = function(filter: Record<string, unknown>) { this._store.setFilter(filter); Telemetry.track('filter:change', filter); };
Controller.prototype.setView = function(view: string) { this._store.setView(view); Telemetry.track('view:change', { view }); };

Controller.prototype.info = function() {
  return { version: VERSION, moduleId: MODULE_ID, initialized: this._initialized, portsInitialized: isPortsInitialized(), store: this._store && this._store.info ? this._store.info() : null };
};

Controller.prototype.healthCheck = function() {
  return { status: this._initialized ? 'HEALTHY' : 'NOT_INITIALIZED', version: VERSION, moduleId: MODULE_ID, portsInitialized: isPortsInitialized() };
};

Controller.prototype.destroy = function() {
  this._removeKeyboardShortcuts();
  this._initialized = false;
  this._store = null;
  this._pendingConfirm = null;
};

export { Controller, injectPorts, isPortsInitialized as getPorts };
export default Controller;
