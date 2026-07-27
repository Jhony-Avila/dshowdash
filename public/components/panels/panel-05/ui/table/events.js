const EventEmitterMixin = {
  _initEvents() {
    this._listeners = /* @__PURE__ */ new Map();
  },
  on(event, callback) {
    if (!this._listeners.has(event)) {
      this._listeners.set(event, []);
    }
    this._listeners.get(event).push(callback);
    return () => this.off(event, callback);
  },
  off(event, callback) {
    const callbacks = this._listeners.get(event);
    if (callbacks) {
      const idx = callbacks.indexOf(callback);
      if (idx > -1) callbacks.splice(idx, 1);
    }
  },
  emit(event, data) {
    const callbacks = this._listeners.get(event);
    if (callbacks) {
      callbacks.forEach((cb) => {
        try {
          cb(data);
        } catch (e) {
          Logger?.error?.("[panel-05:table:events]", event, e);
        }
      });
    }
  },
  clearEvents() {
    this._listeners.clear();
  }
};
const TABLE_EVENTS = {
  // Row actions
  VIEW: "view",
  EDIT: "edit",
  DELETE: "delete",
  TOGGLE_FAVORITO: "toggleFavorito",
  // Selection
  ROW_SELECT: "rowSelect",
  ROW_EXPAND: "rowExpand",
  // Bulk actions
  BULK_DELETE: "bulkDelete",
  // Data
  SORT: "sort",
  SEARCH: "search",
  PAGE: "page",
  EXPORT: "export",
  // Scroll
  LOAD_MORE: "loadMore",
  INFINITE_LOADED: "infiniteLoaded",
  SCROLL_MODE_CHANGE: "scrollModeChange",
  // Columns
  COLUMN_REORDER: "columnReorder",
  // UI
  TOAST: "toast"
};
function applyEventEmitter(target) {
  Object.assign(target, EventEmitterMixin);
  target._initEvents();
}
var events_default = EventEmitterMixin;
const MODULE_ID = "panel-05:table:events";
const VERSION = "9.3.0-P2-ENTERPRISE";
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION, checks: { eventsReady: true } };
}
export {
  EventEmitterMixin,
  MODULE_ID,
  TABLE_EVENTS,
  VERSION,
  applyEventEmitter,
  events_default as default,
  healthCheck,
  info
};
