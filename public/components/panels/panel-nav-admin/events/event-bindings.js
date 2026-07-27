import { createPanelPorts } from "/core/runtime/ports-profiles.js";
import { isEnabled } from "../config/feature-flags.js";
const VERSION = "10.3.0-MIGRATION-PHASE7";
const MODULE_ID = "panel-nav-admin.events.event-bindings";
const Ports = createPanelPorts({ moduleId: MODULE_ID });
function injectPorts(p) {
  return Ports.inject(p);
}
const _log = (level, ...args) => {
  const logger = Ports.get("logger");
  if (!logger) return;
  const prefix = "[EventBindings]";
  if (level === "error") logger.error?.(prefix, ...args);
  else if (level === "debug") logger.debug?.(prefix, ...args);
  else logger.info?.(prefix, ...args);
};
const DEFAULT_BINDINGS = Object.freeze([
  { action: "edit-item", event: "click", selector: '[data-action="edit-item"]', handler: "onEditItem", featureFlag: null },
  { action: "delete-item", event: "click", selector: '[data-action="delete-item"]', handler: "onDeleteItem", featureFlag: null },
  { action: "duplicate-item", event: "click", selector: '[data-action="duplicate-item"]', handler: "onDuplicateItem", featureFlag: "duplicateItem" },
  { action: "toggle-active", event: "click", selector: '[data-action="toggle-active"]', handler: "onToggleActive", featureFlag: null },
  { action: "move-to-section", event: "click", selector: '[data-action="move-to-section"]', handler: "onMoveToSection", featureFlag: null },
  { action: "bulk-select", event: "change", selector: '[data-action="bulk-select"]', handler: "onBulkSelect", featureFlag: "bulkOperations" },
  { action: "bulk-select-all", event: "change", selector: '[data-action="bulk-select-all"]', handler: "onBulkSelectAll", featureFlag: "bulkOperations" },
  { action: "export", event: "click", selector: '[data-action="export"]', handler: "onExport", featureFlag: null },
  { action: "import", event: "click", selector: '[data-action="import"]', handler: "onImport", featureFlag: null },
  { action: "change-view", event: "click", selector: '[data-action="change-view"]', handler: "onChangeView", featureFlag: null },
  { action: "change-density", event: "click", selector: '[data-action="change-density"]', handler: "onChangeDensity", featureFlag: null },
  { action: "save-view", event: "click", selector: '[data-action="save-view"]', handler: "onSaveView", featureFlag: "savedViews" },
  { action: "open-drawer", event: "click", selector: '[data-action="open-drawer"]', handler: "onOpenDrawer", featureFlag: "drawer" },
  { action: "sort-column", event: "click", selector: '[data-action="sort-column"]', handler: "onSortColumn", featureFlag: null },
  { action: "resize-column", event: "mousedown", selector: '[data-action="resize-column"]', handler: "onResizeColumn", featureFlag: null }
]);
function EventBindings(container, handlers, options = {}) {
  const bindings = options.bindings || DEFAULT_BINDINGS;
  const abortController = options.abortController;
  const _activeBindings = [];
  let _bound = false;
  function bind() {
    if (_bound || !container) return;
    const signal = abortController?.signal;
    const groupedByEvent = {};
    for (const binding of bindings) {
      if (binding.featureFlag && !isEnabled(binding.featureFlag)) continue;
      if (!handlers[binding.handler]) continue;
      if (!groupedByEvent[binding.event]) {
        groupedByEvent[binding.event] = [];
      }
      groupedByEvent[binding.event].push(binding);
    }
    for (const [eventType, eventBindings] of Object.entries(groupedByEvent)) {
      const listener = (e) => {
        for (const binding of eventBindings) {
          const target = e.target.closest(binding.selector);
          if (target) {
            try {
              handlers[binding.handler](e, target);
            } catch (err) {
              _log("error", `Handler "${binding.handler}" failed:`, err);
            }
            break;
          }
        }
      };
      const opts = signal ? { signal } : {};
      container.addEventListener(eventType, listener, opts);
      _activeBindings.push({ eventType, listener });
    }
    _bound = true;
    _log("debug", `Bound ${_activeBindings.length} event groups`);
  }
  function unbind() {
    if (!_bound || !container) return;
    for (const { eventType, listener } of _activeBindings) {
      container.removeEventListener(eventType, listener);
    }
    _activeBindings.length = 0;
    _bound = false;
    _log("debug", "All bindings removed");
  }
  function rebind() {
    unbind();
    bind();
  }
  function isBound() {
    return _bound;
  }
  function getBindingCount() {
    return _activeBindings.length;
  }
  return { bind, unbind, rebind, isBound, getBindingCount };
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, defaultBindingsCount: DEFAULT_BINDINGS.length };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION };
}
var event_bindings_default = { EventBindings, DEFAULT_BINDINGS, injectPorts, info, healthCheck, VERSION, MODULE_ID };
export {
  DEFAULT_BINDINGS,
  EventBindings,
  MODULE_ID,
  VERSION,
  event_bindings_default as default,
  healthCheck,
  info,
  injectPorts
};
