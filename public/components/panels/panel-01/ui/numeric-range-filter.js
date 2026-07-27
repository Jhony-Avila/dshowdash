const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-01/ui/numeric-range-filter";
function NumericRangeFilter(container, options = {}) {
  this.container = container;
  this.field = options.field || "valor_total";
  this.label = options.label || "Valor";
  this.min = options.min || 0;
  this.max = options.max || 1e5;
  this.step = options.step || 100;
  this.prefix = options.prefix || "R$";
  this.onChange = options.onChange || (() => {
  });
  this._minValue = this.min;
  this._maxValue = this.max;
  this._dragging = null;
  this._dragAbortController = null;
}
NumericRangeFilter.prototype.init = function() {
  this._render();
  this._bindEvents();
};
NumericRangeFilter.prototype.setRange = function(dataMin, dataMax) {
  this.min = dataMin;
  this.max = dataMax;
  this._minValue = dataMin;
  this._maxValue = dataMax;
  this._render();
  this._bindEvents();
};
NumericRangeFilter.prototype._render = function() {
  if (!this.container) return;
  const minPercent = (this._minValue - this.min) / (this.max - this.min) * 100;
  const maxPercent = (this._maxValue - this.min) / (this.max - this.min) * 100;
  this.container.innerHTML = `<div class="p01-range-filter"><div class="p01-range-header"><span class="p01-range-label">${this.label}</span><span class="p01-range-values">${this._formatValue(this._minValue)} - ${this._formatValue(this._maxValue)}</span></div><div class="p01-range-inputs"><input type="number" class="p01-input p01-input--sm" data-input="min" value="${this._minValue}" min="${this.min}" max="${this.max}" step="${this.step}"><span class="p01-range-separator">at\xE9</span><input type="number" class="p01-input p01-input--sm" data-input="max" value="${this._maxValue}" min="${this.min}" max="${this.max}" step="${this.step}"></div><div class="p01-range-slider"><div class="p01-range-track"></div><div class="p01-range-selected" style="left: ${minPercent}%; right: ${100 - maxPercent}%"></div><div class="p01-range-handle p01-range-handle--min" style="left: ${minPercent}%" data-handle="min"></div><div class="p01-range-handle p01-range-handle--max" style="left: ${maxPercent}%" data-handle="max"></div></div><div class="p01-range-presets"><button class="p01-range-preset" data-preset="all">Todos</button><button class="p01-range-preset" data-preset="low">Baixo</button><button class="p01-range-preset" data-preset="medium">M\xE9dio</button><button class="p01-range-preset" data-preset="high">Alto</button></div></div>`;
};
NumericRangeFilter.prototype._bindEvents = function() {
  const self = this;
  this._onMouseMove = function(e) {
    if (!self._dragging) return;
    const slider = self.container.querySelector(".p01-range-slider");
    const rect = slider.getBoundingClientRect();
    const percent = Math.max(0, Math.min(100, (e.clientX - rect.left) / rect.width * 100));
    let value = self.min + percent / 100 * (self.max - self.min);
    value = Math.round(value / self.step) * self.step;
    if (self._dragging === "min") {
      self._minValue = Math.min(value, self._maxValue - self.step);
    } else {
      self._maxValue = Math.max(value, self._minValue + self.step);
    }
    self._updateUI();
  };
  this._onMouseUp = function() {
    if (self._dragging) {
      self._dragging = null;
      self._triggerChange();
    }
    if (self._dragAbortController) {
      self._dragAbortController.abort();
      self._dragAbortController = null;
    }
  };
  this.container.querySelector('[data-input="min"]').addEventListener("change", (e) => {
    const val = parseFloat(e.target.value) || self.min;
    self._minValue = Math.max(self.min, Math.min(val, self._maxValue));
    self._update();
  });
  this.container.querySelector('[data-input="max"]').addEventListener("change", (e) => {
    const val = parseFloat(e.target.value) || self.max;
    self._maxValue = Math.min(self.max, Math.max(val, self._minValue));
    self._update();
  });
  const handles = this.container.querySelectorAll("[data-handle]");
  handles.forEach((handle) => {
    handle.addEventListener("mousedown", (e) => {
      e.preventDefault();
      self._dragging = handle.dataset.handle;
      if (self._dragAbortController) {
        self._dragAbortController.abort();
      }
      self._dragAbortController = new AbortController();
      document.addEventListener("mousemove", self._onMouseMove, { signal: self._dragAbortController.signal });
      document.addEventListener("mouseup", self._onMouseUp, { signal: self._dragAbortController.signal });
    });
  });
  this.container.querySelectorAll("[data-preset]").forEach((btn) => {
    btn.addEventListener("click", () => {
      self._applyPreset(btn.dataset.preset);
    });
  });
};
NumericRangeFilter.prototype._applyPreset = function(preset) {
  const range = this.max - this.min;
  switch (preset) {
    case "all":
      this._minValue = this.min;
      this._maxValue = this.max;
      break;
    case "low":
      this._minValue = this.min;
      this._maxValue = this.min + range * 0.33;
      break;
    case "medium":
      this._minValue = this.min + range * 0.33;
      this._maxValue = this.min + range * 0.66;
      break;
    case "high":
      this._minValue = this.min + range * 0.66;
      this._maxValue = this.max;
      break;
  }
  this._update();
};
NumericRangeFilter.prototype._update = function() {
  this._updateUI();
  this._triggerChange();
};
NumericRangeFilter.prototype._updateUI = function() {
  const minPercent = (this._minValue - this.min) / (this.max - this.min) * 100;
  const maxPercent = (this._maxValue - this.min) / (this.max - this.min) * 100;
  this.container.querySelector('[data-input="min"]').value = this._minValue;
  this.container.querySelector('[data-input="max"]').value = this._maxValue;
  this.container.querySelector(".p01-range-values").textContent = `${this._formatValue(this._minValue)} - ${this._formatValue(this._maxValue)}`;
  this.container.querySelector(".p01-range-selected").style.left = `${minPercent}%`;
  this.container.querySelector(".p01-range-selected").style.right = `${100 - maxPercent}%`;
  this.container.querySelector('[data-handle="min"]').style.left = `${minPercent}%`;
  this.container.querySelector('[data-handle="max"]').style.left = `${maxPercent}%`;
};
NumericRangeFilter.prototype._triggerChange = function() {
  this.onChange({
    field: this.field,
    min: this._minValue,
    max: this._maxValue
  });
};
NumericRangeFilter.prototype._formatValue = function(value) {
  return `${this.prefix} ${value.toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
};
NumericRangeFilter.prototype.getValue = function() {
  return { min: this._minValue, max: this._maxValue };
};
NumericRangeFilter.prototype.setValue = function(min, max) {
  this._minValue = min;
  this._maxValue = max;
  this._updateUI();
};
NumericRangeFilter.prototype.reset = function() {
  this._minValue = this.min;
  this._maxValue = this.max;
  this._update();
};
NumericRangeFilter.prototype.destroy = function() {
  if (this._dragAbortController) {
    this._dragAbortController.abort();
    this._dragAbortController = null;
  }
  this._dragging = null;
  this._onMouseMove = null;
  this._onMouseUp = null;
  if (this.container) this.container.innerHTML = "";
};
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION };
}
var numeric_range_filter_default = { NumericRangeFilter, info, healthCheck };
export {
  MODULE_ID,
  NumericRangeFilter,
  VERSION,
  numeric_range_filter_default as default,
  healthCheck,
  info
};
