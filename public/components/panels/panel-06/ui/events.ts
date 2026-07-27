// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (9.4.0-LIFECYCLE-CLEANUP)
// ═══════════════════════════════════════════════════════════════
// MODULE: panels-panel-06-ui-events
// PURPOSE: Panel-06 Settings - Events Module
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   logger from ../state/state.js
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
//   'change'
//   'input'
//   'blur'
// WINDOW ACCESS:
//   (none)
// @changelog v9.4.0-LIFECYCLE-CLEANUP: AbortController cleanup + teardownEventHandlers() (BRF PARTE 3 compliance)
// @changelog v9.3.0-P2-ENTERPRISE: Enterprise P2 compliance
// ═══════════════════════════════════════════════════════════════
'use strict';

import { logger } from '../state/state.js';

export const MODULE_ID = 'panels-panel-06-ui-events';
export const VERSION = '9.3.0-P2-ENTERPRISE';

let _abortController: AbortController | null = null;
let _listenerCount = 0;

export function setupEventHandlers(container: HTMLElement, state: Record<string, unknown>, handlers: Record<string, (...args: unknown[]) => unknown>) {
  // Cleanup previous if any (idempotent re-bind)
  teardownEventHandlers();

  _abortController = new AbortController();
  const signal = _abortController.signal;
  _listenerCount = 0;

  container.querySelectorAll('[data-category]').forEach((btn: Element) => {
    btn.addEventListener('click', () => {
      state.activeCategory = (btn as HTMLElement).dataset.category;
      state.searchTerm = '';
      handlers.render();
      logger.info('Category changed:', { category: state.activeCategory });
    }, { signal });
    _listenerCount++;
  });

  const searchInput = container.querySelector('[data-input="search"]');
  if (searchInput) {
    searchInput.addEventListener('input', (e: Event) => {
      state.searchTerm = (e.target as HTMLInputElement).value;
      handlers.render();
    }, { signal });
    _listenerCount++;
  }

  const clearSearchBtn = container.querySelector('[data-action="clear-search"]');
  if (clearSearchBtn) {
    clearSearchBtn.addEventListener('click', () => {
      state.searchTerm = '';
      handlers.render();
    }, { signal });
    _listenerCount++;
  }

  container.querySelectorAll('[data-setting]').forEach((input: Element) => {
    const inputEl = input as HTMLInputElement;
    const key = inputEl.dataset.setting;
    const type = inputEl.dataset.type;
    const handleChange = () => {
      let value: unknown;
      if (type === 'boolean') { value = inputEl.checked; }
      else if (type === 'number') { value = parseInt(inputEl.value, 10); }
      else if (type === 'json') { try { value = JSON.parse(inputEl.value); } catch (e) { logger.warn('Invalid JSON for ' + key); return; } }
      else { value = inputEl.value; }
      (state.changes as Record<string, unknown>)[key as string] = value;
      handlers.render();
      logger.info('Setting changed: ' + key);
    };
    inputEl.addEventListener('change', handleChange, { signal });
    _listenerCount++;
    if (inputEl.type !== 'checkbox') {
      inputEl.addEventListener('blur', handleChange, { signal });
      _listenerCount++;
    }
  });

  const saveBtn = container.querySelector('[data-action="save-all"]');
  if (saveBtn) {
    saveBtn.addEventListener('click', async () => {
      // @ts-expect-error strict migration — TS2769
      if (Object.keys(state.changes).length === 0) return;
      await handlers.saveAll();
    }, { signal });
    _listenerCount++;
  }

  const discardBtn = container.querySelector('[data-action="discard"]');
  if (discardBtn) {
    discardBtn.addEventListener('click', () => {
      state.changes = {};
      handlers.render();
      logger.info('Changes discarded');
    }, { signal });
    _listenerCount++;
  }
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
