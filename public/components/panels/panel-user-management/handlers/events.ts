// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (9.4.0-LIFECYCLE-CLEANUP)
// ═══════════════════════════════════════════════════════════════
// MODULE: panels-panel-user-management-handlers-events
// PURPOSE: Panel module
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   state from ../state/store.js
//   ui from ../ui/renderer.js
//   tracker from ../telemetry/tracker.js
//
// PROVIDES:
//   setupEventHandlers() — exported function
//   teardownEventHandlers() — exported function
//   MODULE_ID — module constant
//   VERSION — module constant
//   info() — exported function
//   healthCheck() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   'click'
//   'keydown'
//   'submit'
// WINDOW ACCESS:
//   (none)
// @changelog v9.4.0-LIFECYCLE-CLEANUP: AbortController cleanup + teardownEventHandlers() (BRF PARTE 3 compliance)
// @changelog v9.3.0-P2-ENTERPRISE: Enterprise P2 compliance
// ═══════════════════════════════════════════════════════════════
'use strict';
// Panel User Management - Event Handlers
// v5.0.0: Modal unificado (open-modal action)

import { state } from '../state/store.js';

// @ts-expect-error TS migration - TS2614
import { ui } from '../ui/renderer.js';
import { tracker } from '../telemetry/tracker.js';
import * as crud from './crud.js';

export const MODULE_ID = 'panels-panel-user-management-handlers-events';
export const VERSION = '9.3.0-P2-ENTERPRISE';

let _abortController: AbortController | null = null;
let _listenerCount = 0;

export function setupEventHandlers(container: HTMLElement) {
  if (!container) return;

  // Cleanup previous if any (idempotent re-bind)
  teardownEventHandlers();

  _abortController = new AbortController();
  const signal = _abortController.signal;
  _listenerCount = 0;

  // Search button
  const searchBtn = container.querySelector('[data-action="search"]');
  if (searchBtn) {
    searchBtn.addEventListener('click', () => {
      const filters = ui.getSearchFilters();
      tracker.trackFilterChanged(filters);
      crud.searchUsers(filters);
    }, { signal });
    _listenerCount++;
  }

  // Enter key on search input
  const searchInput = container.querySelector('[data-field="search"]');
  if (searchInput) {
    // @ts-expect-error strict migration — TS2769
    searchInput.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        const filters = ui.getSearchFilters();
        tracker.trackFilterChanged(filters);
        crud.searchUsers(filters);
      }
    }, { signal });
    _listenerCount++;
  }

  // Refresh button
  const refreshBtn = container.querySelector('[data-action="refresh"]');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', () => {
      crud.loadData();
    }, { signal });
    _listenerCount++;
  }

  // Delegated click events
  container.addEventListener('click', async (e: MouseEvent) => {
    const actionEl = (e.target as HTMLElement).closest('[data-action]');
    if (!actionEl) return;

    const action = (actionEl as HTMLElement).dataset.action;
    const userIdEl = (e.target as HTMLElement).closest('[data-user-id]');
    const userId = (userIdEl as HTMLElement)?.dataset?.userId;

    switch (action) {
      // NOVA ACTION: abre modal unificado
      case 'open-modal':
        if (userId) {
          await crud.viewUser(userId);
        }
        break;

      case 'reset-password':
        if (userId && confirm('Confirma reset de senha para este usu\u00e1rio?')) {
          await crud.resetPassword(userId);
        }
        break;

      case 'activate':
        if (userId) {
          await crud.updateUserStatus(userId, 'active');
        }
        break;

      case 'deactivate':
        if (userId && confirm('Confirma desativa\u00e7\u00e3o deste usu\u00e1rio?')) {
          await crud.updateUserStatus(userId, 'disabled');
        }
        break;

      case 'close-modal':
        ui.hideUserDetails();
        state.setSelectedUser(null);
        break;

      case 'clear-filters':
        const searchEl = container.querySelector('[data-field="search"]') as HTMLInputElement | null;
        const statusSelect = container.querySelector('[data-field="status"]') as HTMLSelectElement | null;
        const roleSelect = container.querySelector('[data-field="role"]') as HTMLSelectElement | null;
        if (searchEl) searchEl.value = '';
        if (statusSelect) statusSelect.value = '';
        if (roleSelect) roleSelect.value = '';
        crud.loadData();
        break;
    }
  }, { signal });
  _listenerCount++;

  // Delegated form submit
  container.addEventListener('submit', async (e: Event) => {
    const form = (e.target as HTMLElement).closest('[data-form="edit-user"]');
    if (!form) return;

    e.preventDefault();

    const formData = ui.getFormData(form);
    const userId = formData.id || state.getSelectedUser()?.id;

    if (userId) {
      await crud.editUser(userId, formData);
    }
  }, { signal });
  _listenerCount++;
}

export function teardownEventHandlers() {
  if (_abortController) {
    _abortController.abort();
    _abortController = null;
    _listenerCount = 0;
  }
}

export function info() { return { moduleId: MODULE_ID, version: VERSION, listenersBound: _listenerCount, hasAbortController: _abortController !== null }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION, checks: { eventsReady: true, cleanupAvailable: typeof teardownEventHandlers === 'function', listenersTracked: _abortController !== null || _listenerCount === 0 } }; }
