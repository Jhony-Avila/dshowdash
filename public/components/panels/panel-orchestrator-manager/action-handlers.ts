// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.2.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-orchestrator-manager:action-handlers
// PURPOSE: Panel Orchestrator Manager - Action Handlers
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   state from ./state/store.js
//   api from ./api/adapter.js
//   ui from ./ui/renderer.js
//   handleSimulate, runSimulation from ./simulation.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   handleAction() — exported function
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

import { state } from './state/store.js';
import { api } from './api/adapter.js';
import * as crud from './handlers/crud.js';
import * as uiActions from './handlers/ui-actions.js';
import { ui } from './ui/renderer.js';
import { handleSimulate, runSimulation } from './simulation.js';

export const VERSION = '9.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'panel-orchestrator-manager:action-handlers';

interface ActionCallbacks {
  loadStats: () => Promise<unknown>;
  loadData: () => Promise<unknown>;
  loadAudit: () => void;
  showToast: (msg: string, type: string) => void;
  showLoading: (show: boolean) => void;
  closeAllModals: () => void;
}
interface ActionInstances {
  timeline: { refresh?: () => void; unmount?: () => void } | null;
  metrics: { refresh?: () => void; unmount?: () => void } | null;
}

export function handleAction(action: string, dataset: Record<string, string>, container: HTMLElement, callbacks: ActionCallbacks, instances: ActionInstances) {
  const type = dataset.type;
  const id = dataset.id;
  const currentState = state.getState();
  const timelinePanelInstance = instances.timeline;
  const metricsDashboardInstance = instances.metrics;

  switch (action) {
    case 'refresh':
      callbacks.loadStats().then(() => callbacks.loadData()).then(() => { if (timelinePanelInstance && timelinePanelInstance.refresh) timelinePanelInstance.refresh(); if (metricsDashboardInstance && metricsDashboardInstance.refresh) metricsDashboardInstance.refresh(); callbacks.showToast('Dados atualizados!', 'success'); });
      break;
    case 'sync-all':
      callbacks.showLoading(true);
      callbacks.showToast('Sincronizando...', 'info');
      api.syncAll({ dryRun: false }).then(result => { if (result.success) { const t = result.data.totals; callbacks.showToast(`Sync: ${t.created} criados, ${t.updated} atualizados`, 'success'); return callbacks.loadStats().then(() => callbacks.loadData()); } }).catch(error => { callbacks.showToast(error.message, 'error'); }).finally(() => { callbacks.showLoading(false); });
      break;
    case 'add-new':
      crud.clearEditingItem();
      if (currentState.selectedTab === 'triggers') uiActions.showModal(container, ui.renderTriggerModal());
      else if (currentState.selectedTab === 'rules') uiActions.showModal(container, ui.renderRuleModal());
      else if (currentState.selectedTab === 'flags') uiActions.showModal(container, ui.renderFlagModal());
      break;
    case 'edit': handleEdit(type, id, currentState, container); break;
    case 'toggle': handleToggle(type, id, currentState, callbacks); break;
    case 'delete': handleDelete(type, id, currentState, container, callbacks); break;
    case 'close-modal': uiActions.closeAllModals(container); crud.clearEditingItem(); break;
    case 'load-audit': callbacks.loadAudit(); break;

    // @ts-expect-error TS migration - TS2554
    case 'open-simulator': uiActions.showModal(container, ui.renderSimulatorModal(currentState.triggers || [])); break;
    case 'simulate-trigger': runSimulation(container, callbacks, dataset.intent, dataset.trigger, false); break;
    case 'simulate-preview': handleSimulate(container, callbacks, false); break;
    case 'simulate-execute': handleSimulate(container, callbacks, true); break;
  }
}

type PomItem = Record<string, unknown>;
type PomState = Record<string, unknown>;

function handleEdit(type: string, id: string, currentState: PomState, container: HTMLElement) {
  if (type === 'trigger') { const triggerItem = (currentState.triggers as PomItem[] | undefined) ? (currentState.triggers as PomItem[]).find((t: PomItem) => t.id == id) : null; if (triggerItem) { crud.setEditingItem(triggerItem); uiActions.showModal(container, ui.renderTriggerModal(triggerItem)); } }
  else if (type === 'rule') { const ruleItem = (currentState.rules as PomItem[] | undefined) ? (currentState.rules as PomItem[]).find((r: PomItem) => r.id == id) : null; if (ruleItem) { crud.setEditingItem(ruleItem); uiActions.showModal(container, ui.renderRuleModal(ruleItem)); } }
  else if (type === 'flag') { const flagItem = (currentState.flags as PomItem[] | undefined) ? (currentState.flags as PomItem[]).find((f: PomItem) => f.id == id) : null; if (flagItem) { crud.setEditingItem(flagItem); uiActions.showModal(container, ui.renderFlagModal(flagItem)); } }
}

function handleToggle(type: string, id: string, currentState: PomState, callbacks: ActionCallbacks) {
  if (type === 'trigger') { const toggleTrigger = (currentState.triggers as PomItem[] | undefined) ? (currentState.triggers as PomItem[]).find((t: PomItem) => t.id == id) : null; if (toggleTrigger) crud.toggleTrigger(id, toggleTrigger.is_active as boolean | number, callbacks); }
  else if (type === 'rule') { const toggleRule = (currentState.rules as PomItem[] | undefined) ? (currentState.rules as PomItem[]).find((r: PomItem) => r.id == id) : null; if (toggleRule) crud.toggleRule(id, toggleRule.is_active as boolean | number, callbacks); }
  else if (type === 'flag') { const toggleFlag = (currentState.flags as PomItem[] | undefined) ? (currentState.flags as PomItem[]).find((f: PomItem) => f.id == id) : null; if (toggleFlag) crud.toggleFlag(id, toggleFlag.is_enabled as boolean | number, callbacks); }
}

function handleDelete(type: string, id: string, currentState: PomState, container: HTMLElement, callbacks: ActionCallbacks) {
  if (type === 'trigger') { const delTrigger = (currentState.triggers as PomItem[] | undefined) ? (currentState.triggers as PomItem[]).find((t: PomItem) => t.id == id) : null; if (delTrigger) { crud.setPendingDelete({ type, id, name: delTrigger.trigger_key }); uiActions.confirmDelete(container, delTrigger.trigger_key as string, () => crud.deleteTrigger(id, callbacks)); } }
  else if (type === 'rule') { const delRule = (currentState.rules as PomItem[] | undefined) ? (currentState.rules as PomItem[]).find((r: PomItem) => r.id == id) : null; if (delRule) { crud.setPendingDelete({ type, id, name: delRule.rule_key }); uiActions.confirmDelete(container, delRule.rule_key as string, () => crud.deleteRule(id, callbacks)); } }
  else if (type === 'flag') { const delFlag = (currentState.flags as PomItem[] | undefined) ? (currentState.flags as PomItem[]).find((f: PomItem) => f.id == id) : null; if (delFlag) { crud.setPendingDelete({ type, id, name: delFlag.flag_key }); uiActions.confirmDelete(container, delFlag.flag_key as string, () => crud.deleteFlag(id, callbacks)); } }
}

export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION, checks: { handleActionReady: typeof handleAction === 'function' } }; }

export default { handleAction, info, healthCheck };
