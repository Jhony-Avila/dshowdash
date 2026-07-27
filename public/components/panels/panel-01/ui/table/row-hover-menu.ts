// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.1.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-01/ui/row-hover-menu
// PURPOSE: Panel-01 - Row Actions Hover Menu
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   DEFAULT_ACTIONS — exported value
//   RowHoverMenu() — exported function
//   info() — exported function
//   healthCheck() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   'click'
//   'mouseenter'
//   'mouseleave'
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

export const VERSION = '9.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'panel-01/ui/row-hover-menu';

export const DEFAULT_ACTIONS = [
  { id: 'view', label: 'Visualizar', icon: 'eye', shortcut: 'Enter' },
  { id: 'edit', label: 'Editar', icon: 'edit', shortcut: 'E' },
  { id: 'duplicate', label: 'Duplicar', icon: 'copy', shortcut: 'D' },
  { id: 'delete', label: 'Excluir', icon: 'trash', shortcut: 'Del', danger: true },
  { id: 'print', label: 'Imprimir', icon: 'print', shortcut: 'P' },
  { id: 'export-pdf', label: 'Exportar PDF', icon: 'file-pdf' }
];

const ICONS = {
  eye: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>',
  edit: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>',
  copy: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>',
  trash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>',
  print: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>',
  'file-pdf': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><path d="M9 15h6"/></svg>'
};

export function RowHoverMenu(this: Record<string, unknown>, options: Record<string, unknown>) {
  const self = this;
  this.actions = options.actions || DEFAULT_ACTIONS;
  this.onAction = options.onAction || (() => {});
  this._menu = null;
  this._currentRowId = null;
  this._hideTimeout = null;
  this._bound = {
    onMouseEnter: (e: Event) => (self as Record<string, (e: Event) => void>)._onMouseEnter(e),
    onMouseLeave: (e: Event) => (self as Record<string, (e: Event) => void>)._onMouseLeave(e),
    onMenuClick: (e: Event) => (self as Record<string, (e: Event) => void>)._onMenuClick(e),
    onTableMouseEnter: null,
    onTableMouseLeave: null
  };
}

RowHoverMenu.prototype.init = function(tableContainer: HTMLElement | null | undefined) {
  this._tableContainer = tableContainer;
  this._createMenu();
  this._bindTableEvents();
};

RowHoverMenu.prototype._createMenu = function() {
  this._menu = document.createElement('div');
  this._menu.className = 'p01-row-hover-menu';
  this._menu.innerHTML = this._renderActions();
  this._menu.addEventListener('click', this._bound.onMenuClick);
  this._menu.addEventListener('mouseenter', this._bound.onMouseEnter);
  this._menu.addEventListener('mouseleave', this._bound.onMouseLeave);
  document.body.appendChild(this._menu);
};

RowHoverMenu.prototype._renderActions = function() {
  return (this.actions as Record<string, unknown>[]).map((action: Record<string, unknown>) => {
    const dangerClass = action.danger ? ' p01-row-hover-action--danger' : '';
    const shortcut = action.shortcut ? `<span class="p01-row-hover-shortcut">${action.shortcut}</span>` : '';
    return `<button class="p01-row-hover-action${dangerClass}" data-action="${action.id}" title="${action.label}"><span class="p01-row-hover-icon">${(ICONS as Record<string, string>)[action.icon as string] || ''}</span><span class="p01-row-hover-label">${action.label}</span>${shortcut}</button>`;
  }).join('');
};

RowHoverMenu.prototype._bindTableEvents = function() {
  if (!this._tableContainer) return;
  const self = this;
  this._bound.onTableMouseEnter = (e: MouseEvent) => {
    const row = (e.target as Element).closest('tr[data-id]');
    if (row) self._showMenu(row);
  };
  this._bound.onTableMouseLeave = (e: MouseEvent) => {
    const row = (e.target as Element).closest('tr[data-id]');
    if (row) self._scheduleHide();
  };
  this._tableContainer.addEventListener('mouseenter', this._bound.onTableMouseEnter, true);
  this._tableContainer.addEventListener('mouseleave', this._bound.onTableMouseLeave, true);
};

RowHoverMenu.prototype._showMenu = function(row: HTMLElement) {
  clearTimeout(this._hideTimeout);
  this._currentRowId = row.dataset.id;
  const rect = row.getBoundingClientRect();
  const menuWidth = 180;
  const left = rect.right - menuWidth - 10;
  const top = rect.top + (rect.height / 2);
  this._menu.style.left = `${left}px`;
  this._menu.style.top = `${top}px`;
  this._menu.style.transform = 'translateY(-50%)';
  this._menu.classList.add('visible');
};

RowHoverMenu.prototype._scheduleHide = function() {
  const self = this;
  clearTimeout(this._hideTimeout);
  this._hideTimeout = setTimeout(() => {
    self._hideMenu();
  }, 300);
};

RowHoverMenu.prototype._hideMenu = function() {
  this._menu.classList.remove('visible');
  this._currentRowId = null;
};

RowHoverMenu.prototype._onMouseEnter = function() {
  clearTimeout(this._hideTimeout);
};

RowHoverMenu.prototype._onMouseLeave = function() {
  this._scheduleHide();
};

RowHoverMenu.prototype._onMenuClick = function(e: MouseEvent) {
  const btn = (e.target as Element).closest('[data-action]');
  if (btn && this._currentRowId) {
    (this.onAction as (action: string, id: string) => void)((btn as HTMLElement).dataset.action!, this._currentRowId);
    this._hideMenu();
  }
};

RowHoverMenu.prototype.destroy = function() {
  clearTimeout(this._hideTimeout);
  if (this._tableContainer) {
    if (this._bound.onTableMouseEnter) this._tableContainer.removeEventListener('mouseenter', this._bound.onTableMouseEnter, true);
    if (this._bound.onTableMouseLeave) this._tableContainer.removeEventListener('mouseleave', this._bound.onTableMouseLeave, true);
  }
  if (this._menu) {
    this._menu.removeEventListener('click', this._bound.onMenuClick);
    this._menu.removeEventListener('mouseenter', this._bound.onMouseEnter);
    this._menu.removeEventListener('mouseleave', this._bound.onMouseLeave);
    this._menu.remove();
  }
  this._menu = null;
  this._tableContainer = null;
};

export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION }; }
export default { RowHoverMenu, DEFAULT_ACTIONS, info, healthCheck };
