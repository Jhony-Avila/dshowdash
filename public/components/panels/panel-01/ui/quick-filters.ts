// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.4.0-P17WI-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-01/ui/quick-filters
// PURPOSE: Panel-01 - Quick Filters Chips
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   DEFAULT_CHIPS — exported value
//   QuickFiltersManager() — exported function
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
export const MODULE_ID = 'panel-01/ui/quick-filters';

export const DEFAULT_CHIPS = [
  { id: 'pendente', label: 'Pendente', filter: { situacao: 'Pendente' }, color: 'warning' },
  { id: 'aprovado', label: 'Aprovado', filter: { situacao: 'Aprovado' }, color: 'success' },
  { id: 'rejeitado', label: 'Rejeitado', filter: { situacao: 'Rejeitado' }, color: 'danger' },
  { id: 'em-analise', label: 'Em Análise', filter: { situacao: 'Em Análise' }, color: 'info' },
  { id: 'hoje', label: 'Hoje', filter: { periodo: 'hoje' }, color: 'primary' },
  { id: 'semana', label: 'Esta Semana', filter: { periodo: 'semana' }, color: 'primary' },
  { id: 'mes', label: 'Este Mês', filter: { periodo: 'mes' }, color: 'primary' }
];

export function QuickFiltersManager(this: any, container: HTMLElement, options: Record<string, unknown> = {}) {
  this.container = container;
  this.chips = options.chips || DEFAULT_CHIPS;
  this.onFilterSelect = options.onFilterSelect || (() => {});
  this.onFilterClear = options.onFilterClear || (() => {});
  this._activeChips = new Set();
  this._listener = null;
}

QuickFiltersManager.prototype.render = function() {
  if (!this.container) return;
  const self = this;
  let html = '<div class="p01-quick-filters">';
  html += '<span class="p01-quick-filters-label">Filtros rápidos:</span>';
  html += '<div class="p01-quick-filters-chips">';
  this.chips.forEach((chip: Record<string, unknown>) => {
    const activeClass = self._activeChips.has(chip.id) ? ' active' : '';
    html += `<button class="p01-chip p01-chip--${chip.color}${activeClass}" data-chip="${chip.id}" title="${chip.label}">`;
    html += `<span class="p01-chip-label">${chip.label}</span>`;
    html += `<span class="p01-chip-close" data-chip-close="${chip.id}">&times;</span>`;
    html += '</button>';
  });
  html += '</div>';
  html += '<button class="p01-quick-filters-clear" data-action="clear-chips" title="Limpar filtros">Limpar</button>';
  html += '</div>';
  this.container.innerHTML = html;
  this._bindEvents();
};

QuickFiltersManager.prototype._bindEvents = function() {
  const self = this;
  if (this._listener) this.container.removeEventListener('click', this._listener);
  this._listener = (e: MouseEvent) => {
    const chipBtn = (e.target as Element).closest('[data-chip]') as HTMLElement | null;
    const closeBtn = (e.target as Element).closest('[data-chip-close]') as HTMLElement | null;
    const clearBtn = (e.target as Element).closest('[data-action="clear-chips"]');
    if (closeBtn) {
      e.stopPropagation();
      self._removeChip(closeBtn.dataset.chipClose);
      return;
    }
    if (chipBtn && !closeBtn) {
      self._toggleChip(chipBtn.dataset.chip);
      return;
    }
    if (clearBtn) {
      self.clearAll();
    }
  };
  this.container.addEventListener('click', this._listener);
};

QuickFiltersManager.prototype._toggleChip = function(chipId: string | undefined) {
  const chip = this.chips.find((c: Record<string, unknown>) => c.id === chipId);
  if (!chip) return;
  if (this._activeChips.has(chipId)) {
    this._activeChips.delete(chipId);
    this.onFilterClear(chip.filter);
  } else {
    this._activeChips.add(chipId);
    this.onFilterSelect(chip.filter);
  }
  this._updateUI();
};

QuickFiltersManager.prototype._removeChip = function(chipId: string | undefined) {
  const chip = this.chips.find((c: Record<string, unknown>) => c.id === chipId);
  if (chip && this._activeChips.has(chipId)) {
    this._activeChips.delete(chipId);
    this.onFilterClear(chip.filter);
    this._updateUI();
  }
};

QuickFiltersManager.prototype._updateUI = function() {
  const self = this;
  this.container.querySelectorAll('[data-chip]').forEach((btn: Element) => {
    btn.classList.toggle('active', self._activeChips.has((btn as HTMLElement).dataset.chip));
  });
};

QuickFiltersManager.prototype.setActive = function(chipIds: string[]) {
  this._activeChips = new Set(chipIds);
  this._updateUI();
};

QuickFiltersManager.prototype.clearAll = function() {
  const self = this;
  this._activeChips.forEach((chipId: string) => {
    const chip = self.chips.find((c: Record<string, unknown>) => c.id === chipId);
    if (chip) self.onFilterClear(chip.filter);
  });
  this._activeChips.clear();
  this._updateUI();
};

QuickFiltersManager.prototype.getActive = function() {
  return Array.from(this._activeChips);
};

QuickFiltersManager.prototype.destroy = function() {
  if (this._listener && this.container) {
    this.container.removeEventListener('click', this._listener);
  }
  this._listener = null;
  this._activeChips.clear();
};

export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION }; }
export default { QuickFiltersManager, DEFAULT_CHIPS, info, healthCheck };
