// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.4.0-P17WI-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-01/ui/kanban-view
// PURPOSE: Panel-01 - Kanban View
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   DEFAULT_COLUMNS — exported value
//   KanbanViewManager() — exported function
//   info() — exported function
//   healthCheck() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   'click'
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

export const VERSION = '9.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'panel-01/ui/kanban-view';

export const DEFAULT_COLUMNS = [
  { id: 'pendente', label: 'Pendente', color: '#f59e0b', status: 'Pendente' },
  { id: 'em-analise', label: 'Em Análise', color: '#3b82f6', status: 'Em Análise' },
  { id: 'aprovado', label: 'Aprovado', color: '#10b981', status: 'Aprovado' },
  { id: 'rejeitado', label: 'Rejeitado', color: '#ef4444', status: 'Rejeitado' }
];

export function KanbanViewManager(this: any, options: Record<string, unknown> = {}) {
  options = options || {};
  this.container = options.container || null;
  this.columns = options.columns || DEFAULT_COLUMNS;
  this.groupField = options.groupField || 'situacao';
  this.onCardClick = options.onCardClick || (() => {});
  this.onCardMove = options.onCardMove || (() => {});
  this.onMove = options.onMove || (() => {});
  this.onAction = options.onAction || (() => {});
  this._data = [];
  this._groupedData = {};
}

KanbanViewManager.prototype.setContainer = function(container: HTMLElement) { this.container = container; };
KanbanViewManager.prototype.setData = function(data: unknown[]) { this._data = data || []; this._groupData(); };
KanbanViewManager.prototype._groupData = function() {
  const self = this;
  this._groupedData = {};
  this.columns.forEach((col: Record<string, unknown>) => { self._groupedData[col.status as string] = []; });
  this._data.forEach((item: Record<string, unknown>) => {
    const status = (item[self.groupField] || item.situacao || item.Situacao || 'Outros') as string;
    if (!self._groupedData[status]) self._groupedData[status] = [];
    self._groupedData[status].push(item);
  });
};
KanbanViewManager.prototype.render = function() {
  if (!this.container) return;
  const self = this;
  let html = '<div class="p01-kanban">';
  this.columns.forEach((col: Record<string, unknown>) => {
    const items = self._groupedData[col.status as string] || [];
    html += `<div class="p01-kanban-column" data-status="${col.status}" style="border-top-color: ${col.color}">`;
    html += `<div class="p01-kanban-header"><span class="p01-kanban-title">${col.label}</span><span class="p01-kanban-count">${items.length}</span></div>`;
    html += '<div class="p01-kanban-cards">';
    items.forEach((item: Record<string, unknown>) => {
      const id = item.id || item.Id_Requisicao;
      html += `<div class="p01-kanban-card" draggable="true" data-id="${id}">`;
      html += `<div class="p01-kanban-card-id">#${id}</div>`;
      html += `<div class="p01-kanban-card-title">${((item.descricao || item.Descricao_Requisicao || '-') as string).substring(0, 50)}</div></div>`;
    });
    html += '</div></div>';
  });
  html += '</div>';
  this.container.innerHTML = html;
  this._bindEvents();
};
KanbanViewManager.prototype._bindEvents = function() {
  const self = this;
  if (!this.container) return;
  this.container.querySelectorAll('.p01-kanban-card').forEach((card: Element) => {
    card.addEventListener('click', () => { self.onCardClick((card as HTMLElement).dataset.id); });
  });
};
KanbanViewManager.prototype.destroy = function() { if (this.container) this.container.innerHTML = ''; this._data = []; };

export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION }; }
export default { KanbanViewManager, DEFAULT_COLUMNS, info, healthCheck };
