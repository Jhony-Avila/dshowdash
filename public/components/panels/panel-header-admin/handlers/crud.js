import { createUiPorts } from "/core/runtime/ports-profiles.js";
import * as state from "../state/index.js";
import * as api from "../api/client.js";
const MODULE_ID = "panel-header-admin:handlers:crud";
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
  const logger = _getPort("logger");
  if (logger) return logger;
  if (window.Core?.windowAdapter?.get) {
    const wl = window.Core.windowAdapter.get("Logger");
    if (wl) return wl;
  }
  return null;
}
function log(level, msg, data) {
  const logger = _getLogger();
  if (logger && logger[level]) logger[level](`[${MODULE_ID}]`, msg, data);
}
function openNewComponentModal() {
  state.setEditingComponent({ component_type: "indicator", order_index: 0, show_on_mobile: 1, show_on_tablet: 1, show_on_desktop: 1, is_active: 1, uarps_trigger_id: null });
  state.setModalOpen(true);
  log("debug", "New component modal opened");
}
function openEditComponentModal(componentId) {
  const components = state.getComponents();
  const component = components.find((c) => c.id == componentId);
  if (!component) {
    log("warn", "Component not found", { componentId });
    return;
  }
  state.setEditingComponent(component);
  state.setModalOpen(true);
  log("debug", "Edit component modal opened", { componentId });
}
function closeModal() {
  state.setEditingComponent(null);
  state.setModalOpen(false);
  log("debug", "Modal closed");
}
async function saveComponent(formData) {
  const editingComponent = state.getEditingComponent();
  const isNew = !editingComponent || !editingComponent.id;
  const payload = {
    component_key: formData.get("component_key"),
    label: formData.get("label"),
    component_type: formData.get("component_type"),
    group_id: formData.get("group_id") || null,
    icon_name: formData.get("icon_name") || null,
    tooltip: formData.get("tooltip") || null,
    description: formData.get("description") || null,
    order_index: parseInt(formData.get("order_index")) || 0,
    show_on_mobile: formData.get("show_on_mobile") ? 1 : 0,
    show_on_tablet: formData.get("show_on_tablet") ? 1 : 0,
    show_on_desktop: formData.get("show_on_desktop") ? 1 : 0,
    is_active: formData.get("is_active") ? 1 : 0,
    uarps_trigger_id: formData.get("uarps_trigger_id") || null
  };
  state.setLoading(true);
  try {
    let result;
    if (isNew) {
      result = await api.createComponent(payload);
      log("info", "Component created", { key: payload.component_key });
    } else {
      payload.id = editingComponent.id;
      result = await api.updateComponent(payload);
      log("info", "Component updated", { id: payload.id });
    }
    if (result.success) {
      closeModal();
      await refreshComponents();
    }
    return result;
  } catch (err) {
    log("error", "Failed to save component", { error: err.message });
    return { success: false, error: err.message };
  } finally {
    state.setLoading(false);
  }
}
async function deleteComponent(componentId) {
  state.setLoading(true);
  try {
    const result = await api.deleteComponent(componentId);
    if (result.success) {
      log("info", "Component deleted", { componentId });
      await refreshComponents();
    }
    return result;
  } catch (err) {
    log("error", "Failed to delete component", { error: err.message });
    return { success: false, error: err.message };
  } finally {
    state.setLoading(false);
  }
}
async function toggleComponent(componentId) {
  const components = state.getComponents();
  const component = components.find((c) => c.id == componentId);
  if (!component) return { success: false, error: "Component not found" };
  const newStatus = component.is_active ? 0 : 1;
  return await api.updateComponent({ id: componentId, is_active: newStatus });
}
async function refreshComponents() {
  state.setLoading(true);
  try {
    const result = await api.fetchComponents(true);
    if (result.success) {
      state.setComponents(result.data || []);
    }
    return result;
  } catch (err) {
    log("error", "Failed to refresh components", { error: err.message });
    return { success: false, error: err.message };
  } finally {
    state.setLoading(false);
  }
}
export {
  MODULE_ID,
  VERSION,
  closeModal,
  deleteComponent,
  getPorts,
  injectPorts,
  openEditComponentModal,
  openNewComponentModal,
  refreshComponents,
  saveComponent,
  toggleComponent
};
