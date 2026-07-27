// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (10.2.0-MIGRATION-PHASE4)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-nav-admin.ui.views.card-view
// PURPOSE: Card View — Visualização em cards dos itens de navegação
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createPanelPorts from /core/runtime/ports-profiles.js
//   PERMISSION_LEVELS, AVAILABLE_ICONS from ../../core/contracts.js
//
// PROVIDES:
//   VERSION, MODULE_ID
//   CardView — Factory function
//   VIEW_MODES — View mode constants
//   info(), healthCheck()
//
// @origin Adapted from panel-01/ui/card-view.js for nav-admin domain
// @changelog
//   10.2.0-MIGRATION-PHASE4: Initial creation — FASE 4 B.8
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createPanelPorts } from '/core/runtime/ports-profiles.js';
import { PERMISSION_LEVELS, AVAILABLE_ICONS } from '../../core/contracts.js';

export const VERSION = '10.2.0-MIGRATION-PHASE4';
export const MODULE_ID = 'panel-nav-admin.ui.views.card-view';

const Ports = createPanelPorts({ moduleId: MODULE_ID });
export function injectPorts(p: unknown) { return Ports.inject(p); }

const _log = (level: string, ...args: unknown[]) => {
  const logger = Ports.get('logger');
  if (!logger) return;
  const prefix = '[CardView]';
  if (level === 'error') logger.error?.(prefix, ...args);
  else if (level === 'debug') logger.debug?.(prefix, ...args);
  else logger.info?.(prefix, ...args);
};

/** @type {Object} View mode constants */
export const VIEW_MODES = Object.freeze({
  TABLE: 'table',
  CARD: 'card',
  COMPACT_CARD: 'compact-card'
});

/**
 * Factory: creates a card view renderer for nav-admin items.
 *
 * @param {Object} options
 * @param {HTMLElement} options.container — Parent DOM element
 * @param {Function} options.onAction — Callback(actionId, item) for card actions
 * @param {Function} [options.onSelect] — Callback(item, isSelected) for selection
 * @param {Function} [options.onCardClick] — Callback(item) for card click
 * @param {string} [options.mode='card'] — VIEW_MODES.CARD or VIEW_MODES.COMPACT_CARD
 * @returns {Object} CardView instance
 */
export function CardView(options: Record<string, unknown> = {}) {
  const container = options.container as HTMLElement | undefined;
  const onAction = options.onAction as ((action: string, item: Record<string, unknown>) => void) | undefined;
  const onSelect = options.onSelect as ((item: Record<string, unknown>, isSelected: boolean) => void) | undefined;
  const onCardClick = options.onCardClick as ((item: Record<string, unknown>) => void) | undefined;

  let _items: Record<string, unknown>[] = [];
  let _selected = new Set<string>();
  let _mode = (options.mode as string) || VIEW_MODES.CARD;

  /**
   * Render cards for the given items.
   * @param {Array} items
   */
  function render(items: Record<string, unknown>[]) {
    if (!container) return;
    _items = items || [];

    if (_items.length === 0) {
      container.innerHTML = `
        <div class="pna-card-view__empty">
          <p>Nenhum item de navegação encontrado</p>
        </div>`;
      return;
    }

    const isCompact = _mode === VIEW_MODES.COMPACT_CARD;
    const cards = _items.map(item => _renderCard(item, isCompact)).join('');

    container.innerHTML = `
      <div class="pna-card-view pna-card-view--${isCompact ? 'compact' : 'full'}">
        ${cards}
      </div>`;

    _bindEvents();
  }

  /**
   * Render a single card.
   * @private
   * @param {Object} item
   * @param {boolean} isCompact
   * @returns {string} HTML
   */
  function _renderCard(item: Record<string, unknown>, isCompact: boolean) {
    const selectedClass = _selected.has(item.id as string) ? ' pna-card--selected' : '';
    const activeClass = item.isActive === false ? ' pna-card--inactive' : '';
    const dividerClass = item.isDivider ? ' pna-card--divider' : '';
    const permLevel = _getPermissionLabel((item.minLevel as number) || 0);
    const context = item.context || item.sourceTable || 'sidebar';
    const contextBadge = `<span class="pna-card__context pna-card__context--${context}">${context}</span>`;
    const statusDot = item.isActive !== false
      ? '<span class="pna-card__status pna-card__status--active" title="Ativo"></span>'
      : '<span class="pna-card__status pna-card__status--inactive" title="Inativo"></span>';

    if (isCompact) {
      return `
        <div class="pna-card pna-card--compact${selectedClass}${activeClass}" data-card-id="${item.id}">
          <div class="pna-card__icon-wrap"><span class="pna-card__icon" data-icon="${item.icon || 'default'}">${item.icon || 'default'}</span></div>
          <div class="pna-card__info">
            <span class="pna-card__label">${_esc(item.label || item.id)}</span>
            ${contextBadge}${statusDot}
          </div>
        </div>`;
    }

    return `
      <div class="pna-card${selectedClass}${activeClass}${dividerClass}" data-card-id="${item.id}">
        <div class="pna-card__header">
          <div class="pna-card__icon-wrap"><span class="pna-card__icon" data-icon="${item.icon || 'default'}">${item.icon || 'default'}</span></div>
          <div class="pna-card__title">
            <span class="pna-card__label">${_esc(item.label || item.id)}</span>
            <span class="pna-card__id">${_esc(item.id)}</span>
          </div>
          ${statusDot}
        </div>
        <div class="pna-card__body">
          <div class="pna-card__row"><span class="pna-card__key">Rota:</span> <span class="pna-card__val">${_esc(item.href || '—')}</span></div>
          <div class="pna-card__row"><span class="pna-card__key">Contexto:</span> ${contextBadge}</div>
          <div class="pna-card__row"><span class="pna-card__key">Seção:</span> <span class="pna-card__val">${_esc(item.section || '—')}</span></div>
          <div class="pna-card__row"><span class="pna-card__key">Nível:</span> <span class="pna-card__val">${permLevel}</span></div>
          <div class="pna-card__row"><span class="pna-card__key">Ordem:</span> <span class="pna-card__val">${item.order ?? '—'}</span></div>
        </div>
        <div class="pna-card__actions">
          <button type="button" class="pna-card__action" data-action="edit" data-id="${item.id}" title="Editar">Editar</button>
          <button type="button" class="pna-card__action" data-action="duplicate" data-id="${item.id}" title="Duplicar">Duplicar</button>
          <button type="button" class="pna-card__action" data-action="toggle" data-id="${item.id}" title="${item.isActive !== false ? 'Desativar' : 'Ativar'}">${item.isActive !== false ? 'Desativar' : 'Ativar'}</button>
          <button type="button" class="pna-card__action pna-card__action--danger" data-action="delete" data-id="${item.id}" title="Excluir">Excluir</button>
        </div>
      </div>`;
  }

  /** @private */
  function _bindEvents() {
    if (!container) return;

    container.addEventListener('click', (e: MouseEvent) => {
      const actionBtn = (e.target as HTMLElement).closest('[data-action]') as HTMLElement | null;
      if (actionBtn) {
        const action = actionBtn.dataset.action || '';
        const id = actionBtn.dataset.id;
        const item = _items.find((i: Record<string, unknown>) => String(i.id) === String(id));
        if (item && typeof onAction === 'function') {
          onAction(action, item);
        }
        e.stopPropagation();
        return;
      }

      const card = (e.target as HTMLElement).closest('[data-card-id]') as HTMLElement | null;
      if (card) {
        const id = card.dataset.cardId;
        const item = _items.find((i: Record<string, unknown>) => String(i.id) === String(id));
        if (!item) return;

        if (e.ctrlKey || e.metaKey) {
          _toggleSelection(item, card);
        } else if (typeof onCardClick === 'function') {
          onCardClick(item);
        }
      }
    });
  }

  /** @private */
  function _toggleSelection(item: Record<string, unknown>, cardEl: HTMLElement) {
    const id = item.id as string;
    if (_selected.has(id)) {
      _selected.delete(id);
      cardEl.classList.remove('pna-card--selected');
    } else {
      _selected.add(id);
      cardEl.classList.add('pna-card--selected');
    }
    if (typeof onSelect === 'function') {
      onSelect(item, _selected.has(id));
    }
  }

  /**
   * Get permission level label.
   * @private
   * @param {number} level
   * @returns {string}
   */
  function _getPermissionLabel(level: number) {
    const pl = PERMISSION_LEVELS.find(p => p.value === level);
    return pl ? `${pl.label} (${level})` : String(level);
  }

  /** @private HTML escape */
  function _esc(str: unknown) {
    const d = document.createElement('div');
    d.textContent = String(str ?? '');
    return d.innerHTML;
  }

  /** @returns {Set} Selected item IDs */
  function getSelectedIds() { return new Set(_selected); }

  /** Clear selection */
  function clearSelection() {
    _selected.clear();
    container?.querySelectorAll('.pna-card--selected').forEach(el => el.classList.remove('pna-card--selected'));
  }

  /**
   * Switch between card and compact card modes.
   * @param {string} newMode
   */
  function setMode(newMode: string) {
    _mode = newMode;
    render(_items);
  }

  /** Destroy the view. */
  function destroy() {
    if (container) container.innerHTML = '';
    _items = [];
    _selected.clear();
  }

  return { render, getSelectedIds, clearSelection, setMode, destroy };
}

export function info() {
  return { moduleId: MODULE_ID, version: VERSION, viewModes: Object.values(VIEW_MODES) };
}

export function healthCheck() {
  return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION };
}

export default { CardView, VIEW_MODES, injectPorts, info, healthCheck, VERSION, MODULE_ID };
