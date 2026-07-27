const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-01/ui/quick-filters";
const DEFAULT_CHIPS = [
  { id: "pendente", label: "Pendente", filter: { situacao: "Pendente" }, color: "warning" },
  { id: "aprovado", label: "Aprovado", filter: { situacao: "Aprovado" }, color: "success" },
  { id: "rejeitado", label: "Rejeitado", filter: { situacao: "Rejeitado" }, color: "danger" },
  { id: "em-analise", label: "Em An\xE1lise", filter: { situacao: "Em An\xE1lise" }, color: "info" },
  { id: "hoje", label: "Hoje", filter: { periodo: "hoje" }, color: "primary" },
  { id: "semana", label: "Esta Semana", filter: { periodo: "semana" }, color: "primary" },
  { id: "mes", label: "Este M\xEAs", filter: { periodo: "mes" }, color: "primary" }
];
function QuickFiltersManager(container, options = {}) {
  this.container = container;
  this.chips = options.chips || DEFAULT_CHIPS;
  this.onFilterSelect = options.onFilterSelect || (() => {
  });
  this.onFilterClear = options.onFilterClear || (() => {
  });
  this._activeChips = /* @__PURE__ */ new Set();
  this._listener = null;
}
QuickFiltersManager.prototype.render = function() {
  if (!this.container) return;
  const self = this;
  let html = '<div class="p01-quick-filters">';
  html += '<span class="p01-quick-filters-label">Filtros r\xE1pidos:</span>';
  html += '<div class="p01-quick-filters-chips">';
  this.chips.forEach((chip) => {
    const activeClass = self._activeChips.has(chip.id) ? " active" : "";
    html += `<button class="p01-chip p01-chip--${chip.color}${activeClass}" data-chip="${chip.id}" title="${chip.label}">`;
    html += `<span class="p01-chip-label">${chip.label}</span>`;
    html += `<span class="p01-chip-close" data-chip-close="${chip.id}">&times;</span>`;
    html += "</button>";
  });
  html += "</div>";
  html += '<button class="p01-quick-filters-clear" data-action="clear-chips" title="Limpar filtros">Limpar</button>';
  html += "</div>";
  this.container.innerHTML = html;
  this._bindEvents();
};
QuickFiltersManager.prototype._bindEvents = function() {
  const self = this;
  if (this._listener) this.container.removeEventListener("click", this._listener);
  this._listener = (e) => {
    const chipBtn = e.target.closest("[data-chip]");
    const closeBtn = e.target.closest("[data-chip-close]");
    const clearBtn = e.target.closest('[data-action="clear-chips"]');
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
  this.container.addEventListener("click", this._listener);
};
QuickFiltersManager.prototype._toggleChip = function(chipId) {
  const chip = this.chips.find((c) => c.id === chipId);
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
QuickFiltersManager.prototype._removeChip = function(chipId) {
  const chip = this.chips.find((c) => c.id === chipId);
  if (chip && this._activeChips.has(chipId)) {
    this._activeChips.delete(chipId);
    this.onFilterClear(chip.filter);
    this._updateUI();
  }
};
QuickFiltersManager.prototype._updateUI = function() {
  const self = this;
  this.container.querySelectorAll("[data-chip]").forEach((btn) => {
    btn.classList.toggle("active", self._activeChips.has(btn.dataset.chip));
  });
};
QuickFiltersManager.prototype.setActive = function(chipIds) {
  this._activeChips = new Set(chipIds);
  this._updateUI();
};
QuickFiltersManager.prototype.clearAll = function() {
  const self = this;
  this._activeChips.forEach((chipId) => {
    const chip = self.chips.find((c) => c.id === chipId);
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
    this.container.removeEventListener("click", this._listener);
  }
  this._listener = null;
  this._activeChips.clear();
};
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION };
}
var quick_filters_default = { QuickFiltersManager, DEFAULT_CHIPS, info, healthCheck };
export {
  DEFAULT_CHIPS,
  MODULE_ID,
  QuickFiltersManager,
  VERSION,
  quick_filters_default as default,
  healthCheck,
  info
};
