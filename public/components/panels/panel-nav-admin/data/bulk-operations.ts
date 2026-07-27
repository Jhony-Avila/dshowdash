// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (10.1.0-MIGRATION-PHASE2)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-nav-admin.data.bulk-operations
// PURPOSE: Bulk Operations — Ações em massa sobre itens de navegação
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createPanelPorts from /core/runtime/ports-profiles.js
//
// PROVIDES:
//   VERSION, MODULE_ID
//   injectPorts(), getPorts()
//   BulkOperations — exported class
//   createBulkOperations() — factory function
//   info(), healthCheck()
//
// @origin Adapted from panel-01/ui/table/bulk-edit.js for nav-admin domain
// @changelog
//   10.1.0-MIGRATION-PHASE2: Initial creation — FASE 2 C.8
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createPanelPorts } from '/core/runtime/ports-profiles.js';

export const VERSION = '12.1.0-TITLE-UX-ENHANCE';
export const MODULE_ID = 'panel-nav-admin.data.bulk-operations';

const Ports = createPanelPorts({ moduleId: MODULE_ID });
function _getPort(name: string) { return Ports.get(name); }
export function injectPorts(p: unknown) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

const _log = (level: string, ...args: unknown[]) => {
  const logger = _getPort('logger');
  if (!logger) return;
  const prefix = '[BulkOperations]';
  if (level === 'error') logger.error?.(prefix, ...args);
  else if (level === 'warn') logger.warn?.(prefix, ...args);
  else if (level === 'debug') logger.debug?.(prefix, ...args);
  else logger.info?.(prefix, ...args);
};

/**
 * Available bulk operation types for nav-admin.
 * @readonly
 */
export const BULK_ACTIONS = Object.freeze({
  MOVE_SECTION:     'moveSection',
  SET_PERMISSION:   'setPermission',
  TOGGLE_ACTIVE:    'toggleActive',
  TOGGLE_VISIBLE:   'toggleVisible',
  DELETE:           'delete',
  SET_CONTEXT:      'setContext',
  SET_ICON:         'setIcon',
  SET_DISPLAY_TITLE: 'setDisplayTitle'
});

/**
 * BulkOperations — Executa ações em massa com progresso e rollback.
 */
export class BulkOperations {
  [key: string]: any;
  /**
   * @param {Object} deps
   * @param {Object} deps.navAdapter — Nav adapter for API calls
   * @param {Object} deps.store — State store
   * @param {Function} [deps.showToast] — Toast notification callback
   * @param {Function} [deps.loadData] — Reload data callback
   */
  constructor(deps: Record<string, unknown> = {}) {
    this.navAdapter = deps.navAdapter || null;
    this.store = deps.store || null;
    this.showToast = deps.showToast || (() => {});
    this.loadData = deps.loadData || (() => Promise.resolve());

    this._selectedIds = new Set();
    this._inProgress = false;
    this._stats = { totalOperations: 0, successful: 0, failed: 0 };
  }

  /**
   * Set the current selection.
   * @param {string[]|Set<string>} ids
   */
  setSelection(ids: string[] | Set<string>) {
    this._selectedIds = ids instanceof Set ? ids : new Set(ids || []);
  }

  /** @returns {string[]} Currently selected item IDs */
  getSelection() { return Array.from(this._selectedIds); }

  /** @returns {number} Number of selected items */
  getSelectionCount() { return this._selectedIds.size; }

  /** Clear the selection */
  clearSelection() { this._selectedIds.clear(); }

  /** @returns {boolean} Whether a bulk operation is in progress */
  isInProgress() { return this._inProgress; }

  /**
   * Execute a bulk action on all selected items.
   * @param {string} action — One of BULK_ACTIONS values
   * @param {Object} [params] — Action-specific parameters
   * @param {Function} [onProgress] — Called with (completed, total) during execution
   * @returns {Promise<{ success: number, failed: number, errors: Array }>}
   */
  async execute(action: string, params: Record<string, unknown> = {}, onProgress?: (completed: number, total: number) => void) {
    const ids = this.getSelection();
    if (ids.length === 0) {
      this.showToast('Nenhum item selecionado', 'warning');
      return { success: 0, failed: 0, errors: [] };
    }

    if (this._inProgress) {
      this.showToast('Operação em andamento, aguarde', 'warning');
      return { success: 0, failed: 0, errors: [] };
    }

    this._inProgress = true;
    const items = this._getSelectedItems();
    let success = 0;
    let failed = 0;
    const errors = [];

    _log('info', `Bulk ${action} on ${items.length} items`);

    for (let i = 0; i < items.length; i++) {
      try {
        await this._executeOne(action, items[i], params);
        success++;
      } catch (error) {
        failed++;
        errors.push({ itemId: (items[i] as Record<string, unknown>).id, error: (error as Error).message });
        _log('error', `Failed on item ${(items[i] as Record<string, unknown>).id}:`, (error as Error).message);
      }

      if (onProgress) onProgress(i + 1, items.length);
    }

    this._inProgress = false;
    this._stats.totalOperations++;
    this._stats.successful += success;
    this._stats.failed += failed;

    const actionLabels = {
      [BULK_ACTIONS.MOVE_SECTION]: 'movidos',
      [BULK_ACTIONS.SET_PERMISSION]: 'atualizados',
      [BULK_ACTIONS.TOGGLE_ACTIVE]: 'alternados',
      [BULK_ACTIONS.TOGGLE_VISIBLE]: 'alternados',
      [BULK_ACTIONS.DELETE]: 'excluídos',
      [BULK_ACTIONS.SET_CONTEXT]: 'atualizados',
      [BULK_ACTIONS.SET_ICON]: 'atualizados',
      [BULK_ACTIONS.SET_DISPLAY_TITLE]: 'atualizados'
    };
    const label = (actionLabels as Record<string, string>)[action] || 'processados';

    if (failed === 0) {
      this.showToast(`${success} itens ${label} com sucesso`, 'success');
    } else {
      this.showToast(`${success} ${label}, ${failed} falharam`, 'warning');
    }

    await this.loadData();
    return { success, failed, errors };
  }

  /**
   * @private Execute a single action on one item.
   */
  async _executeOne(action: string, item: Record<string, unknown>, params: Record<string, unknown>) {
    if (!this.navAdapter) throw new Error('navAdapter not available');

    switch (action) {
      case BULK_ACTIONS.MOVE_SECTION:
        return this.navAdapter.updateItem(item.id, {
          ...item, section: params.section
        });

      case BULK_ACTIONS.SET_PERMISSION:
        return this.navAdapter.updateItem(item.id, {
          ...item, minLevel: params.minLevel
        });

      case BULK_ACTIONS.TOGGLE_ACTIVE:
        return this.navAdapter.updateItem(item.id, {
          ...item, isActive: !item.isActive
        });

      case BULK_ACTIONS.TOGGLE_VISIBLE:
        return this.navAdapter.updateItem(item.id, {
          ...item, isVisible: !item.isVisible
        });

      case BULK_ACTIONS.DELETE:
        return this.navAdapter.deleteItem(item.id, item.sourceTable, item.sourceId);

      case BULK_ACTIONS.SET_CONTEXT:
        return this.navAdapter.updateItem(item.id, {
          ...item, section: params.context
        });

      case BULK_ACTIONS.SET_ICON:
        return this.navAdapter.updateItem(item.id, {
          ...item, icon: params.icon
        });

      case BULK_ACTIONS.SET_DISPLAY_TITLE:
        return this.navAdapter.updateItem(item.id, {
          sourceTable: item.sourceTable, sourceId: item.sourceId,
          displayTitle: params.displayTitle || ''
        });

      default:
        throw new Error(`Unknown bulk action: ${action}`);
    }
  }

  /**
   * @private Get full item objects for selected IDs from store.
   * @returns {Array<Object>}
   */
  _getSelectedItems() {
    if (!this.store) return [];
    const items = this.store.get('items') || [];
    return items.filter((item: Record<string, unknown>) => this._selectedIds.has(item.id as string));
  }

  /** @returns {Object} Cumulative stats */
  getStats() { return { ...this._stats, currentSelection: this._selectedIds.size }; }
}

/**
 * Factory to create a BulkOperations instance.
 * @param {Object} deps
 * @returns {BulkOperations}
 */
export function createBulkOperations(deps: Record<string, unknown> = {}) {
  return new BulkOperations(deps);
}

export function info() {
  return { moduleId: MODULE_ID, version: VERSION, actions: Object.keys(BULK_ACTIONS), portsInitialized: Ports.isInitialized() };
}

export function healthCheck() {
  return { status: Ports.isInitialized() ? 'HEALTHY' : 'DEGRADED', moduleId: MODULE_ID, version: VERSION };
}

export default { BULK_ACTIONS, BulkOperations, createBulkOperations, info, healthCheck, injectPorts, getPorts, VERSION, MODULE_ID };
