// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.1.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-orchestrator-manager-crud
// PURPOSE: Panel Orchestrator Manager - CRUD Handlers
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   api from ../api/adapter.js
//   state from ../state/store.js
//   tracker from ../telemetry/tracker.js
//
// PROVIDES:
//   MODULE_ID — module constant
//   VERSION — module constant
//   getEditingItem() — exported function
//   setEditingItem() — exported function
//   clearEditingItem() — exported function
//   getPendingDelete() — exported function
//   setPendingDelete() — exported function
//   clearPendingDelete() — exported function
//   info() — exported function
//   healthCheck() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { api } from '../api/adapter.js';
import { state } from '../state/store.js';

// @ts-expect-error TS migration - TS2724
import { tracker } from '../telemetry/tracker.js';

export const MODULE_ID = 'panel-orchestrator-manager-crud';
export const VERSION = '9.3.0-P2-ENTERPRISE';

interface Callbacks {
  showToast: (message: string, type: string) => void;
  closeAllModals: () => void;
}

let editingItem: Record<string, unknown> | null = null;
let pendingDelete: Record<string, unknown> | null = null;

export function getEditingItem() { return editingItem; }
export function setEditingItem(item: Record<string, unknown>) { editingItem = item; }
export function clearEditingItem() { editingItem = null; }

export function getPendingDelete() { return pendingDelete; }
export function setPendingDelete(item: Record<string, unknown>) { pendingDelete = item; }
export function clearPendingDelete() { pendingDelete = null; }

// TRIGGERS
export async function loadTriggers(component: string | null) {
  component = component || null;
  state.setLoading(true);
  try {
    // @ts-expect-error strict migration — TS2345
    const triggers = (await api.getTriggers(component)) as Record<string, unknown>[];
    state.setState({ triggers, isLoading: false });
    tracker.track('triggers:loaded', { count: triggers.length, component });
    return triggers;
  } catch (error) {
    state.setError((error as Error).message);
    throw error;
  }
}

export async function saveTrigger(data: Record<string, unknown>, callbacks: Callbacks) {
  try {
    if (data.id) {
      await api.updateTrigger(data.id as string | number, data);
      callbacks.showToast('Trigger atualizado!', 'success');
      tracker.track('trigger:updated', { id: data.id });
    } else {
      await api.createTrigger(data);
      callbacks.showToast('Trigger criado!', 'success');
      tracker.track('trigger:created', { key: data.trigger_key });
    }
    callbacks.closeAllModals();
    clearEditingItem();
    await loadTriggers(state.getState().filterComponent);
  } catch (error) {
    callbacks.showToast((error as Error).message, 'error');
    throw error;
  }
}

export async function toggleTrigger(id: string | number, currentState: boolean | number, callbacks: Callbacks) {
  try {
    await api.toggleTrigger(id, currentState);
    callbacks.showToast(`Trigger ${currentState ? 'desativado' : 'ativado'}!`, 'success');
    tracker.track('trigger:toggled', { id, newState: !currentState });
    await loadTriggers(state.getState().filterComponent);
  } catch (error) {
    callbacks.showToast((error as Error).message, 'error');
    throw error;
  }
}

export async function deleteTrigger(id: string | number, callbacks: Callbacks) {
  try {
    await api.deleteTrigger(id);
    callbacks.showToast('Trigger excluído!', 'success');
    tracker.track('trigger:deleted', { id });
    clearPendingDelete();
    callbacks.closeAllModals();
    await loadTriggers(state.getState().filterComponent);
  } catch (error) {
    callbacks.showToast((error as Error).message, 'error');
    throw error;
  }
}

// RULES
export async function loadRules() {
  state.setLoading(true);
  try {
    const rules = (await api.getRules()) as Record<string, unknown>[];
    state.setState({ rules, isLoading: false });
    tracker.track('rules:loaded', { count: rules.length });
    return rules;
  } catch (error) {
    state.setError((error as Error).message);
    throw error;
  }
}

export async function saveRule(data: Record<string, unknown>, callbacks: Callbacks) {
  try {
    if (data.id) {
      await api.updateRule(data.id as string | number, data);
      callbacks.showToast('Rule atualizada!', 'success');
      tracker.track('rule:updated', { id: data.id });
    } else {
      await api.createRule(data);
      callbacks.showToast('Rule criada!', 'success');
      tracker.track('rule:created', { key: data.rule_key });
    }
    callbacks.closeAllModals();
    clearEditingItem();
    await loadRules();
  } catch (error) {
    callbacks.showToast((error as Error).message, 'error');
    throw error;
  }
}

export async function toggleRule(id: string | number, currentState: boolean | number, callbacks: Callbacks) {
  try {
    await api.toggleRule(id, currentState);
    callbacks.showToast(`Rule ${currentState ? 'desativada' : 'ativada'}!`, 'success');
    tracker.track('rule:toggled', { id, newState: !currentState });
    await loadRules();
  } catch (error) {
    callbacks.showToast((error as Error).message, 'error');
    throw error;
  }
}

export async function deleteRule(id: string | number, callbacks: Callbacks) {
  try {
    await api.deleteRule(id);
    callbacks.showToast('Rule excluída!', 'success');
    tracker.track('rule:deleted', { id });
    clearPendingDelete();
    callbacks.closeAllModals();
    await loadRules();
  } catch (error) {
    callbacks.showToast((error as Error).message, 'error');
    throw error;
  }
}

// FLAGS
export async function loadFlags() {
  state.setLoading(true);
  try {
    const flags = (await api.getFlags()) as Record<string, unknown>[];
    state.setState({ flags, isLoading: false });
    tracker.track('flags:loaded', { count: flags.length });
    return flags;
  } catch (error) {
    state.setError((error as Error).message);
    throw error;
  }
}

export async function saveFlag(data: Record<string, unknown>, callbacks: Callbacks) {
  try {
    if (data.id) {
      await api.updateFlag(data.id as string | number, data);
      callbacks.showToast('Flag atualizada!', 'success');
      tracker.track('flag:updated', { id: data.id });
    } else {
      await api.createFlag(data);
      callbacks.showToast('Flag criada!', 'success');
      tracker.track('flag:created', { key: data.flag_key });
    }
    callbacks.closeAllModals();
    clearEditingItem();
    await loadFlags();
  } catch (error) {
    callbacks.showToast((error as Error).message, 'error');
    throw error;
  }
}

export async function toggleFlag(id: string | number, currentState: boolean | number, callbacks: Callbacks) {
  try {
    await api.toggleFlag(id, currentState);
    callbacks.showToast(`Flag ${currentState ? 'desabilitada' : 'habilitada'}!`, 'success');
    tracker.track('flag:toggled', { id, newState: !currentState });
    await loadFlags();
  } catch (error) {
    callbacks.showToast((error as Error).message, 'error');
    throw error;
  }
}

export async function deleteFlag(id: string | number, callbacks: Callbacks) {
  try {
    await api.deleteFlag(id);
    callbacks.showToast('Flag excluída!', 'success');
    tracker.track('flag:deleted', { id });
    clearPendingDelete();
    callbacks.closeAllModals();
    await loadFlags();
  } catch (error) {
    callbacks.showToast((error as Error).message, 'error');
    throw error;
  }
}

export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION }; }

export default { MODULE_ID, VERSION, loadTriggers, saveTrigger, toggleTrigger, deleteTrigger, loadRules, saveRule, toggleRule, deleteRule, loadFlags, saveFlag, toggleFlag, deleteFlag, getEditingItem, setEditingItem, clearEditingItem, getPendingDelete, setPendingDelete, clearPendingDelete, info, healthCheck };
