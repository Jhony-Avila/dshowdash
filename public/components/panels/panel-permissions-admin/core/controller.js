import { Telemetry } from "../telemetry/tracker.js";
import { initPorts, injectPorts, getPorts as isPortsInitialized, emit, showToast } from "./ports.js";
import { UARPS_EVENTS } from "/core/runtime/events/catalog/uarps.events.js";
import { loadInitialData, selectUser, refresh, syncInventoryFromDOM } from "./data-loader.js";
import { toggleTrigger, toggleRegion } from "./toggle-operations.js";
import { toggleBulkMode, toggleBulkItem, selectAllInArea, clearBulk, bulkGrant, bulkRevoke, grantAllTriggers, revokeAllTriggers } from "./bulk-operations.js";
const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "uarps-admin-controller";
function Controller(options = {}) {
  this._store = options.store;
  this._initialized = false;
  this._pendingConfirm = null;
  this._keyboardHandler = null;
  this._abortController = null;
}
Controller.create = (options) => new Controller(options);
Controller.prototype.init = function() {
  initPorts();
  this._setupKeyboardShortcuts();
  this._initialized = true;
};
Controller.prototype._setupKeyboardShortcuts = function() {
  const self = this;
  this._abortController = new AbortController();
  this._keyboardHandler = (e) => {
    if (e.ctrlKey || e.metaKey) {
      if (e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        self.undo();
      } else if (e.key === "y" || e.key === "z" && e.shiftKey) {
        e.preventDefault();
        self.redo();
      }
    }
  };
  document.addEventListener("keydown", this._keyboardHandler, { signal: this._abortController.signal });
};
Controller.prototype._removeKeyboardShortcuts = function() {
  if (this._abortController) {
    this._abortController.abort();
    this._abortController = null;
    this._keyboardHandler = null;
  }
};
Controller.prototype.loadInitialData = function() {
  const self = this;
  return loadInitialData(this._store).then(() => {
    self._initialized = true;
  });
};
Controller.prototype.selectUser = function(userId) {
  return selectUser(this._store, userId);
};
Controller.prototype.refresh = function() {
  return refresh(this._store);
};
Controller.prototype.syncInventoryFromDOM = function() {
  return syncInventoryFromDOM(this._store);
};
Controller.prototype.undo = function() {
  if (!this._store.canUndo()) return false;
  const result = this._store.undo();
  if (result) {
    Telemetry.track("action:undo");
    showToast("info", "Desfeito", "A\xE7\xE3o revertida");
    emit(UARPS_EVENTS.UNDO, {}, MODULE_ID);
  }
  return result;
};
Controller.prototype.redo = function() {
  if (!this._store.canRedo()) return false;
  const result = this._store.redo();
  if (result) {
    Telemetry.track("action:redo");
    showToast("info", "Refeito", "A\xE7\xE3o restaurada");
    emit(UARPS_EVENTS.REDO, {}, MODULE_ID);
  }
  return result;
};
Controller.prototype.toggleTrigger = function(triggerId) {
  return toggleTrigger(this._store, triggerId);
};
Controller.prototype.toggleRegion = function(regionId) {
  return toggleRegion(this._store, regionId);
};
Controller.prototype.toggleBulkMode = function() {
  return toggleBulkMode(this._store);
};
Controller.prototype.toggleBulkItem = function(triggerId) {
  return toggleBulkItem(this._store, triggerId);
};
Controller.prototype.selectAllInArea = function(area) {
  return selectAllInArea(this._store, area);
};
Controller.prototype.clearBulk = function() {
  return clearBulk(this._store);
};
Controller.prototype.bulkGrant = function() {
  return bulkGrant(this._store, this.requestConfirmation.bind(this));
};
Controller.prototype.bulkRevoke = function() {
  return bulkRevoke(this._store, this.requestConfirmation.bind(this));
};
Controller.prototype.grantAllTriggers = function(area) {
  return grantAllTriggers(this._store, area, this.requestConfirmation.bind(this));
};
Controller.prototype.revokeAllTriggers = function(area) {
  return revokeAllTriggers(this._store, area, this.requestConfirmation.bind(this));
};
Controller.prototype.requestConfirmation = function(opts) {
  const self = this;
  return new Promise((resolve) => {
    self._pendingConfirm = { resolve, requireReason: opts.requireReason };
    emit(UARPS_EVENTS.MODAL_SHOW, { title: opts.title, message: opts.message, requireReason: opts.requireReason }, MODULE_ID);
  });
};
Controller.prototype.confirmModal = function(reason) {
  if (this._pendingConfirm) {
    const pending = this._pendingConfirm;
    if (pending.requireReason && !reason) {
      showToast("warning", "Motivo obrigat\xF3rio", "Digite o motivo para continuar");
      return;
    }
    this._pendingConfirm = null;
    pending.resolve({ confirmed: true, reason });
    emit(UARPS_EVENTS.MODAL_HIDE, {}, MODULE_ID);
  }
};
Controller.prototype.cancelModal = function() {
  if (this._pendingConfirm) {
    this._pendingConfirm.resolve(false);
    this._pendingConfirm = null;
    emit(UARPS_EVENTS.MODAL_HIDE, {}, MODULE_ID);
  }
};
Controller.prototype.setUserFilter = function(filter) {
  this._store.setUserFilter(filter);
  Telemetry.track("user-filter:change", filter);
};
Controller.prototype.setFilter = function(filter) {
  this._store.setFilter(filter);
  Telemetry.track("filter:change", filter);
};
Controller.prototype.setView = function(view) {
  this._store.setView(view);
  Telemetry.track("view:change", { view });
};
Controller.prototype.info = function() {
  return { version: VERSION, moduleId: MODULE_ID, initialized: this._initialized, portsInitialized: isPortsInitialized(), store: this._store && this._store.info ? this._store.info() : null };
};
Controller.prototype.healthCheck = function() {
  return { status: this._initialized ? "HEALTHY" : "NOT_INITIALIZED", version: VERSION, moduleId: MODULE_ID, portsInitialized: isPortsInitialized() };
};
Controller.prototype.destroy = function() {
  this._removeKeyboardShortcuts();
  this._initialized = false;
  this._store = null;
  this._pendingConfirm = null;
};
var controller_default = Controller;
export {
  Controller,
  MODULE_ID,
  VERSION,
  controller_default as default,
  isPortsInitialized as getPorts,
  injectPorts
};
