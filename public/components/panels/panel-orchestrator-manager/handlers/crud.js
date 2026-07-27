import { api } from "../api/adapter.js";
import { state } from "../state/store.js";
import { tracker } from "../telemetry/tracker.js";
const MODULE_ID = "panel-orchestrator-manager-crud";
const VERSION = "9.3.0-P2-ENTERPRISE";
let editingItem = null;
let pendingDelete = null;
function getEditingItem() {
  return editingItem;
}
function setEditingItem(item) {
  editingItem = item;
}
function clearEditingItem() {
  editingItem = null;
}
function getPendingDelete() {
  return pendingDelete;
}
function setPendingDelete(item) {
  pendingDelete = item;
}
function clearPendingDelete() {
  pendingDelete = null;
}
async function loadTriggers(component) {
  component = component || null;
  state.setLoading(true);
  try {
    const triggers = await api.getTriggers(component);
    state.setState({ triggers, isLoading: false });
    tracker.track("triggers:loaded", { count: triggers.length, component });
    return triggers;
  } catch (error) {
    state.setError(error.message);
    throw error;
  }
}
async function saveTrigger(data, callbacks) {
  try {
    if (data.id) {
      await api.updateTrigger(data.id, data);
      callbacks.showToast("Trigger atualizado!", "success");
      tracker.track("trigger:updated", { id: data.id });
    } else {
      await api.createTrigger(data);
      callbacks.showToast("Trigger criado!", "success");
      tracker.track("trigger:created", { key: data.trigger_key });
    }
    callbacks.closeAllModals();
    clearEditingItem();
    await loadTriggers(state.getState().filterComponent);
  } catch (error) {
    callbacks.showToast(error.message, "error");
    throw error;
  }
}
async function toggleTrigger(id, currentState, callbacks) {
  try {
    await api.toggleTrigger(id, currentState);
    callbacks.showToast(`Trigger ${currentState ? "desativado" : "ativado"}!`, "success");
    tracker.track("trigger:toggled", { id, newState: !currentState });
    await loadTriggers(state.getState().filterComponent);
  } catch (error) {
    callbacks.showToast(error.message, "error");
    throw error;
  }
}
async function deleteTrigger(id, callbacks) {
  try {
    await api.deleteTrigger(id);
    callbacks.showToast("Trigger exclu\xEDdo!", "success");
    tracker.track("trigger:deleted", { id });
    clearPendingDelete();
    callbacks.closeAllModals();
    await loadTriggers(state.getState().filterComponent);
  } catch (error) {
    callbacks.showToast(error.message, "error");
    throw error;
  }
}
async function loadRules() {
  state.setLoading(true);
  try {
    const rules = await api.getRules();
    state.setState({ rules, isLoading: false });
    tracker.track("rules:loaded", { count: rules.length });
    return rules;
  } catch (error) {
    state.setError(error.message);
    throw error;
  }
}
async function saveRule(data, callbacks) {
  try {
    if (data.id) {
      await api.updateRule(data.id, data);
      callbacks.showToast("Rule atualizada!", "success");
      tracker.track("rule:updated", { id: data.id });
    } else {
      await api.createRule(data);
      callbacks.showToast("Rule criada!", "success");
      tracker.track("rule:created", { key: data.rule_key });
    }
    callbacks.closeAllModals();
    clearEditingItem();
    await loadRules();
  } catch (error) {
    callbacks.showToast(error.message, "error");
    throw error;
  }
}
async function toggleRule(id, currentState, callbacks) {
  try {
    await api.toggleRule(id, currentState);
    callbacks.showToast(`Rule ${currentState ? "desativada" : "ativada"}!`, "success");
    tracker.track("rule:toggled", { id, newState: !currentState });
    await loadRules();
  } catch (error) {
    callbacks.showToast(error.message, "error");
    throw error;
  }
}
async function deleteRule(id, callbacks) {
  try {
    await api.deleteRule(id);
    callbacks.showToast("Rule exclu\xEDda!", "success");
    tracker.track("rule:deleted", { id });
    clearPendingDelete();
    callbacks.closeAllModals();
    await loadRules();
  } catch (error) {
    callbacks.showToast(error.message, "error");
    throw error;
  }
}
async function loadFlags() {
  state.setLoading(true);
  try {
    const flags = await api.getFlags();
    state.setState({ flags, isLoading: false });
    tracker.track("flags:loaded", { count: flags.length });
    return flags;
  } catch (error) {
    state.setError(error.message);
    throw error;
  }
}
async function saveFlag(data, callbacks) {
  try {
    if (data.id) {
      await api.updateFlag(data.id, data);
      callbacks.showToast("Flag atualizada!", "success");
      tracker.track("flag:updated", { id: data.id });
    } else {
      await api.createFlag(data);
      callbacks.showToast("Flag criada!", "success");
      tracker.track("flag:created", { key: data.flag_key });
    }
    callbacks.closeAllModals();
    clearEditingItem();
    await loadFlags();
  } catch (error) {
    callbacks.showToast(error.message, "error");
    throw error;
  }
}
async function toggleFlag(id, currentState, callbacks) {
  try {
    await api.toggleFlag(id, currentState);
    callbacks.showToast(`Flag ${currentState ? "desabilitada" : "habilitada"}!`, "success");
    tracker.track("flag:toggled", { id, newState: !currentState });
    await loadFlags();
  } catch (error) {
    callbacks.showToast(error.message, "error");
    throw error;
  }
}
async function deleteFlag(id, callbacks) {
  try {
    await api.deleteFlag(id);
    callbacks.showToast("Flag exclu\xEDda!", "success");
    tracker.track("flag:deleted", { id });
    clearPendingDelete();
    callbacks.closeAllModals();
    await loadFlags();
  } catch (error) {
    callbacks.showToast(error.message, "error");
    throw error;
  }
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION };
}
var crud_default = { MODULE_ID, VERSION, loadTriggers, saveTrigger, toggleTrigger, deleteTrigger, loadRules, saveRule, toggleRule, deleteRule, loadFlags, saveFlag, toggleFlag, deleteFlag, getEditingItem, setEditingItem, clearEditingItem, getPendingDelete, setPendingDelete, clearPendingDelete, info, healthCheck };
export {
  MODULE_ID,
  VERSION,
  clearEditingItem,
  clearPendingDelete,
  crud_default as default,
  deleteFlag,
  deleteRule,
  deleteTrigger,
  getEditingItem,
  getPendingDelete,
  healthCheck,
  info,
  loadFlags,
  loadRules,
  loadTriggers,
  saveFlag,
  saveRule,
  saveTrigger,
  setEditingItem,
  setPendingDelete,
  toggleFlag,
  toggleRule,
  toggleTrigger
};
