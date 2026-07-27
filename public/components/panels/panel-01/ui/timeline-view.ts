// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.4.0-P17WI-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-01/ui/timeline-view
// PURPOSE: Panel-01 - Timeline View Modal
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   TimelineViewManager() — exported function
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
export const MODULE_ID = 'panel-01/ui/timeline-view';

export function TimelineViewManager(this: any, options: Record<string, unknown> = {}) {
  this.dateField = options.dateField || 'Data_Requisicao';
  this.valueField = options.valueField || 'valor_total';
  this.onItemClick = options.onItemClick || (() => {});
  this._data = [];
  this._grouped = {};
  this._modal = null;
}

TimelineViewManager.prototype.setData = function(data: unknown[]) {
  this._data = data || [];
  this._groupByDate();
};

TimelineViewManager.prototype._groupByDate = function() {
  const self = this;
  this._grouped = {};
  
  this._data.forEach((item: Record<string, unknown>) => {
    const dateStr = item[self.dateField] || item.data || item.Data_Requisicao;
    if (!dateStr) return;
    
    const date = new Date(dateStr as string);
    const key = date.toISOString().split('T')[0];
    
    if (!self._grouped[key]) {
      self._grouped[key] = { date, items: [], total: 0, count: 0 };
    }
    
    self._grouped[key].items.push(item);
    self._grouped[key].count++;
    self._grouped[key].total += parseFloat(String(item[self.valueField] || item.valor_total || item.Valor_Total || 0));
  });
};

TimelineViewManager.prototype.openModal = function() {
  const self = this;
  this._modal = document.createElement('div');
  this._modal.className = 'p01-modal-overlay';
  this._modal.innerHTML = this._renderModal();
  document.body.appendChild(this._modal);
  this._bindEvents();
  setTimeout(() => { self._modal.classList.add('open'); }, 10);
};

TimelineViewManager.prototype._renderModal = function() {
  const self = this;
  const sortedDates = Object.keys(this._grouped).sort().reverse();
  
  const stats = this._calculateStats();
  
  const timelineHtml = sortedDates.map(dateKey => {
    const group = self._grouped[dateKey];
    return self._renderDay(dateKey, group);
  }).join('');
  
  return `<div class="p01-modal p01-modal--xl"><div class="p01-modal-header"><h2>Timeline de Requisições</h2><button class="p01-modal-close" data-action="close">&times;</button></div><div class="p01-modal-body"><div class="p01-timeline-stats"><div class="p01-timeline-stat"><span class="p01-timeline-stat-value">${stats.totalDays}</span><span class="p01-timeline-stat-label">Dias</span></div><div class="p01-timeline-stat"><span class="p01-timeline-stat-value">${stats.totalItems}</span><span class="p01-timeline-stat-label">Requisições</span></div><div class="p01-timeline-stat"><span class="p01-timeline-stat-value">R$ ${self._formatNumber(stats.totalValue)}</span><span class="p01-timeline-stat-label">Total</span></div><div class="p01-timeline-stat"><span class="p01-timeline-stat-value">R$ ${self._formatNumber(stats.avgPerDay)}</span><span class="p01-timeline-stat-label">Média/Dia</span></div></div><div class="p01-timeline">${timelineHtml}</div></div><div class="p01-modal-footer"><button class="p01-btn p01-btn--secondary" data-action="close">Fechar</button></div></div>`;
};

TimelineViewManager.prototype._renderDay = function(dateKey: string, group: Record<string, unknown>) {
  const self = this;
  const date = group.date as Date;
  const dayName = date.toLocaleDateString('pt-BR', { weekday: 'short' });
  const dayNum = date.getDate();
  const month = date.toLocaleDateString('pt-BR', { month: 'short' });
  
  let itemsHtml = (group.items as Record<string, unknown>[]).slice(0, 5).map((item: Record<string, unknown>) => {
    const id = item.id || item.Id_Requisicao;
    return `<div class="p01-timeline-item" data-id="${id}"><span class="p01-timeline-item-id">#${id}</span><span class="p01-timeline-item-desc">${self._truncate(item.descricao || item.Descricao_Requisicao || '-', 40)}</span><span class="p01-timeline-item-value">R$ ${self._formatNumber(item.valor_total || item.Valor_Total)}</span></div>`;
  }).join('');
  
  const moreCount = (group.items as unknown[]).length - 5;
  if (moreCount > 0) {
    itemsHtml += `<div class="p01-timeline-more">+ ${moreCount} mais</div>`;
  }
  
  return `<div class="p01-timeline-day"><div class="p01-timeline-date"><span class="p01-timeline-day-name">${dayName}</span><span class="p01-timeline-day-num">${dayNum}</span><span class="p01-timeline-month">${month}</span></div><div class="p01-timeline-connector"><div class="p01-timeline-dot"></div><div class="p01-timeline-line"></div></div><div class="p01-timeline-content"><div class="p01-timeline-summary"><span class="p01-timeline-count">${group.count} requisições</span><span class="p01-timeline-total">R$ ${this._formatNumber(group.total)}</span></div><div class="p01-timeline-items">${itemsHtml}</div></div></div>`;
};

TimelineViewManager.prototype._calculateStats = function(this: any) {
  const keys = Object.keys(this._grouped);
  let totalItems = 0;
  let totalValue = 0;
  
  keys.forEach(function(key) {
    // @ts-expect-error strict migration — TS2683
    totalItems += this._grouped[key].count;
    // @ts-expect-error strict migration — TS2683
    totalValue += this._grouped[key].total;
  }, this);
  
  return {
    totalDays: keys.length,
    totalItems,
    totalValue,
    avgPerDay: keys.length > 0 ? totalValue / keys.length : 0
  };
};

TimelineViewManager.prototype._bindEvents = function() {
  const self = this;
  this._modal.addEventListener('click', (e: MouseEvent) => {
    const target = e.target as Element;
    if (target.classList.contains('p01-modal-overlay') || target.closest('[data-action="close"]')) {
      self.closeModal();
      return;
    }
    const item = target.closest('[data-id]') as HTMLElement | null;
    if (item) {
      self.onItemClick(item.dataset.id);
    }
  });
};

TimelineViewManager.prototype._formatNumber = (num: unknown) => {
  if (num === null || num === undefined) return '0,00';
  return parseFloat(String(num)).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

TimelineViewManager.prototype._truncate = (str: string, len: number) => {
  if (!str) return '';
  return str.length > len ? `${str.substring(0, len)}...` : str;
};

TimelineViewManager.prototype.closeModal = function() {
  const self = this;
  if (this._modal) {
    this._modal.classList.remove('open');
    setTimeout(() => {
      if (self._modal && self._modal.parentNode) self._modal.parentNode.removeChild(self._modal);
      self._modal = null;
    }, 200);
  }
};

TimelineViewManager.prototype.destroy = function() {
  this.closeModal();
  this._data = [];
  this._grouped = {};
};

export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION }; }
export default { TimelineViewManager, info, healthCheck };
