import { createUiPorts } from "/core/runtime/ports-profiles.js";
import * as adapter from "../core/navrail-adapter.js";
const MODULE_ID = "panel-navrail-admin:handlers:crud";
const VERSION = "9.3.0-P2-ENTERPRISE";
const Ports = createUiPorts({ moduleId: MODULE_ID });
function _getPort(name) {
  return Ports.get(name);
}
function injectPorts(p) {
  return Ports.inject(p);
}
function getPorts() {
  return Ports.snapshot();
}
function _getLogger() {
  const portLogger = _getPort("logger");
  if (portLogger) return portLogger;
  if (typeof window !== "undefined" && window.Core?.windowAdapter?.get) {
    const waLogger = window.Core.windowAdapter.get("Logger");
    if (waLogger) return waLogger;
  }
  return null;
}
const _state = { items: [], groups: [], editingItem: null, isModalOpen: false, isLoading: false };
let _listeners = [];
function log(level, msg, data) {
  const logger = _getLogger();
  if (logger && logger[level]) logger[level](`[${MODULE_ID}]`, msg, data);
}
function notifyListeners() {
  _listeners.forEach((fn) => {
    fn(_state);
  });
}
function subscribe(fn) {
  _listeners.push(fn);
  return () => {
    _listeners = _listeners.filter((l) => l !== fn);
  };
}
function getState() {
  return _state;
}
function openNewItemModal() {
  _state.editingItem = { id: "", label: "", tooltip: "", icon: "circle", groupId: null, actionType: "openPanel", actionPanelId: "", order: 0, badgeType: "none", showOnDesktop: true, showOnTablet: true, showOnMobile: true, isActive: true, uarpsTrigger: null };
  _state.isModalOpen = true;
  notifyListeners();
  log("debug", "New item modal opened");
}
function openEditItemModal(itemId) {
  const item = _state.items.find((i) => i.id === itemId || i.dbId == itemId);
  if (!item) {
    log("warn", "Item not found", { itemId });
    return;
  }
  _state.editingItem = Object.assign({}, item);
  _state.isModalOpen = true;
  notifyListeners();
  log("debug", "Edit item modal opened", { itemId });
}
function closeModal() {
  _state.editingItem = null;
  _state.isModalOpen = false;
  notifyListeners();
}
async function saveItem(formData) {
  const isNew = !_state.editingItem || !_state.editingItem.dbId;
  const item = {
    id: formData.get("item_key"),
    label: formData.get("label"),
    tooltip: formData.get("tooltip") || null,
    icon: formData.get("icon_name") || "circle",
    groupId: formData.get("group_id") || null,
    actionType: formData.get("action_type") || "openPanel",
    actionPanelId: formData.get("action_panel_id") || null,
    order: parseInt(formData.get("order_index")) || 0,
    badgeType: formData.get("badge_type") || "none",
    showOnDesktop: !!formData.get("show_on_desktop"),
    showOnTablet: !!formData.get("show_on_tablet"),
    showOnMobile: !!formData.get("show_on_mobile"),
    isActive: !!formData.get("is_active"),
    uarpsTrigger: formData.get("uarps_trigger_id") || null
  };
  _state.isLoading = true;
  notifyListeners();
  try {
    let result;
    if (isNew) {
      result = await adapter.createItem(item);
      log("info", "Item created", { id: item.id });
    } else {
      result = await adapter.updateItem(_state.editingItem.dbId, item);
      log("info", "Item updated", { id: _state.editingItem.dbId });
    }
    if (result.success) {
      closeModal();
      await refreshItems();
    }
    return result;
  } catch (err) {
    log("error", "Failed to save item", { error: err.message });
    return { success: false, error: err.message };
  } finally {
    _state.isLoading = false;
    notifyListeners();
  }
}
async function deleteItem(itemId) {
  _state.isLoading = true;
  notifyListeners();
  try {
    const result = await adapter.deleteItem(itemId);
    if (result.success) {
      log("info", "Item deleted", { itemId });
      await refreshItems();
    }
    return result;
  } catch (err) {
    log("error", "Failed to delete item", { error: err.message });
    return { success: false, error: err.message };
  } finally {
    _state.isLoading = false;
    notifyListeners();
  }
}
async function refreshItems() {
  _state.isLoading = true;
  notifyListeners();
  try {
    const result = await adapter.fetchItems(true);
    if (result.success) {
      _state.items = result.data || [];
      _state.groups = result.groups || [];
    }
    return result;
  } catch (err) {
    log("error", "Failed to refresh items", { error: err.message });
    return { success: false, error: err.message };
  } finally {
    _state.isLoading = false;
    notifyListeners();
  }
}
async function init() {
  log("info", "Initializing CRUD handlers");
  await refreshItems();
  const groupsResult = await adapter.fetchGroups();
  if (groupsResult.success) {
    _state.groups = groupsResult.data || [];
    notifyListeners();
  }
}
export {
  MODULE_ID,
  VERSION,
  closeModal,
  deleteItem,
  getPorts,
  getState,
  init,
  injectPorts,
  openEditItemModal,
  openNewItemModal,
  refreshItems,
  saveItem,
  subscribe
};
