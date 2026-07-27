// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (10.1.0-MIGRATION-PHASE3)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-nav-admin.ui.toolbar
// PURPOSE: Toolbar Avançada — Densidade, ações em massa, modo de visualização
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createPanelPorts from /core/runtime/ports-profiles.js
//
// PROVIDES:
//   VERSION, MODULE_ID, injectPorts, getPorts
//   Toolbar — exported class
//   createToolbar() — factory
//   DENSITIES — exported enum
//   VIEW_MODES — exported enum
//   info(), healthCheck()
//
// @origin Adapted from panel-01/ui/toolbar.js for nav-admin
// @changelog
//   10.1.0-MIGRATION-PHASE3: Initial creation — FASE 3 B.6
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createPanelPorts } from '/core/runtime/ports-profiles.js';

export const VERSION = '13.0.0-GROUP-FILTER';
export const MODULE_ID = 'panel-nav-admin.ui.toolbar';

const Ports = createPanelPorts({ moduleId: MODULE_ID });
function _getPort(name: string) { return Ports.get(name); }
export function injectPorts(p: unknown) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

/**
 * Density levels.
 * @readonly
 * @enum {string}
 */
export const DENSITIES = Object.freeze({
  COMPACT:     'compact',
  NORMAL:      'normal',
  COMFORTABLE: 'comfortable'
});

/**
 * View modes for the nav-admin list.
 * @readonly
 * @enum {string}
 */
export const VIEW_MODES = Object.freeze({
  TABLE: 'table',
  CARD:  'card',
  SPLIT: 'split'
});

/**
 * Toolbar — Barra de controles avançados.
 */
export class Toolbar {
  [key: string]: any;
  /**
   * @param {Object} [options]
   * @param {Function} [options.onAction] — Callback (action, value)
   * @param {string} [options.density='normal']
   * @param {string} [options.viewMode='table']
   * @param {boolean} [options.autoRefresh=true]
   */
  constructor(options: Record<string, unknown> = {}) {
    this.onAction = options.onAction || (() => {});
    this.density = options.density || DENSITIES.NORMAL;
    this.viewMode = options.viewMode || VIEW_MODES.TABLE;
    this.autoRefresh = options.autoRefresh !== false;
    this._el = null;
    this._boundHandler = null;
    this._groups = (options.groups || []) as { key: string; label: string }[];
    this._selectedGroup = (options.selectedGroup || '') as string;
  }

  /**
   * Render the toolbar HTML.
   * @param {Object} [state]
   * @param {boolean} [state.loading]
   * @param {number} [state.countdown]
   * @param {number} [state.selectedCount=0]
   * @param {number} [state.totalCount=0]
   * @returns {string} HTML
   */
  render(state: Record<string, number | boolean | string | null | undefined>) {
    const s = state || {};
    const loading = !!s.loading;
    const countdown = Number(s.countdown) || 0;
    const selected = Number(s.selectedCount) || 0;
    const total = Number(s.totalCount) || 0;

    const densityBtns = [DENSITIES.COMPACT, DENSITIES.NORMAL, DENSITIES.COMFORTABLE].map(d => {
      const active = d === this.density ? ' pna-toolbar-btn--active' : '';
      const labels = { compact: 'Compacto', normal: 'Normal', comfortable: 'Confortável' };
      return '<button class="pna-toolbar-btn' + active + '" data-toolbar-action="density" data-toolbar-value="' + d + '" title="' + labels[d] + '">' +
        '<span class="pna-toolbar-density-icon pna-toolbar-density-icon--' + d + '"></span>' +
      '</button>';
    }).join('');

    const viewBtns = [VIEW_MODES.TABLE, VIEW_MODES.CARD, VIEW_MODES.SPLIT].map(v => {
      const active = v === this.viewMode ? ' pna-toolbar-btn--active' : '';
      const icons = { table: '☰', card: '⊞', split: '◫' };
      const labels = { table: 'Tabela', card: 'Cards', split: 'Dividido' };
      return '<button class="pna-toolbar-btn' + active + '" data-toolbar-action="view-mode" data-toolbar-value="' + v + '" title="' + labels[v] + '">' +
        icons[v] +
      '</button>';
    }).join('');

    const bulkSection = selected > 0
      ? '<div class="pna-toolbar-bulk">' +
          '<span class="pna-toolbar-bulk-count">' + selected + ' selecionado' + (selected > 1 ? 's' : '') + '</span>' +
          '<button class="pna-toolbar-btn pna-toolbar-btn--danger" data-toolbar-action="bulk-delete" title="Excluir selecionados">Excluir</button>' +
          '<button class="pna-toolbar-btn" data-toolbar-action="bulk-move" title="Mover seção">Mover</button>' +
          '<button class="pna-toolbar-btn" data-toolbar-action="bulk-toggle" title="Ativar/Desativar">Alternar</button>' +
          '<button class="pna-toolbar-btn" data-action="bulk-set-title" title="Definir titulo em massa">Titulo</button>' +
          '<button class="pna-toolbar-btn" data-toolbar-action="clear-selection" title="Limpar seleção">&times;</button>' +
        '</div>'
      : '';

    const refreshIcon = loading
      ? '<span class="pna-toolbar-spinner"></span>'
      : (countdown > 0 ? countdown + 's' : '↻');

    // MELHORIA 3: Group filter dropdown
    const groups = this._groups as { key: string; label: string }[];
    const selectedGroup = this._selectedGroup as string;
    let groupFilterHtml = '';
    if (groups && groups.length > 0) {
      groupFilterHtml = '<div class="pna-toolbar-group" data-toolbar-group="group-filter">' +
        '<span class="pna-toolbar-label">Grupo</span>' +
        '<select class="pna-toolbar-select" data-toolbar-action="filter-group" style="padding:0.25rem 0.5rem;font-size:0.75rem;background:rgba(255,255,255,0.06);color:inherit;border:1px solid rgba(255,255,255,0.12);border-radius:0.375rem;cursor:pointer;min-width:120px;outline:none;">' +
        '<option value=""' + (!selectedGroup ? ' selected' : '') + '>Todos</option>';
      for (let gi = 0; gi < groups.length; gi++) {
        const g = groups[gi];
        const sel = (g.key === selectedGroup) ? ' selected' : '';
        groupFilterHtml += '<option value="' + g.key + '"' + sel + '>' + (g.label || g.key) + '</option>';
      }
      groupFilterHtml += '</select></div>';
    }

    return '<div class="pna-toolbar" data-toolbar>' +
      '<div class="pna-toolbar-left">' +
        '<div class="pna-toolbar-group" data-toolbar-group="density">' +
          '<span class="pna-toolbar-label">Densidade</span>' +
          densityBtns +
        '</div>' +
        '<div class="pna-toolbar-group" data-toolbar-group="view">' +
          '<span class="pna-toolbar-label">Visualização</span>' +
          viewBtns +
        '</div>' +
        groupFilterHtml +
      '</div>' +
      '<div class="pna-toolbar-center">' +
        bulkSection +
        (total > 0 && selected === 0 ? '<span class="pna-toolbar-count">' + total + ' itens</span>' : '') +
      '</div>' +
      '<div class="pna-toolbar-right">' +
        '<button class="pna-toolbar-btn" data-toolbar-action="refresh" title="Atualizar"' + (loading ? ' disabled' : '') + '>' +
          refreshIcon +
        '</button>' +
        '<button class="pna-toolbar-btn' + (this.autoRefresh ? ' pna-toolbar-btn--active' : '') + '" data-toolbar-action="toggle-auto-refresh" title="Auto-refresh">' +
          '⟳' +
        '</button>' +
        '<button class="pna-toolbar-btn" data-toolbar-action="export" title="Exportar">↓</button>' +
        '<button class="pna-toolbar-btn pna-toolbar-btn--primary" data-toolbar-action="new-group" title="Criar novo grupo" style="background:rgba(99,102,241,0.15);color:#818cf8;border:1px solid rgba(99,102,241,0.3);font-size:0.75rem;padding:0.25rem 0.6rem;">+ Grupo</button>' +
        '<button class="pna-toolbar-btn pna-toolbar-btn--status" data-action="health-status" title="Status da Navegação">◉ Status</button>' +
      '</div>' +
    '</div>';
  }

  /**
   * Bind the toolbar to a container (attaches click delegation).
   * @param {HTMLElement} container
   */
  bind(container: HTMLElement) {
    if (!container) return;
    this._el = container.querySelector('[data-toolbar]') || container;

    this._boundHandler = (e: Event) => {
      const btn = (e.target as HTMLElement).closest('[data-toolbar-action]') as HTMLElement | null;
      if (!btn) return;

      const action = btn.dataset.toolbarAction;
      const value = btn.dataset.toolbarValue || null;

      switch (action) {
        case 'density':
          this.density = value;
          break;
        case 'view-mode':
          this.viewMode = value;
          break;
        case 'toggle-auto-refresh':
          this.autoRefresh = !this.autoRefresh;
          break;
        case 'new-group':
          // Handled directly via onAction callback
          break;
      }

      this.onAction(action, value);
    };

    this._el.addEventListener('click', this._boundHandler);

    // MELHORIA 3: Handle group filter dropdown change
    this._boundSelectHandler = (e: Event) => {
      const select = e.target as HTMLSelectElement;
      if (select && select.dataset.toolbarAction === 'filter-group') {
        this._selectedGroup = select.value;
        this.onAction('filter-group', select.value);
      }
    };
    this._el.addEventListener('change', this._boundSelectHandler);
  }

  /**
   * Update the countdown display.
   * @param {number} seconds
   */
  updateCountdown(seconds: number) {
    if (!this._el) return;
    const btn = this._el.querySelector('[data-toolbar-action="refresh"]');
    if (btn && !btn.disabled) btn.textContent = seconds > 0 ? seconds + 's' : '↻';
  }

  /**
   * Set loading state on refresh button.
   * @param {boolean} loading
   */
  setLoading(loading: boolean) {
    if (!this._el) return;
    const btn = this._el.querySelector('[data-toolbar-action="refresh"]');
    if (btn) {
      btn.disabled = loading;
      btn.innerHTML = loading ? '<span class="pna-toolbar-spinner"></span>' : '↻';
    }
  }

  /** Cleanup */
  destroy() {
    if (this._el && this._boundHandler) {
      this._el.removeEventListener('click', this._boundHandler);
    }
    if (this._el && this._boundSelectHandler) {
      this._el.removeEventListener('change', this._boundSelectHandler);
    }
    this._el = null;
    this._boundHandler = null;
    this._boundSelectHandler = null;
  }

  /**
   * Update the groups list for the filter dropdown.
   * @param {Array} groups
   */
  setGroups(groups: { key: string; label: string }[]) {
    this._groups = groups || [];
    // Update the select if already rendered
    if (!this._el) return;
    const select = this._el.querySelector('[data-toolbar-action="filter-group"]') as HTMLSelectElement | null;
    if (!select) return;
    const currentVal = select.value;
    let optionsHtml = '<option value="">Todos</option>';
    for (let i = 0; i < groups.length; i++) {
      const g = groups[i];
      const sel = (g.key === currentVal) ? ' selected' : '';
      optionsHtml += '<option value="' + g.key + '"' + sel + '>' + (g.label || g.key) + '</option>';
    }
    select.innerHTML = optionsHtml;
  }

  /**
   * Get the currently selected group filter.
   * @returns {string}
   */
  getSelectedGroup() {
    return this._selectedGroup || '';
  }
}

/**
 * Factory to create a Toolbar instance.
 * @param {Object} [options]
 * @returns {Toolbar}
 */
export function createToolbar(options: Record<string, unknown> = {}) {
  return new Toolbar(options);
}

export function info() {
  return { moduleId: MODULE_ID, version: VERSION, densities: Object.values(DENSITIES), viewModes: Object.values(VIEW_MODES) };
}

export function healthCheck() {
  return { status: Ports.isInitialized() ? 'HEALTHY' : 'DEGRADED', moduleId: MODULE_ID, version: VERSION };
}

export default { Toolbar, createToolbar, DENSITIES, VIEW_MODES, info, healthCheck, injectPorts, getPorts, VERSION, MODULE_ID };
