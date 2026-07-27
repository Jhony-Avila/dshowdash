// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (10.2.0-MIGRATION-PHASE6)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-nav-admin.ui.modals.import-preview
// PURPOSE: Import Preview Modal — Preview visual ao importar configuração
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createPanelPorts from /core/runtime/ports-profiles.js
//   escapeHtml from ../../security/escape-html.js
//   isEnabled from ../../config/feature-flags.js
//
// PROVIDES:
//   VERSION, MODULE_ID
//   ImportPreviewModal — Factory function
//   info(), healthCheck()
//
// @origin Adapted from panel-01 import preview for nav-admin domain
// @changelog
//   10.2.0-MIGRATION-PHASE6: Initial creation — FASE 6 K.6
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createPanelPorts } from '/core/runtime/ports-profiles.js';
import { escapeHtml } from '../../security/escape-html.js';
import { isEnabled } from '../../config/feature-flags.js';

export const VERSION = '10.2.0-MIGRATION-PHASE6';
export const MODULE_ID = 'panel-nav-admin.ui.modals.import-preview';

const Ports = createPanelPorts({ moduleId: MODULE_ID });
export function injectPorts(p: unknown) { return Ports.inject(p); }

const _log = (level: string, ...args: unknown[]) => {
  const logger = Ports.get('logger');
  if (!logger) return;
  const prefix = '[ImportPreviewModal]';
  if (level === 'error') logger.error?.(prefix, ...args);
  else if (level === 'debug') logger.debug?.(prefix, ...args);
  else logger.info?.(prefix, ...args);
};

/**
 * CSS classes for the import preview modal.
 * @private
 */
const CSS = {
  overlay: 'pna-import-preview-overlay',
  modal: 'pna-import-preview-modal',
  header: 'pna-import-preview-header',
  body: 'pna-import-preview-body',
  footer: 'pna-import-preview-footer',
  table: 'pna-import-preview-table',
  rowValid: 'pna-import-row-valid',
  rowInvalid: 'pna-import-row-invalid',
  rowNew: 'pna-import-row-new',
  rowUpdate: 'pna-import-row-update',
  badge: 'pna-import-badge',
  stats: 'pna-import-stats',
  close: 'pna-import-close'
};

/**
 * Factory: creates an ImportPreviewModal instance.
 * Shows a visual diff of items to be imported before confirming.
 *
 * @param {Object} [options]
 * @param {Function} [options.onConfirm] — Called with validRows when user confirms
 * @param {Function} [options.onCancel] — Called when user cancels
 * @param {HTMLElement} [options.container] — Mount point (defaults to document.body)
 * @returns {Object} ImportPreviewModal instance
 */
export function ImportPreviewModal(options: Record<string, unknown> = {}) {
  const onConfirm = (options.onConfirm as ((rows: Record<string, unknown>[]) => void)) || (() => {});
  const onCancel = (options.onCancel as (() => void)) || (() => {});
  const container = (options.container as HTMLElement) || document.body;

  let _overlayEl: HTMLElement | null = null;
  let _isOpen = false;
  let _currentData: Record<string, unknown> | null = null;

  /**
   * Open the preview modal with parsed import data.
   *
   * @param {Object} data
   * @param {Array<Object>} data.validRows — Rows that passed validation
   * @param {Array<{row: Object, index: number, errors: Array<string>}>} data.invalidRows — Rows with errors
   * @param {Array<string>} data.headers — Column headers
   * @param {string} data.format — Source format (csv, xlsx, json)
   * @param {Array<Object>} [data.existingItems] — Current items for diff comparison
   */
  function open(data: Record<string, unknown>) {
    if (_isOpen) close();
    _currentData = data;
    _isOpen = true;

    const validRows = (data.validRows as Record<string, unknown>[]) || [];
    const invalidRows = (data.invalidRows as { row: Record<string, unknown>; index: number; errors: string[] }[]) || [];
    const headers = (data.headers as string[]) || [];
    const format = (data.format as string) || 'unknown';
    const existingItems = (data.existingItems as Record<string, unknown>[]) || [];

    // Classify rows: new vs update
    const existingIds = new Set(existingItems.map((item: Record<string, unknown>) => item.id).filter(Boolean));
    const classified = validRows.map((row: Record<string, unknown>) => ({
      row,
      type: row.id && existingIds.has(row.id) ? 'update' : 'new'
    }));

    const newCount = classified.filter((c: { type: string }) => c.type === 'new').length;
    const updateCount = classified.filter((c: { type: string }) => c.type === 'update').length;

    _overlayEl = document.createElement('div');
    _overlayEl.className = CSS.overlay;
    _overlayEl.setAttribute('role', 'dialog');
    _overlayEl.setAttribute('aria-modal', 'true');
    _overlayEl.setAttribute('aria-label', 'Preview de importação');

    const displayHeaders = headers.length > 0 ? headers.slice(0, 8) : ['label', 'href', 'icon', 'section', 'context'];

    _overlayEl.innerHTML = `
      <div class="${CSS.modal}">
        <div class="${CSS.header}">
          <h3>Preview de Importação (${escapeHtml(format.toUpperCase())})</h3>
          <button class="${CSS.close}" aria-label="Fechar" data-action="close">&times;</button>
        </div>
        <div class="${CSS.stats}">
          <span class="${CSS.badge}" style="--badge-color: var(--color-success, #4caf50)">
            ${newCount} novo${newCount !== 1 ? 's' : ''}
          </span>
          <span class="${CSS.badge}" style="--badge-color: var(--color-info, #2196f3)">
            ${updateCount} atualização${updateCount !== 1 ? 'ões' : ''}
          </span>
          ${invalidRows.length > 0 ? `
          <span class="${CSS.badge}" style="--badge-color: var(--color-error, #f44336)">
            ${invalidRows.length} com erro${invalidRows.length !== 1 ? 's' : ''}
          </span>` : ''}
          <span style="margin-left:auto;opacity:0.7">Total: ${validRows.length + invalidRows.length} linhas</span>
        </div>
        <div class="${CSS.body}">
          <table class="${CSS.table}">
            <thead>
              <tr>
                <th>Status</th>
                ${displayHeaders.map((h: string) => `<th>${escapeHtml(h)}</th>`).join('')}
              </tr>
            </thead>
            <tbody>
              ${classified.map(({ row, type }: { row: Record<string, unknown>; type: string }) => `
                <tr class="${type === 'new' ? CSS.rowNew : CSS.rowUpdate}">
                  <td><span class="${CSS.badge}" style="--badge-color: ${type === 'new' ? 'var(--color-success, #4caf50)' : 'var(--color-info, #2196f3)'}">${type === 'new' ? 'Novo' : 'Atualizar'}</span></td>
                  ${displayHeaders.map((h: string) => {
                    const field = h.toLowerCase();
                    const val = row[field] ?? row[h] ?? '';
                    return `<td>${escapeHtml(String(val))}</td>`;
                  }).join('')}
                </tr>
              `).join('')}
              ${invalidRows.map(({ row, index, errors }: { row: Record<string, unknown>; index: number; errors: string[] }) => `
                <tr class="${CSS.rowInvalid}">
                  <td><span class="${CSS.badge}" style="--badge-color: var(--color-error, #f44336)">Erro (L${index})</span></td>
                  ${displayHeaders.map((h: string) => {
                    const field = h.toLowerCase();
                    const val = row[field] ?? row[h] ?? '';
                    return `<td>${escapeHtml(String(val))}</td>`;
                  }).join('')}
                </tr>
              `).join('')}
            </tbody>
          </table>
          ${invalidRows.length > 0 ? `
          <details style="margin-top:8px">
            <summary style="cursor:pointer;color:var(--color-error, #f44336)">Detalhes dos erros (${invalidRows.length})</summary>
            <ul style="font-size:0.85em;margin-top:4px">
              ${invalidRows.map(({ index, errors }: { index: number; errors: string[] }) => `<li>Linha ${index}: ${escapeHtml(errors.join('; '))}</li>`).join('')}
            </ul>
          </details>` : ''}
        </div>
        <div class="${CSS.footer}">
          <button data-action="cancel" class="pna-btn pna-btn-secondary">Cancelar</button>
          <button data-action="confirm" class="pna-btn pna-btn-primary" ${validRows.length === 0 ? 'disabled' : ''}>
            Importar ${validRows.length} item${validRows.length !== 1 ? 'ns' : ''}
          </button>
        </div>
      </div>
    `;

    // Event delegation
    _overlayEl.addEventListener('click', _handleClick);
    _overlayEl.addEventListener('keydown', _handleKeydown);

    container.appendChild(_overlayEl);
    _log('info', `Preview opened: ${validRows.length} valid, ${invalidRows.length} invalid`);

    // Focus trap
    const confirmBtn = _overlayEl.querySelector('[data-action="confirm"]') as HTMLButtonElement | null;
    if (confirmBtn && !confirmBtn.disabled) confirmBtn.focus();
  }

  /**
   * Close the preview modal.
   */
  function close() {
    if (!_isOpen || !_overlayEl) return;
    _overlayEl.removeEventListener('click', _handleClick);
    _overlayEl.removeEventListener('keydown', _handleKeydown);
    _overlayEl.remove();
    _overlayEl = null;
    _isOpen = false;
    _currentData = null;
  }

  /** @private */
  function _handleClick(e: MouseEvent) {
    const target = e.target as HTMLElement;
    const action = target.dataset?.action || (target.closest('[data-action]') as HTMLElement | null)?.dataset?.action;
    if (action === 'close' || action === 'cancel') {
      close();
      onCancel();
    } else if (action === 'confirm' && _currentData) {
      const rows = (_currentData.validRows as Record<string, unknown>[]) || [];
      close();
      onConfirm(rows);
    }

    // Click on overlay (outside modal) closes
    if (target.classList.contains(CSS.overlay)) {
      close();
      onCancel();
    }
  }

  /** @private */
  function _handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      close();
      onCancel();
    }
  }

  /**
   * Check if modal is currently open.
   * @returns {boolean}
   */
  function isOpen() {
    return _isOpen;
  }

  return { open, close, isOpen };
}

export function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}

export function healthCheck() {
  return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION };
}

export default { ImportPreviewModal, injectPorts, info, healthCheck, VERSION, MODULE_ID };
