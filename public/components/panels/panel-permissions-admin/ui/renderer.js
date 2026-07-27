import { Templates } from "./templates.js";
import { initPorts, injectPorts, getPorts } from "../core/ports.js";
import { bindControlEvents, bindUserGridEvents, bindMatrixEvents, bindUserFocusEvents, bindViewToggleEvents, bindBulkActionEvents, bindModalEvents, bindGlobalEvents, unbindAll as unbindAllEvents } from "./event-binders.js";
import { renderUsers, highlightSelectedUser, renderUserFocus, renderMatrix, renderStats, renderLoadingState } from "./render-sections.js";
import { updateUndoRedoButtons, updateBulkUI, updateViewToggle, updateCacheIndicator, showModal, hideModal } from "./ui-updates.js";
const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "uarps-admin-renderer";
function Renderer(options = {}) {
  this._container = options.container;
  this._store = options.store;
  this._controller = options.controller;
  this._elements = {};
  this._unsubscribe = null;
  this._eventUnsubscribers = [];
}
Renderer.create = (options) => new Renderer(options);
Renderer.prototype.render = function() {
  const self = this;
  if (!this._container) return Promise.resolve();
  initPorts();
  this._container.innerHTML = Templates.layout();
  this._cacheElements();
  this._bindEvents();
  this._bindGlobalEvents();
  this._unsubscribe = this._store.subscribe((change) => self._onStoreChange(change));
  renderUsers(this._elements, this._store);
  renderUserFocus(this._elements, this._store);
  renderMatrix(this._elements, this._store);
  renderStats(this._elements, this._store);
  updateUndoRedoButtons(this._elements, this._store);
  updateBulkUI(this._elements, this._store);
  return Promise.resolve();
};
Renderer.prototype._cacheElements = function() {
  this._elements = {
    userGrid: this._container.querySelector('[data-slot="user-grid"]'),
    userFocus: this._container.querySelector('[data-slot="user-focus"]'),
    matrix: this._container.querySelector('[data-slot="permission-matrix"]'),
    stats: this._container.querySelector('[data-slot="stats"]'),
    cache: this._container.querySelector('[data-slot="cache"]'),
    bulkActions: this._container.querySelector('[data-slot="bulk-actions"]'),
    search: this._container.querySelector('[data-action="search"]'),
    filterType: this._container.querySelector('[data-action="filter-type"]'),
    filterStatus: this._container.querySelector('[data-action="filter-status"]'),
    sortUsers: this._container.querySelector('[data-action="sort-users"]'),
    undoBtn: this._container.querySelector('[data-action="undo"]'),
    redoBtn: this._container.querySelector('[data-action="redo"]'),
    syncBtn: this._container.querySelector('[data-action="sync-inventory"]'),
    refreshBtn: this._container.querySelector('[data-action="refresh"]'),
    modal: this._container.querySelector('[data-modal="confirm"]'),
    modalTitle: this._container.querySelector('[data-slot="modal-title"]'),
    modalBody: this._container.querySelector('[data-slot="modal-body"]'),
    modalReason: this._container.querySelector('[data-input="reason"]'),
    modalConfirm: this._container.querySelector('[data-action="modal-confirm"]')
  };
};
Renderer.prototype._bindEvents = function() {
  const self = this;
  const updateBulkFn = () => updateBulkUI(self._elements, self._store);
  const renderMatrixFn = () => renderMatrix(self._elements, self._store);
  const updateViewFn = (view) => updateViewToggle(self._container, view);
  const renderUsersFn = () => renderUsers(self._elements, self._store);
  bindControlEvents(this._elements, this._controller, this._store, updateBulkFn);
  bindUserGridEvents(this._elements.userGrid, this._controller);
  bindMatrixEvents(this._elements.matrix, this._controller, this._store, updateBulkFn);
  bindUserFocusEvents(this._elements.userFocus, this._controller);
  bindViewToggleEvents(this._container, this._controller, updateViewFn, renderMatrixFn);
  bindBulkActionEvents(this._container, this._controller, updateBulkFn);
  bindModalEvents(this._container, this._elements, this._controller);
};
Renderer.prototype._bindGlobalEvents = function() {
  const self = this;
  const showModalFn = (opts) => showModal(self._elements, opts.title, opts.message, opts.requireReason);
  const hideModalFn = () => hideModal(self._elements);
  this._eventUnsubscribers = bindGlobalEvents(showModalFn, hideModalFn);
};
Renderer.prototype._onStoreChange = function(change) {
  const c = change;
  switch (c.key) {
    case "users":
      renderUsers(this._elements, this._store);
      break;
    case "selectedUser":
      renderUserFocus(this._elements, this._store);
      renderMatrix(this._elements, this._store);
      highlightSelectedUser(this._elements, this._store);
      break;
    case "permissions":
    case "triggers":
    case "regions":
      renderMatrix(this._elements, this._store);
      renderStats(this._elements, this._store);
      renderUserFocus(this._elements, this._store);
      break;
    case "loading":
      renderLoadingState(this._container, this._store);
      break;
    case "filter":
      renderMatrix(this._elements, this._store);
      break;
    case "history":
      updateUndoRedoButtons(this._elements, this._store);
      break;
    case "bulk":
      updateBulkUI(this._elements, this._store);
      break;
    case "sync":
      updateCacheIndicator(this._elements, this._store);
      break;
  }
};
Renderer.prototype.destroy = function() {
  unbindAllEvents();
  if (this._unsubscribe) {
    this._unsubscribe();
    this._unsubscribe = null;
  }
  for (let i = 0; i < this._eventUnsubscribers.length; i++) {
    if (this._eventUnsubscribers[i]) this._eventUnsubscribers[i]();
  }
  this._eventUnsubscribers = [];
  this._elements = {};
  this._container = null;
};
Renderer.prototype.info = function() {
  return { moduleId: MODULE_ID, version: VERSION, hasContainer: !!this._container, elementsCount: Object.keys(this._elements).length };
};
Renderer.prototype.healthCheck = function() {
  return { status: this._container ? "HEALTHY" : "IDLE", moduleId: MODULE_ID, version: VERSION, checks: { containerReady: !!this._container, elementsReady: Object.keys(this._elements).length > 0 } };
};
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION, checks: { rendererClassReady: typeof Renderer === "function" } };
}
var renderer_default = Renderer;
export {
  MODULE_ID,
  Renderer,
  VERSION,
  renderer_default as default,
  getPorts,
  healthCheck,
  info,
  injectPorts
};
