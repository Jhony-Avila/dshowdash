const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-01/ui/multi-select-filter";
const CHEVRON_SVG = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>';
function MultiSelectFilter(options = {}) {
  options = options || {};
  this.container = options.container || null;
  this.field = options.field || "situacao";
  this.label = options.label || "Filtro";
  this.placeholder = options.placeholder || "Selecione...";
  this.options = options.options || [];
  this.onChange = options.onChange || (() => {
  });
  this.searchable = options.searchable !== false;
  this.maxDisplay = options.maxDisplay || 3;
  this._selected = /* @__PURE__ */ new Set();
  this._dropdown = null;
  this._visible = false;
  this._searchQuery = "";
  this._abortController = null;
}
MultiSelectFilter.prototype.init = function() {
  if (this.container) {
    this._render();
    this._bindEvents();
  }
};
MultiSelectFilter.prototype.setContainer = function(container) {
  this.container = container;
  this.init();
};
MultiSelectFilter.prototype.setOptions = function(opts) {
  this.options = opts;
  if (this._visible) this._renderDropdown();
};
MultiSelectFilter.prototype.setOptionsFromData = function(data, field) {
  const self = this;
  const uniqueValues = /* @__PURE__ */ new Set();
  data.forEach((item) => {
    const value = item[field] || item[self._capitalizeFirst(field)];
    if (value) uniqueValues.add(value);
  });
  this.options = Array.from(uniqueValues).sort().map((value) => ({
    value,
    label: value
  }));
};
MultiSelectFilter.prototype._capitalizeFirst = (str) => str.charAt(0).toUpperCase() + str.slice(1);
MultiSelectFilter.prototype._render = function() {
  if (!this.container) return;
  this.container.innerHTML = `<div class="p01-multi-select"><label class="p01-multi-select-label">${this.label}</label><div class="p01-multi-select-trigger" data-action="toggle"><span class="p01-multi-select-text">${this._getDisplayText()}</span><span class="p01-multi-select-count" style="display: none">0</span><span class="p01-multi-select-arrow">${CHEVRON_SVG}</span></div><div class="p01-multi-select-dropdown" style="display: none"></div></div>`;
  this._dropdown = this.container.querySelector(".p01-multi-select-dropdown");
  this._updateDisplay();
};
MultiSelectFilter.prototype._renderDropdown = function() {
  const self = this;
  let filteredOptions = this.options;
  if (this._searchQuery) {
    const query = this._searchQuery.toLowerCase();
    filteredOptions = this.options.filter((opt) => opt.label.toLowerCase().indexOf(query) !== -1);
  }
  let html = "";
  if (this.searchable) {
    html += `<div class="p01-multi-select-search"><input type="text" class="p01-input p01-input--sm" data-input="search" placeholder="Buscar..." value="${this._searchQuery}"></div>`;
  }
  html += '<div class="p01-multi-select-actions"><button class="p01-multi-select-action" data-action="select-all">Todos</button><button class="p01-multi-select-action" data-action="select-none">Nenhum</button></div>';
  html += '<div class="p01-multi-select-options">';
  if (filteredOptions.length === 0) {
    html += '<div class="p01-multi-select-empty">Nenhuma op\xE7\xE3o encontrada</div>';
  } else {
    filteredOptions.forEach((opt) => {
      const checked = self._selected.has(opt.value) ? "checked" : "";
      html += `<label class="p01-multi-select-option"><input type="checkbox" value="${self._escapeHtml(opt.value)}" ${checked}><span class="p01-multi-select-checkbox"></span><span class="p01-multi-select-option-label">${self._escapeHtml(opt.label)}</span>${opt.count !== void 0 ? `<span class="p01-multi-select-option-count">${opt.count}</span>` : ""}</label>`;
    });
  }
  html += "</div>";
  html += '<div class="p01-multi-select-footer"><button class="p01-btn p01-btn--secondary p01-btn--sm" data-action="clear">Limpar</button><button class="p01-btn p01-btn--primary p01-btn--sm" data-action="apply">Aplicar</button></div>';
  this._dropdown.innerHTML = html;
  this._bindDropdownEvents();
};
MultiSelectFilter.prototype._bindEvents = function() {
  const self = this;
  const trigger = this.container.querySelector('[data-action="toggle"]');
  if (trigger) {
    trigger.addEventListener("click", () => {
      self.toggle();
    });
  }
  this._abortController = new AbortController();
  this._documentClickHandler = (e) => {
    if (self._visible && self.container && !self.container.contains(e.target)) {
      self.hide();
    }
  };
  document.addEventListener("click", this._documentClickHandler, { signal: this._abortController.signal });
};
MultiSelectFilter.prototype._bindDropdownEvents = function() {
  const self = this;
  const searchInput = this._dropdown.querySelector('[data-input="search"]');
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      self._searchQuery = e.target.value;
      self._renderDropdown();
      self._dropdown.querySelector('[data-input="search"]').focus();
    });
  }
  this._dropdown.querySelectorAll(".p01-multi-select-option input").forEach((checkbox) => {
    const cb = checkbox;
    cb.addEventListener("change", () => {
      if (cb.checked) {
        self._selected.add(cb.value);
      } else {
        self._selected.delete(cb.value);
      }
      self._updateDisplay();
    });
  });
  const selectAll = this._dropdown.querySelector('[data-action="select-all"]');
  if (selectAll) selectAll.addEventListener("click", () => {
    self.options.forEach((opt) => {
      self._selected.add(opt.value);
    });
    self._renderDropdown();
    self._updateDisplay();
  });
  const selectNone = this._dropdown.querySelector('[data-action="select-none"]');
  if (selectNone) selectNone.addEventListener("click", () => {
    self._selected.clear();
    self._renderDropdown();
    self._updateDisplay();
  });
  const clearBtn = this._dropdown.querySelector('[data-action="clear"]');
  if (clearBtn) clearBtn.addEventListener("click", () => {
    self._selected.clear();
    self._updateDisplay();
    self.hide();
    self._triggerChange();
  });
  const applyBtn = this._dropdown.querySelector('[data-action="apply"]');
  if (applyBtn) applyBtn.addEventListener("click", () => {
    self.hide();
    self._triggerChange();
  });
};
MultiSelectFilter.prototype._getDisplayText = function() {
  if (this._selected.size === 0) return this.placeholder;
  const selected = Array.from(this._selected);
  if (selected.length <= this.maxDisplay) return selected.join(", ");
  return `${selected.slice(0, this.maxDisplay).join(", ")} +${selected.length - this.maxDisplay}`;
};
MultiSelectFilter.prototype._updateDisplay = function() {
  if (!this.container) return;
  const text = this.container.querySelector(".p01-multi-select-text");
  const count = this.container.querySelector(".p01-multi-select-count");
  if (text) text.textContent = this._getDisplayText();
  if (count) {
    if (this._selected.size > 0) {
      count.textContent = this._selected.size;
      count.style.display = "inline-flex";
    } else {
      count.style.display = "none";
    }
  }
};
MultiSelectFilter.prototype._triggerChange = function() {
  this.onChange({ field: this.field, values: Array.from(this._selected) });
};
MultiSelectFilter.prototype._escapeHtml = (str) => {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
};
MultiSelectFilter.prototype.show = function() {
  if (!this._dropdown) return;
  this._searchQuery = "";
  this._renderDropdown();
  this._dropdown.style.display = "block";
  this._visible = true;
  if (this.searchable) {
    const searchInput = this._dropdown.querySelector('[data-input="search"]');
    if (searchInput) searchInput.focus();
  }
};
MultiSelectFilter.prototype.hide = function() {
  if (this._dropdown) this._dropdown.style.display = "none";
  this._visible = false;
};
MultiSelectFilter.prototype.toggle = function() {
  if (this._visible) this.hide();
  else this.show();
};
MultiSelectFilter.prototype.getValue = function() {
  return Array.from(this._selected);
};
MultiSelectFilter.prototype.setValue = function(values) {
  this._selected = new Set(values);
  this._updateDisplay();
};
MultiSelectFilter.prototype.reset = function() {
  this._selected.clear();
  this._updateDisplay();
  this._triggerChange();
};
MultiSelectFilter.prototype.destroy = function() {
  if (this._abortController) {
    this._abortController.abort();
    this._abortController = null;
    this._documentClickHandler = null;
  }
  if (this.container) this.container.innerHTML = "";
  this._selected.clear();
  this._dropdown = null;
  this._visible = false;
};
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION };
}
var multi_select_filter_default = { MultiSelectFilter, info, healthCheck };
export {
  MODULE_ID,
  MultiSelectFilter,
  VERSION,
  multi_select_filter_default as default,
  healthCheck,
  info
};
