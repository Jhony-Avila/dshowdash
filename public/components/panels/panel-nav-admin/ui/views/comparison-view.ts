// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (10.5.0-MIGRATION-PHASE9)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-nav-admin.ui.views.comparison-view
// PURPOSE: Data Comparison View — Diff visual entre configurações
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createPanelPorts from /core/runtime/ports-profiles.js
//   escapeHtml from ../../security/escape-html.js
//
// PROVIDES:
//   VERSION, MODULE_ID
//   ComparisonView — Factory function
//   diffItems() — Compare two item sets
//   info(), healthCheck()
//
// @origin Adapted from panel-01 data comparison for nav-admin domain
// @changelog
//   10.5.0-MIGRATION-PHASE9: Initial creation — FASE 9 K.4
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createPanelPorts } from '/core/runtime/ports-profiles.js';
import { escapeHtml } from '../../security/escape-html.js';

export const VERSION = '10.5.0-MIGRATION-PHASE9';
export const MODULE_ID = 'panel-nav-admin.ui.views.comparison-view';

const Ports = createPanelPorts({ moduleId: MODULE_ID });
export function injectPorts(p: unknown) { return Ports.inject(p); }

const _log = (level: string, ...args: unknown[]) => {
  const logger = Ports.get('logger');
  if (!logger) return;
  const prefix = '[ComparisonView]';
  if (level === 'error') logger.error?.(prefix, ...args);
  else logger.info?.(prefix, ...args);
};

/**
 * CSS classes for comparison view.
 * @private
 */
const CSS = {
  container: 'pna-comparison-container',
  header: 'pna-comparison-header',
  table: 'pna-comparison-table',
  rowAdded: 'pna-comparison-added',
  rowRemoved: 'pna-comparison-removed',
  rowModified: 'pna-comparison-modified',
  rowUnchanged: 'pna-comparison-unchanged',
  cellChanged: 'pna-comparison-cell-changed',
  legend: 'pna-comparison-legend',
  stats: 'pna-comparison-stats'
};

/**
 * Compare two sets of items and produce a diff.
 *
 * @param {Array<Object>} currentItems — Current configuration
 * @param {Array<Object>} previousItems — Saved/exported configuration
 * @param {Object} [options]
 * @param {string} [options.idField='id'] — Field used as unique identifier
 * @param {Array<string>} [options.compareFields] — Fields to compare (defaults to all)
 * @returns {{ added: Array, removed: Array, modified: Array, unchanged: Array, summary: Object }}
 */
export function diffItems(currentItems: Record<string, unknown>[], previousItems: Record<string, unknown>[], options: Record<string, unknown> = {}) {
  const idField = (options.idField as string) || 'id';
  const compareFields = options.compareFields as string[] | undefined;

  const prevMap = new Map();
  for (const item of (previousItems || [])) {
    if (item[idField]) prevMap.set(item[idField], item);
  }

  const currMap = new Map();
  for (const item of (currentItems || [])) {
    if (item[idField]) currMap.set(item[idField], item);
  }

  const added = [];
  const removed = [];
  const modified = [];
  const unchanged = [];

  // Items in current but not in previous → added
  // Items in both → check for modifications
  for (const [id, currItem] of currMap) {
    if (!prevMap.has(id)) {
      added.push({ item: currItem, type: 'added' });
    } else {
      const prevItem = prevMap.get(id);
      const changes = _getChanges(currItem, prevItem, compareFields);
      if (changes.length > 0) {
        modified.push({ item: currItem, previous: prevItem, changes, type: 'modified' });
      } else {
        unchanged.push({ item: currItem, type: 'unchanged' });
      }
    }
  }

  // Items in previous but not in current → removed
  for (const [id, prevItem] of prevMap) {
    if (!currMap.has(id)) {
      removed.push({ item: prevItem, type: 'removed' });
    }
  }

  return {
    added,
    removed,
    modified,
    unchanged,
    summary: {
      totalCurrent: currentItems?.length || 0,
      totalPrevious: previousItems?.length || 0,
      addedCount: added.length,
      removedCount: removed.length,
      modifiedCount: modified.length,
      unchangedCount: unchanged.length
    }
  };
}

/**
 * Get field-level changes between two items.
 * @private
 */
function _getChanges(current: Record<string, unknown>, previous: Record<string, unknown>, fields: string[] | undefined) {
  const allFields: string[] = fields || [...new Set([...Object.keys(current), ...Object.keys(previous)])];
  const changes = [];

  for (const field of allFields) {
    if (field === 'updatedAt' || field === 'createdAt') continue;

    const curVal = current[field];
    const prevVal = previous[field];

    if (JSON.stringify(curVal) !== JSON.stringify(prevVal)) {
      changes.push({ field, current: curVal, previous: prevVal });
    }
  }

  return changes;
}

/**
 * Factory: creates a ComparisonView renderer.
 *
 * @param {HTMLElement} container — Mount point
 * @param {Object} [options]
 * @param {Array<string>} [options.displayFields] — Fields to display in table
 * @returns {Object} ComparisonView instance
 */
export function ComparisonView(container: HTMLElement, options: Record<string, unknown> = {}) {
  const displayFields = (options.displayFields as string[]) || ['label', 'href', 'icon', 'section', 'context', 'minLevel', 'isActive', 'order'];

  let _currentDiff: Record<string, unknown> | null = null;

  /**
   * Render the comparison between two item sets.
   *
   * @param {Array<Object>} currentItems
   * @param {Array<Object>} previousItems
   * @param {Object} [diffOptions]
   */
  function render(currentItems: Record<string, unknown>[], previousItems: Record<string, unknown>[], diffOptions: Record<string, unknown> = {}) {
    if (!container) return;

    const diff = diffItems(currentItems, previousItems, diffOptions);
    _currentDiff = diff;

    const { added, removed, modified, unchanged, summary } = diff;

    container.innerHTML = `
      <div class="${CSS.container}">
        <div class="${CSS.header}">
          <h3>Comparação de Configuração</h3>
          <div class="${CSS.stats}">
            <span style="color:var(--color-success, #4caf50)">+${summary.addedCount} adicionados</span>
            <span style="color:var(--color-error, #f44336)">-${summary.removedCount} removidos</span>
            <span style="color:var(--color-warning, #ff9800)">${summary.modifiedCount} modificados</span>
            <span style="opacity:0.6">${summary.unchangedCount} inalterados</span>
          </div>
        </div>
        <div class="${CSS.legend}">
          <span class="${CSS.rowAdded}">Adicionado</span>
          <span class="${CSS.rowRemoved}">Removido</span>
          <span class="${CSS.rowModified}">Modificado</span>
        </div>
        <table class="${CSS.table}">
          <thead>
            <tr>
              <th>Status</th>
              ${displayFields.map(f => `<th>${escapeHtml(f)}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${(added as { item: Record<string, unknown> }[]).map(({ item }) => _renderRow(item, 'added', displayFields)).join('')}
            ${(modified as { item: Record<string, unknown>; changes: { field: string; current: unknown; previous: unknown }[] }[]).map(({ item, changes }) => _renderModifiedRow(item, changes, displayFields)).join('')}
            ${(removed as { item: Record<string, unknown> }[]).map(({ item }) => _renderRow(item, 'removed', displayFields)).join('')}
          </tbody>
        </table>
      </div>
    `;

    _log('info', `Comparison rendered: +${summary.addedCount} -${summary.removedCount} ~${summary.modifiedCount}`);
  }

  /** @private */
  function _renderRow(item: Record<string, unknown>, type: string, fields: string[]) {
    const cssClass = type === 'added' ? CSS.rowAdded : CSS.rowRemoved;
    const label = type === 'added' ? '+' : '-';
    return `
      <tr class="${cssClass}">
        <td>${label}</td>
        ${fields.map(f => `<td>${escapeHtml(String(item[f] ?? ''))}</td>`).join('')}
      </tr>
    `;
  }

  /** @private */
  function _renderModifiedRow(item: Record<string, unknown>, changes: { field: string; current: unknown; previous: unknown }[], fields: string[]) {
    const changedFields = new Set(changes.map((c: { field: string }) => c.field));
    return `
      <tr class="${CSS.rowModified}">
        <td>~</td>
        ${fields.map(f => {
          const changed = changedFields.has(f);
          const cls = changed ? CSS.cellChanged : '';
          const val = escapeHtml(String(item[f] ?? ''));
          const prevChange = changes.find((c: { field: string; previous: unknown }) => c.field === f);
          const title = prevChange ? `Anterior: ${String(prevChange.previous ?? '')}` : '';
          return `<td class="${cls}" title="${escapeHtml(title)}">${val}</td>`;
        }).join('')}
      </tr>
    `;
  }

  /**
   * Get current diff result.
   * @returns {Object|null}
   */
  function getDiff() {
    return _currentDiff;
  }

  /**
   * Clear the view.
   */
  function clear() {
    if (container) container.innerHTML = '';
    _currentDiff = null;
  }

  return { render, getDiff, clear };
}

export function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}

export function healthCheck() {
  return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION };
}

export default { ComparisonView, diffItems, injectPorts, info, healthCheck, VERSION, MODULE_ID };
