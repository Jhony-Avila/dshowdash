import { createPanelPorts } from "/core/runtime/ports-profiles.js";
const VERSION = "10.2.0-MIGRATION-PHASE4";
const MODULE_ID = "panel-nav-admin.ui.filters.date-range";
const Ports = createPanelPorts({ moduleId: MODULE_ID });
function injectPorts(p) {
  return Ports.inject(p);
}
const _log = (level, ...args) => {
  const logger = Ports.get("logger");
  if (!logger) return;
  const prefix = "[DateRangeFilter]";
  if (level === "error") logger.error?.(prefix, ...args);
  else if (level === "warn") logger.warn?.(prefix, ...args);
  else if (level === "debug") logger.debug?.(prefix, ...args);
  else logger.info?.(prefix, ...args);
};
const PRESETS = {
  today: {
    label: "Hoje",
    getRange() {
      const now = /* @__PURE__ */ new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const end = new Date(start);
      end.setHours(23, 59, 59, 999);
      return { start, end };
    }
  },
  last7days: {
    label: "\xDAltimos 7 dias",
    getRange() {
      const end = /* @__PURE__ */ new Date();
      end.setHours(23, 59, 59, 999);
      const start = new Date(end);
      start.setDate(start.getDate() - 7);
      start.setHours(0, 0, 0, 0);
      return { start, end };
    }
  },
  last30days: {
    label: "\xDAltimos 30 dias",
    getRange() {
      const end = /* @__PURE__ */ new Date();
      end.setHours(23, 59, 59, 999);
      const start = new Date(end);
      start.setDate(start.getDate() - 30);
      start.setHours(0, 0, 0, 0);
      return { start, end };
    }
  },
  thisMonth: {
    label: "Este m\xEAs",
    getRange() {
      const now = /* @__PURE__ */ new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      return { start, end };
    }
  },
  lastMonth: {
    label: "M\xEAs passado",
    getRange() {
      const now = /* @__PURE__ */ new Date();
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
      return { start, end };
    }
  },
  thisYear: {
    label: "Este ano",
    getRange() {
      const now = /* @__PURE__ */ new Date();
      const start = new Date(now.getFullYear(), 0, 1);
      const end = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
      return { start, end };
    }
  }
};
function DateRangeFilter(options = {}) {
  const container = options.container;
  const onChange = options.onChange;
  const field = options.field || "createdAt";
  let _start = null;
  let _end = null;
  let _activePreset = null;
  let _field = field;
  let _el = null;
  function render() {
    if (!container) return;
    const presetButtons = Object.entries(PRESETS).map(([key, preset]) => {
      const activeClass = _activePreset === key ? " pna-date-range__preset--active" : "";
      return `<button type="button" class="pna-date-range__preset${activeClass}" data-preset="${key}">${preset.label}</button>`;
    }).join("");
    const startVal = _start ? _formatDateInput(_start) : "";
    const endVal = _end ? _formatDateInput(_end) : "";
    const html = `
      <div class="pna-date-range" data-filter-type="date-range">
        <div class="pna-date-range__header">
          <span class="pna-date-range__label">Intervalo de datas</span>
          <select class="pna-date-range__field-select" data-action="change-field">
            <option value="createdAt"${_field === "createdAt" ? " selected" : ""}>Data de cria\xE7\xE3o</option>
            <option value="updatedAt"${_field === "updatedAt" ? " selected" : ""}>Data de modifica\xE7\xE3o</option>
          </select>
        </div>
        <div class="pna-date-range__presets">${presetButtons}</div>
        <div class="pna-date-range__inputs">
          <label class="pna-date-range__input-group">
            <span>De</span>
            <input type="date" class="pna-date-range__input" data-action="start-date" value="${startVal}" />
          </label>
          <label class="pna-date-range__input-group">
            <span>At\xE9</span>
            <input type="date" class="pna-date-range__input" data-action="end-date" value="${endVal}" />
          </label>
          <button type="button" class="pna-date-range__clear" data-action="clear-date-range" title="Limpar intervalo">&times;</button>
        </div>
      </div>
    `;
    if (!_el) {
      _el = document.createElement("div");
      _el.className = "pna-date-range-wrapper";
      container.appendChild(_el);
    }
    _el.innerHTML = html;
    _bindEvents();
  }
  function _bindEvents() {
    if (!_el) return;
    _el.addEventListener("click", (e) => {
      const presetBtn = e.target.closest("[data-preset]");
      if (presetBtn) {
        const key = presetBtn.dataset.preset || "";
        _applyPreset(key);
        return;
      }
      const clearBtn = e.target.closest('[data-action="clear-date-range"]');
      if (clearBtn) {
        clear();
        return;
      }
    });
    _el.addEventListener("change", (e) => {
      const fieldSelect = e.target.closest('[data-action="change-field"]');
      if (fieldSelect) {
        _field = fieldSelect.value;
        _notify();
        return;
      }
      const startInput = e.target.closest('[data-action="start-date"]');
      if (startInput) {
        _start = startInput.value ? /* @__PURE__ */ new Date(startInput.value + "T00:00:00") : null;
        _activePreset = null;
        _notify();
        return;
      }
      const endInput = e.target.closest('[data-action="end-date"]');
      if (endInput) {
        _end = endInput.value ? /* @__PURE__ */ new Date(endInput.value + "T23:59:59.999") : null;
        _activePreset = null;
        _notify();
        return;
      }
    });
  }
  function _applyPreset(key) {
    const preset = PRESETS[key];
    if (!preset) return;
    const range = preset.getRange();
    _start = range.start;
    _end = range.end;
    _activePreset = key;
    render();
    _notify();
  }
  function _notify() {
    if (typeof onChange === "function") {
      onChange({ start: _start, end: _end, field: _field, presetKey: _activePreset });
    }
  }
  function _formatDateInput(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  function apply(items) {
    if (!_start && !_end) return items;
    return items.filter((item) => {
      const dateStr = item[_field];
      if (!dateStr) return false;
      const itemDate = new Date(dateStr);
      if (_start && itemDate < _start) return false;
      if (_end && itemDate > _end) return false;
      return true;
    });
  }
  function getValues() {
    if (!_start && !_end) return null;
    return { start: _start, end: _end, field: _field, presetKey: _activePreset };
  }
  function setValues(range) {
    _start = range.start ? new Date(range.start) : null;
    _end = range.end ? new Date(range.end) : null;
    if (range.field) _field = range.field;
    _activePreset = range.presetKey || null;
    render();
  }
  function isActive() {
    return !!(_start || _end);
  }
  function clear() {
    _start = null;
    _end = null;
    _activePreset = null;
    render();
    _notify();
  }
  function destroy() {
    if (_el && _el.parentNode) {
      _el.parentNode.removeChild(_el);
    }
    _el = null;
    _start = null;
    _end = null;
  }
  return { render, apply, getValues, setValues, isActive, clear, destroy };
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, presetsCount: Object.keys(PRESETS).length };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION };
}
var date_range_default = { DateRangeFilter, PRESETS, injectPorts, info, healthCheck, VERSION, MODULE_ID };
export {
  DateRangeFilter,
  MODULE_ID,
  PRESETS,
  VERSION,
  date_range_default as default,
  healthCheck,
  info,
  injectPorts
};
