// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (10.1.0-MIGRATION-PHASE3)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-nav-admin.ui.drawer
// PURPOSE: Drawer 360° — Painel lateral para edição detalhada de item
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createPanelPorts from /core/runtime/ports-profiles.js
//
// PROVIDES:
//   VERSION, MODULE_ID, injectPorts, getPorts
//   Drawer — exported class
//   createDrawer() — factory
//   info(), healthCheck()
//
// @origin Adapted from panel-01/ui/drawer.js for nav-admin items
// @changelog
//   10.1.0-MIGRATION-PHASE3: Initial creation — FASE 3 B.5
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createPanelPorts } from '/core/runtime/ports-profiles.js';

export const VERSION = '10.1.0-MIGRATION-PHASE3';
export const MODULE_ID = 'panel-nav-admin.ui.drawer';

const Ports = createPanelPorts({ moduleId: MODULE_ID });
function _getPort(name: string) { return Ports.get(name); }
export function injectPorts(p: unknown) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

const _log = (level: string, ...args: unknown[]) => {
  const logger = _getPort('logger');
  if (!logger) return;
  const prefix = '[Drawer]';
  if (level === 'error') logger.error?.(prefix, ...args);
  else if (level === 'debug') logger.debug?.(prefix, ...args);
  else logger.info?.(prefix, ...args);
};

/** @private Context labels */
const CONTEXT_LABELS = { sidebar: 'Sidebar', navrail: 'NavRail', header: 'Header', footer: 'Footer' };

/** @private Permission level labels */
const LEVEL_LABELS = {
  0: 'Público', 20: 'Usuário', 40: 'Avançado',
  60: 'Supervisor', 80: 'Admin', 100: 'Super Admin'
};

/**
 * Drawer — Painel lateral deslizante com visão 360° de um item de navegação.
 */
export class Drawer {
  [key: string]: any;
  /**
   * @param {Object} [options]
   * @param {Function} [options.onAction] — (action, item) => void
   * @param {Function} [options.onClose] — () => void
   */
  constructor(options: Record<string, unknown> = {}) {
    this.onAction = options.onAction || (() => {});
    this.onClose = options.onClose || (() => {});
    this._el = null;
    this._overlay = null;
    this._abortController = null;
    this._currentItem = null;
  }

  /** @private Create drawer DOM structure */
  _createEl() {
    if (this._el) return;
    if (typeof document === 'undefined') return;

    this._overlay = document.createElement('div');
    this._overlay.className = 'pna-drawer-overlay';

    this._el = document.createElement('div');
    this._el.className = 'pna-drawer';
    this._el.setAttribute('role', 'dialog');
    this._el.setAttribute('aria-label', 'Detalhes do item');

    document.body.appendChild(this._overlay);
    document.body.appendChild(this._el);
  }

  /**
   * Open the drawer with item data.
   * @param {Object} item — Nav item data
   */
  open(item: Record<string, unknown>) {
    this._createEl();
    if (!this._el || !this._overlay) return;

    this._currentItem = item;
    this._el.innerHTML = this._renderContent(item);
    this._el.classList.add('pna-drawer--open');
    this._overlay.classList.add('pna-drawer-overlay--visible');

    // Bind events
    this._abortController = new AbortController();
    const signal = this._abortController.signal;

    this._overlay.addEventListener('click', () => this.close(), { signal });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') this.close();
    }, { signal });

    this._el.addEventListener('click', (e: MouseEvent) => {
      const btn = (e.target as HTMLElement).closest('[data-drawer-action]') as HTMLElement | null;
      if (btn) {
        const action = btn.dataset['drawerAction'];
        if (action === 'close') this.close();
        else this.onAction(action, this._currentItem);
      }
    }, { signal });

    _log('debug', 'Drawer opened for item:', item?.id);
  }

  /**
   * @private Render drawer content.
   * @param {Object} item
   * @returns {string} HTML
   */
  _renderContent(item: Record<string, unknown>) {
    if (!item) return '<div class="pna-drawer__empty">Nenhum item selecionado</div>';

    const context = (CONTEXT_LABELS as Record<string, string>)[item.section as string] || String(item.section || '—');
    const levelLabel = (LEVEL_LABELS as Record<number, string>)[item.minLevel as number] || 'Nível ' + (item.minLevel || 0);
    const status = item.isActive === false ? 'Inativo' : 'Ativo';
    const statusClass = item.isActive === false ? 'inactive' : 'active';
    const visibility = item.isVisible === false ? 'Oculto' : 'Visível';

    const createdAt = item.createdAt ? new Date(item.createdAt as string).toLocaleString('pt-BR') : '—';
    const updatedAt = item.updatedAt ? new Date(item.updatedAt as string).toLocaleString('pt-BR') : '—';

    return '<div class="pna-drawer__header">' +
      '<div class="pna-drawer__header-left">' +
        '<h2 class="pna-drawer__title">' + (item.label || 'Sem nome') + '</h2>' +
        '<span class="pna-drawer__badge pna-drawer__badge--' + statusClass + '">' + status + '</span>' +
      '</div>' +
      '<button class="pna-drawer__close" data-drawer-action="close" aria-label="Fechar">&times;</button>' +
    '</div>' +

    '<div class="pna-drawer__body">' +
      '<section class="pna-drawer__section">' +
        '<h3 class="pna-drawer__section-title">Propriedades</h3>' +
        this._field('ID', String(item.id || '—')) +
        this._field('Label', String(item.label || '—')) +
        this._field('Rota', String(item.href || '—')) +
        this._field('Ícone', String(item.icon || 'default')) +
        this._field('Tipo', String(item.itemType || 'navigation')) +
        this._field('Painel', String(item.panelId || '—')) +
        this._field('Descrição', String(item.description || '—')) +
      '</section>' +

      '<section class="pna-drawer__section">' +
        '<h3 class="pna-drawer__section-title">Contexto e Hierarquia</h3>' +
        this._field('Contexto', context) +
        this._field('Grupo pai', String(item.parentLabel || item.parentKey || '—')) +
        this._field('Ordem', String(item.order != null ? item.order : '—')) +
        this._field('Visibilidade', visibility) +
      '</section>' +

      '<section class="pna-drawer__section">' +
        '<h3 class="pna-drawer__section-title">Permissões (UARPS)</h3>' +
        this._field('Nível mínimo', levelLabel + ' (' + (item.minLevel || 0) + ')') +
        this._field('UARPS Trigger', String(item.uarpsTrigger || '—')) +
      '</section>' +

      '<section class="pna-drawer__section">' +
        '<h3 class="pna-drawer__section-title">Metadados</h3>' +
        this._field('Source Table', String(item.sourceTable || '—')) +
        this._field('Source ID', String(item.sourceId || item.dbId || '—')) +
        this._field('Criado em', createdAt) +
        this._field('Atualizado em', updatedAt) +
      '</section>' +
    '</div>' +

    '<div class="pna-drawer__footer">' +
      '<button class="pna-btn pna-btn--primary" data-drawer-action="edit">Editar</button>' +
      '<button class="pna-btn" data-drawer-action="duplicate">Duplicar</button>' +
      '<button class="pna-btn pna-btn--danger" data-drawer-action="delete">Excluir</button>' +
    '</div>';
  }

  /**
   * @private Render a single field row.
   * @param {string} label
   * @param {string} value
   * @returns {string} HTML
   */
  _field(label: string, value: string) {
    return '<div class="pna-drawer__field">' +
      '<span class="pna-drawer__field-label">' + label + '</span>' +
      '<span class="pna-drawer__field-value">' + value + '</span>' +
    '</div>';
  }

  /** Close the drawer. */
  close() {
    if (this._el) this._el.classList.remove('pna-drawer--open');
    if (this._overlay) this._overlay.classList.remove('pna-drawer-overlay--visible');
    if (this._abortController) {
      this._abortController.abort();
      this._abortController = null;
    }
    this._currentItem = null;
    this.onClose();
  }

  /** @returns {boolean} Whether drawer is open */
  isOpen() {
    return this._el ? this._el.classList.contains('pna-drawer--open') : false;
  }

  /** @returns {Object|null} Current item */
  getCurrentItem() { return this._currentItem; }

  /** Cleanup — remove from DOM */
  destroy() {
    this.close();
    if (this._el && this._el.parentNode) this._el.remove();
    if (this._overlay && this._overlay.parentNode) this._overlay.remove();
    this._el = null;
    this._overlay = null;
  }
}

/**
 * Factory to create a Drawer instance.
 * @param {Object} [options]
 * @returns {Drawer}
 */
export function createDrawer(options: Record<string, unknown> = {}) {
  return new Drawer(options);
}

export function info() {
  return { moduleId: MODULE_ID, version: VERSION, portsInitialized: Ports.isInitialized() };
}

export function healthCheck() {
  return { status: Ports.isInitialized() ? 'HEALTHY' : 'DEGRADED', moduleId: MODULE_ID, version: VERSION };
}

export default { Drawer, createDrawer, info, healthCheck, injectPorts, getPorts, VERSION, MODULE_ID };
