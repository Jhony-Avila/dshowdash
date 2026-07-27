// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.4.0-P17WI-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-01/ui/card-view
// PURPOSE: Panel-01 - Card View Mode
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   VIEW_MODES — exported value
//   CardViewManager() — exported function
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
export const MODULE_ID = 'panel-01/ui/card-view';

export const VIEW_MODES = { TABLE: 'table', CARD: 'card', COMPACT_CARD: 'compact-card' };

export function CardViewManager(this: any, options: Record<string, unknown> = {}) {
  options = options || {};
  this.container = options.container || null;
  this.onAction = options.onAction || (() => {});
  this.onSelect = options.onSelect || (() => {});
  this.onCardClick = options.onCardClick || (() => {});
  this.formatters = options.formatters || {};
  this._data = [];
  this._selectedIds = new Set();
  this._mode = VIEW_MODES.CARD;
}

CardViewManager.prototype.setContainer = function(container: HTMLElement) { this.container = container; };
CardViewManager.prototype.setData = function(data: unknown[]) { this._data = data || []; };
CardViewManager.prototype.setSelected = function(ids: (string | number)[]) { this._selectedIds = new Set(ids); };
CardViewManager.prototype.render = function() {
  if (!this.container) return;
  const self = this;
  let html = '<div class="p01-card-view">';
  this._data.forEach((item: Record<string, unknown>) => {
    const id = item.id || item.Id_Requisicao;
    const selected = self._selectedIds.has(String(id)) ? ' selected' : '';
    html += `<div class="p01-card${selected}" data-id="${id}">`;
    html += `<div class="p01-card-header"><span class="p01-card-id">#${id}</span></div>`;
    html += `<div class="p01-card-body"><div class="p01-card-title">${item.descricao || item.Descricao_Requisicao || '-'}</div>`;
    html += `<div class="p01-card-meta"><span>${item.situacao || item.Situacao || '-'}</span></div></div>`;
    html += `<div class="p01-card-footer"><span class="p01-card-value">R$ ${self._formatCurrency(item.valor_total || item.Valor_Total || 0)}</span></div></div>`;
  });
  html += '</div>';
  this.container.innerHTML = html;
  this._bindEvents();
};
CardViewManager.prototype._formatCurrency = (num: unknown) => parseFloat((num as string) || '0').toLocaleString('pt-BR', { minimumFractionDigits: 2 });
CardViewManager.prototype._bindEvents = function() {
  const self = this;
  if (!this.container) return;
  this.container.querySelectorAll('.p01-card').forEach((card: Element) => {
    card.addEventListener('click', () => { self.onCardClick((card as HTMLElement).dataset.id); });
  });
};
CardViewManager.prototype.destroy = function() { if (this.container) this.container.innerHTML = ''; this._data = []; };

export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION }; }
export default { CardViewManager, VIEW_MODES, info, healthCheck };
