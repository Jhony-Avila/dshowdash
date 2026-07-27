const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-01/ui/filter-presets";
const PRESET_SVGS = {
  calendar: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>',
  calendarRange: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><path d="M8 14h.01"/><path d="M12 14h.01"/><path d="M16 14h.01"/></svg>',
  clock: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
  check: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
  dollarSign: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>',
  bookmark: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m19 21-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>',
  star: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>',
  mapPin: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>',
  target: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>',
  briefcase: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>',
  barChart: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/></svg>',
  flame: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>',
  gem: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="6 3 18 3 22 9 12 22 2 9"/><line x1="12" y1="22" x2="12" y2="9"/><path d="m2 9 10 0"/><path d="m22 9-10 0"/><path d="m6 3 6 6"/><path d="m18 3-6 6"/></svg>',
  settings: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>',
  x: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>'
};
const DEFAULT_PRESETS = [
  { id: "today", name: "Hoje", icon: "calendar", filters: { periodo: "hoje" }, system: true },
  { id: "week", name: "Esta Semana", icon: "calendarRange", filters: { periodo: "semana" }, system: true },
  { id: "pending", name: "Pendentes", icon: "clock", filters: { situacao: "Pendente" }, system: true },
  { id: "approved", name: "Aprovados", icon: "check", filters: { situacao: "Aprovado" }, system: true },
  { id: "high-value", name: "Alto Valor", icon: "dollarSign", filters: { valor_min: 1e4 }, system: true }
];
const ICON_OPTIONS = ["bookmark", "star", "mapPin", "target", "briefcase", "barChart", "flame", "gem"];
function _getIconSvg(iconId) {
  return PRESET_SVGS[iconId] || PRESET_SVGS.bookmark;
}
function FilterPresetsManager(options = {}) {
  this.storageKey = options.storageKey || "p01_filter_presets";
  this.onApply = options.onApply || (() => {
  });
  this.onChange = options.onChange || (() => {
  });
  this._presets = [];
  this._modal = null;
  this._loadPresets();
}
FilterPresetsManager.prototype._loadPresets = function() {
  try {
    const saved = localStorage.getItem(this.storageKey);
    this._presets = saved ? JSON.parse(saved) : [];
  } catch (e) {
    this._presets = [];
  }
};
FilterPresetsManager.prototype._savePresets = function() {
  try {
    localStorage.setItem(this.storageKey, JSON.stringify(this._presets));
  } catch (e) {
  }
  this.onChange(this.getAllPresets());
};
FilterPresetsManager.prototype.getAllPresets = function() {
  return DEFAULT_PRESETS.concat(this._presets);
};
FilterPresetsManager.prototype.getUserPresets = function() {
  return this._presets.slice();
};
FilterPresetsManager.prototype.getPreset = function(id) {
  return this.getAllPresets().find((p) => p.id === id);
};
FilterPresetsManager.prototype.savePreset = function(name, filters, icon) {
  const preset = { id: `preset_${Date.now()}`, name, icon: icon || "bookmark", filters, system: false, createdAt: Date.now() };
  this._presets.push(preset);
  this._savePresets();
  return preset;
};
FilterPresetsManager.prototype.updatePreset = function(id, updates) {
  const preset = this._presets.find((p) => p.id === id);
  if (preset) {
    Object.assign(preset, updates);
    this._savePresets();
  }
};
FilterPresetsManager.prototype.deletePreset = function(id) {
  this._presets = this._presets.filter((p) => p.id !== id);
  this._savePresets();
};
FilterPresetsManager.prototype.applyPreset = function(id) {
  const preset = this.getPreset(id);
  if (preset) {
    this.onApply(preset.filters, preset);
  }
};
FilterPresetsManager.prototype.render = function(container) {
  const self = this;
  if (!container) return;
  const presets = this.getAllPresets();
  let html = `<div class="p01-filter-presets"><div class="p01-presets-header"><span>Filtros Salvos</span><button class="p01-presets-manage" data-action="manage">${PRESET_SVGS.settings}</button></div><div class="p01-presets-list">`;
  presets.forEach((preset) => {
    html += `<button class="p01-preset-btn" data-preset="${preset.id}" title="${preset.name}"><span class="p01-preset-icon">${_getIconSvg(preset.icon)}</span><span class="p01-preset-name">${preset.name}</span></button>`;
  });
  html += "</div></div>";
  container.innerHTML = html;
  container.querySelectorAll("[data-preset]").forEach((btn) => {
    btn.addEventListener("click", () => {
      self.applyPreset(btn.dataset.preset);
    });
  });
  const manageBtn = container.querySelector('[data-action="manage"]');
  if (manageBtn) {
    manageBtn.addEventListener("click", () => {
      self.openModal();
    });
  }
};
FilterPresetsManager.prototype.openSaveModal = function(currentFilters) {
  const self = this;
  this._modal = document.createElement("div");
  this._modal.className = "p01-modal-overlay";
  const iconPickerHtml = ICON_OPTIONS.map((iconId) => `<button class="p01-icon-option" data-icon="${iconId}">${_getIconSvg(iconId)}</button>`).join("");
  this._modal.innerHTML = `<div class="p01-modal p01-modal--sm"><div class="p01-modal-header"><h2>Salvar Filtro</h2><button class="p01-modal-close" data-action="close">${PRESET_SVGS.x}</button></div><div class="p01-modal-body"><div class="p01-form-group"><label>Nome do Filtro</label><input type="text" class="p01-input" data-input="name" placeholder="Ex: Meus Pendentes"></div><div class="p01-form-group"><label>\xCDcone</label><div class="p01-icon-picker">${iconPickerHtml}</div></div><div class="p01-form-group"><label>Filtros Ativos</label><pre class="p01-filters-preview">${JSON.stringify(currentFilters, null, 2)}</pre></div></div><div class="p01-modal-footer"><button class="p01-btn p01-btn--secondary" data-action="close">Cancelar</button><button class="p01-btn p01-btn--primary" data-action="save">Salvar</button></div></div>`;
  document.body.appendChild(this._modal);
  let selectedIcon = "bookmark";
  this._modal.querySelectorAll("[data-icon]").forEach((btn) => {
    btn.addEventListener("click", () => {
      self._modal.querySelectorAll("[data-icon]").forEach((b) => {
        b.classList.remove("selected");
      });
      btn.classList.add("selected");
      selectedIcon = btn.dataset.icon;
    });
  });
  this._modal.querySelector('[data-icon="bookmark"]').classList.add("selected");
  this._modal.querySelector('[data-action="save"]').addEventListener("click", () => {
    const name = self._modal.querySelector('[data-input="name"]').value.trim();
    if (name) {
      self.savePreset(name, currentFilters, selectedIcon);
      self.closeModal();
    }
  });
  this._modal.querySelectorAll('[data-action="close"]').forEach((btn) => {
    btn.addEventListener("click", () => {
      self.closeModal();
    });
  });
  this._modal.addEventListener("click", (e) => {
    if (e.target.classList.contains("p01-modal-overlay")) self.closeModal();
  });
  setTimeout(() => {
    self._modal.classList.add("open");
  }, 10);
};
FilterPresetsManager.prototype.openModal = function() {
  const self = this;
  this._modal = document.createElement("div");
  this._modal.className = "p01-modal-overlay";
  const presetsHtml = this._presets.length === 0 ? '<p class="p01-presets-empty">Nenhum filtro personalizado salvo</p>' : this._presets.map((preset) => `<div class="p01-preset-manage-item" data-id="${preset.id}"><span class="p01-preset-icon">${_getIconSvg(preset.icon)}</span><span class="p01-preset-name">${preset.name}</span><span class="p01-preset-date">${new Date(preset.createdAt).toLocaleDateString("pt-BR")}</span><button class="p01-preset-delete" data-action="delete">${PRESET_SVGS.x}</button></div>`).join("");
  this._modal.innerHTML = `<div class="p01-modal p01-modal--md"><div class="p01-modal-header"><h2>Gerenciar Filtros Salvos</h2><button class="p01-modal-close" data-action="close">${PRESET_SVGS.x}</button></div><div class="p01-modal-body"><div class="p01-presets-manage-list">${presetsHtml}</div></div><div class="p01-modal-footer"><button class="p01-btn p01-btn--secondary" data-action="close">Fechar</button></div></div>`;
  document.body.appendChild(this._modal);
  this._modal.querySelectorAll('[data-action="delete"]').forEach((btn) => {
    btn.addEventListener("click", () => {
      const item = btn.closest("[data-id]");
      self.deletePreset(item.dataset.id);
      item.remove();
    });
  });
  this._modal.querySelectorAll('[data-action="close"]').forEach((btn) => {
    btn.addEventListener("click", () => {
      self.closeModal();
    });
  });
  this._modal.addEventListener("click", (e) => {
    if (e.target.classList.contains("p01-modal-overlay")) self.closeModal();
  });
  setTimeout(() => {
    self._modal.classList.add("open");
  }, 10);
};
FilterPresetsManager.prototype.closeModal = function() {
  const self = this;
  if (this._modal) {
    this._modal.classList.remove("open");
    setTimeout(() => {
      if (self._modal && self._modal.parentNode) self._modal.parentNode.removeChild(self._modal);
      self._modal = null;
    }, 200);
  }
};
FilterPresetsManager.prototype.destroy = function() {
  this.closeModal();
  this._presets = [];
};
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION };
}
var filter_presets_default = { FilterPresetsManager, DEFAULT_PRESETS, PRESET_SVGS, info, healthCheck };
export {
  DEFAULT_PRESETS,
  FilterPresetsManager,
  MODULE_ID,
  VERSION,
  filter_presets_default as default,
  healthCheck,
  info
};
