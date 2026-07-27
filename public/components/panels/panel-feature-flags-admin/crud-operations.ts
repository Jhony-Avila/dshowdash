// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.2.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-feature-flags-admin:crud-operations
// PURPOSE: Panel Feature Flags Admin - CRUD Operations
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   getPort from ./ports.js
//   getCreateFormHTML, getEditFormHTML, parseCreateForm, parseEditForm from ./mod...
//   AUTH_EVENTS, AUTH_INTENTS from /core/runtime/events/catalog/auth.events.js
//   PANEL_ID from ./core/constants.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   toggleFlag() — exported function
//   showCreateModal() — exported function
//   showEditModal() — exported function
//   deleteFlag() — exported function
//   info() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   AUTH_INTENTS.LOGIN
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (window as any).AuthAdapter
// ═══════════════════════════════════════════════════════════════
'use strict';

import { getPort } from './ports.js';
import { getCreateFormHTML, getEditFormHTML, parseCreateForm, parseEditForm } from './modals.js';
import { AUTH_EVENTS, AUTH_INTENTS } from '/core/runtime/events/catalog/auth.events.js';
import { PANEL_ID } from './core/constants.js';

export const VERSION = '9.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'panel-feature-flags-admin:crud-operations';

interface PanelContext {
  apiClient: {
    toggleFlag: (key: string, opts: Record<string, unknown>) => Promise<Record<string, unknown>>;
    createFlag: (data: Record<string, unknown>, opts: Record<string, unknown>) => Promise<Record<string, unknown>>;
    updateFlag: (key: string, data: Record<string, unknown>, opts: Record<string, unknown>) => Promise<Record<string, unknown>>;
    deleteFlag: (key: string, opts: Record<string, unknown>) => Promise<Record<string, unknown>>;
  };
  telemetry: {
    trackToggle: (key: string, state: unknown) => void;
    trackCreate: (key: string) => void;
    trackUpdate: (key: string) => void;
    trackDelete: (key: string) => void;
  };
  store: { getFlags: () => Record<string, unknown>[]; };
  dataLoader: { loadData: () => Promise<void>; };
  abortController: AbortController | null;
  [key: string]: unknown;
}

function _getAuth() { if (typeof window !== 'undefined') return (window as any).AuthAdapter || null; return null; }

let ModalAdapter: Record<string, unknown> | null = null;

function loadModalAdapter(): Promise<Record<string, unknown> | null> {
  if (ModalAdapter) return Promise.resolve(ModalAdapter);
  return import('/components/overlay-layer/adapters/modal-adapter.js').then((mod: Record<string, unknown>) => {
    ModalAdapter = mod;
    return ModalAdapter;
  }).catch((): null => null);
}

export function toggleFlag(panel: PanelContext, flagKey: string) {
  const auth = _getAuth();
  if (!auth || !auth.isAuthenticated || !auth.isAuthenticated()) {
    const eventBus = getPort('eventBus');
    if (eventBus && eventBus.emit) eventBus.emit(AUTH_INTENTS.LOGIN, { reason: 'toggle-flag', source: PANEL_ID });
    return Promise.resolve(false);
  }

  return panel.apiClient.toggleFlag(flagKey, { signal: panel.abortController ? panel.abortController.signal : undefined }).then((result: Record<string, unknown>) => {
    if (result.success) {
      panel.telemetry.trackToggle(flagKey, result.payload ? (result.payload as Record<string, unknown>).is_enabled : undefined);
      const toast = getPort('toast');
      if (toast && toast.show) toast.show(`Flag "${flagKey}" ${result.payload && (result.payload as Record<string, unknown>).is_enabled ? 'ativado' : 'desativado'}`, 'success');
      return panel.dataLoader.loadData().then(() => true);
    } else {
      const toast = getPort('toast');
      if (toast && toast.show) toast.show(`Erro: ${result.message}`, 'error');
      return false;
    }
  }).catch((e: Error) => {
    const toast = getPort('toast');
    if (toast && toast.show) toast.show(`Erro: ${e.message}`, 'error');
    return false;
  });
}

export function showCreateModal(panel: PanelContext) {
  return loadModalAdapter().then(modal => {
    if (!modal || !modal.showCustomModal) { alert('Modal não disponível'); return; }

    return (modal.showCustomModal as (opts: Record<string, unknown>) => Promise<unknown>)({
      id: 'pfa-create-modal', title: 'Criar Feature Flag', bodyHTML: getCreateFormHTML(),
      buttons: [{ id: 'cancel', text: 'Cancelar', variant: 'secondary', action: 'cancel' }, { id: 'create', text: 'Criar Flag', variant: 'primary', action: 'create' }],
      scope: PANEL_ID,
      onBeforeClose(action: string, modalEl: HTMLElement) {
        if (action === 'create') {
          const form = modalEl.querySelector('[data-form="create-flag"]') as HTMLFormElement | null;
          if (!form || !form.checkValidity()) { form?.reportValidity(); return Promise.resolve(false); }
          const data = parseCreateForm(form);
          return panel.apiClient.createFlag(data, { signal: panel.abortController ? panel.abortController.signal : undefined }).then((result: Record<string, unknown>) => {
            if (result.success) {
              panel.telemetry.trackCreate(data.flag_key);
              const toast = getPort('toast');
              if (toast && toast.show) toast.show('Flag criado com sucesso', 'success');
              return panel.dataLoader.loadData().then(() => true);
            } else {
              const toast = getPort('toast');
              if (toast && toast.show) toast.show(`Erro: ${result.message}`, 'error');
              return false;
            }
          });
        }
        return Promise.resolve(true);
      }
    });
  });
}

export function showEditModal(panel: PanelContext, flagKey: string) {
  let flag = null;
  const flags = panel.store.getFlags();
  for (let i = 0; i < flags.length; i++) {
    if (flags[i].flag_key === flagKey) { flag = flags[i]; break; }
  }
  if (!flag) return Promise.resolve();

  return loadModalAdapter().then(modal => {
    if (!modal || !modal.showCustomModal) { alert('Modal não disponível'); return; }

    return (modal.showCustomModal as (opts: Record<string, unknown>) => Promise<unknown>)({
      id: 'pfa-edit-modal', title: `Editar: ${flag.flag_name || flag.flag_key}`, bodyHTML: getEditFormHTML(flag),
      buttons: [{ id: 'cancel', text: 'Cancelar', variant: 'secondary', action: 'cancel' }, { id: 'save', text: 'Salvar', variant: 'primary', action: 'save' }],
      scope: PANEL_ID,
      onBeforeClose(action: string, modalEl: HTMLElement) {
        if (action === 'save') {
          const form = modalEl.querySelector('[data-form="edit-flag"]') as HTMLFormElement | null;
          if (!form || !form.checkValidity()) { form?.reportValidity(); return Promise.resolve(false); }
          const data = parseEditForm(form);
          return panel.apiClient.updateFlag(flagKey, data, { signal: panel.abortController ? panel.abortController.signal : undefined }).then((result: Record<string, unknown>) => {
            if (result.success) {
              panel.telemetry.trackUpdate(flagKey);
              const toast = getPort('toast');
              if (toast && toast.show) toast.show('Flag atualizado com sucesso', 'success');
              return panel.dataLoader.loadData().then(() => true);
            } else {
              const toast = getPort('toast');
              if (toast && toast.show) toast.show(`Erro: ${result.message}`, 'error');
              return false;
            }
          });
        }
        return Promise.resolve(true);
      }
    });
  });
}

export function deleteFlag(panel: PanelContext, flagKey: string) {
  const auth = _getAuth();
  if (!auth || !auth.isAuthenticated || !auth.isAuthenticated()) {
    const eventBus = getPort('eventBus');
    if (eventBus && eventBus.emit) eventBus.emit(AUTH_INTENTS.LOGIN, { reason: 'delete-flag', source: PANEL_ID });
    return Promise.resolve(false);
  }

  return loadModalAdapter().then(modal => {
    let confirmPromise;
    if (modal && modal.showConfirmModal) {
      confirmPromise = (modal.showConfirmModal as (opts: Record<string, unknown>) => Promise<boolean>)({ id: 'pfa-delete-confirm', title: 'Confirmar Exclusão', message: `Remover flag "${flagKey}"? Esta ação não pode ser desfeita.`, confirmText: 'Remover', cancelText: 'Cancelar', danger: true, icon: 'warning', scope: PANEL_ID });
    } else {
      confirmPromise = Promise.resolve(confirm(`Remover flag "${flagKey}"?`));
    }
    return confirmPromise;
  }).then(confirmed => {
    if (!confirmed) return false;
    return panel.apiClient.deleteFlag(flagKey, { signal: panel.abortController ? panel.abortController.signal : undefined }).then((result: Record<string, unknown>) => {
      if (result.success) {
        panel.telemetry.trackDelete(flagKey);
        const toast = getPort('toast');
        if (toast && toast.show) toast.show('Flag removido com sucesso', 'success');
        return panel.dataLoader.loadData().then(() => true);
      } else {
        const toast = getPort('toast');
        if (toast && toast.show) toast.show(`Erro: ${result.message}`, 'error');
        return false;
      }
    }).catch((e: Error) => {
      const toast = getPort('toast');
      if (toast && toast.show) toast.show(`Erro: ${e.message}`, 'error');
      return false;
    });
  });
}

export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export default { toggleFlag, showCreateModal, showEditModal, deleteFlag };
