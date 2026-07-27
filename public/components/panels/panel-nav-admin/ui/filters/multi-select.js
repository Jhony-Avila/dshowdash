import { createPanelPorts } from "/core/runtime/ports-profiles.js";
import { PERMISSION_LEVELS } from "../../core/contracts.js";
const VERSION = "10.2.0-MIGRATION-PHASE4";
const MODULE_ID = "panel-nav-admin.ui.filters.multi-select";
const Ports = createPanelPorts({ moduleId: MODULE_ID });
function injectPorts(p) {
  return Ports.inject(p);
}
const DIMENSIONS = {
  context: {
    label: "Contexto",
    field: "context",
    options: [
      { value: "sidebar", label: "Sidebar" },
      { value: "navrail", label: "Nav Rail" },
      { value: "header", label: "Header" },
      { value: "footer", label: "Footer" }
    ]
  },
  section: {
    label: "Se\xE7\xE3o",
    field: "section",
    dynamic: true
  },
  status: {
    label: "Status",
    field: "isActive",
    options: [
      { value: "true", label: "Ativo" },
      { value: "false", label: "Inativo" }
    ]
  },
  permissionLevel: {
    label: "N\xEDvel de Permiss\xE3o",
    field: "minLevel",
    options: PERMISSION_LEVELS.map((pl) => ({
      value: String(pl.value),
      label: `${pl.label} (${pl.value})`
    }))
  },
  isDivider: {
    label: "Tipo",
    field: "isDivider",
    options: [
      { value: "false", label: "Item" },
      { value: "true", label: "Divisor" }
    ]
  }
};
function MultiSelectFilter(options = {}) {
  const container = options.container;
  const onChange = options.onChange;
  const dimension = options.dimension;
  const dynamicOptions = options.dynamicOptions;
  const config = DIMENSIONS[dimension];
  if (!config) throw new Error(`Unknown dimension: ${dimension}`);
  let _selected = /* @__PURE__ */ new Set();
  let _options = config.dynamic ? dynamicOptions || [] : config.options || [];
  let _el = null;
  function render() {
    if (!container) return;
    const checkboxes = _options.map((opt) => {
      const checked = _selected.has(String(opt.value)) ? " checked" : "";
      return `
        <label class="pna-checkbox pna-checkbox--bulk pna-multi-select__option">
          <input type="checkbox" class="pna-checkbox__input" value="${opt.value}" data-dimension="${dimension}"${checked} />
          <span class="pna-checkbox__box"><svg class="pna-checkbox__check" viewBox="0 0 14 14" fill="none"><path class="pna-checkbox__path" d="M2.5 7.5L5.5 10.5L11.5 3.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg><svg class="pna-checkbox__dash" viewBox="0 0 14 14" fill="none"><path d="M3 7H11" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg><span class="pna-checkbox__ripple"></span></span>
          <span class="pna-checkbox__label pna-multi-select__label">${opt.label}</span>
        </label>`;
    }).join("");
    const selectedCount = _selected.size > 0 ? ` (${_selected.size})` : "";
    const html = `
      <div class="pna-multi-select" data-filter-type="multi-select" data-dimension="${dimension}">
        <div class="pna-multi-select__header">
          <span class="pna-multi-select__title">${config.label}${selectedCount}</span>
          ${_selected.size > 0 ? '<button type="button" class="pna-multi-select__clear" data-action="clear-multi">&times;</button>' : ""}
        </div>
        <div class="pna-multi-select__body">${checkboxes}</div>
      </div>
    `;
    if (!_el) {
      _el = document.createElement("div");
      _el.className = "pna-multi-select-wrapper";
      container.appendChild(_el);
    }
    _el.innerHTML = html;
    _bindEvents();
  }
  function _bindEvents() {
    if (!_el) return;
    _el.addEventListener("change", (e) => {
      const checkbox = e.target.closest('input[type="checkbox"]');
      if (!checkbox) return;
      const val = String(checkbox.value);
      if (checkbox.checked) {
        _selected.add(val);
      } else {
        _selected.delete(val);
      }
      _updateHeader();
      _notify();
    });
    _el.addEventListener("click", (e) => {
      if (e.target.closest('[data-action="clear-multi"]')) {
        clear();
      }
    });
  }
  function _updateHeader() {
    const title = _el?.querySelector(".pna-multi-select__title");
    if (title) {
      const count = _selected.size > 0 ? ` (${_selected.size})` : "";
      title.textContent = `${config.label}${count}`;
    }
  }
  function _notify() {
    if (typeof onChange === "function") {
      onChange({ dimension, field: config.field, selectedValues: Array.from(_selected) });
    }
  }
  function apply(items) {
    if (_selected.size === 0) return items;
    return items.filter((item) => {
      const val = String(item[config.field] ?? "");
      return _selected.has(val);
    });
  }
  function getValues() {
    return Array.from(_selected);
  }
  function setValues(values) {
    _selected = new Set(values.map(String));
    render();
  }
  function updateOptions(newOptions) {
    _options = newOptions;
    render();
  }
  function isActive() {
    return _selected.size > 0;
  }
  function clear() {
    _selected.clear();
    render();
    _notify();
  }
  function destroy() {
    if (_el && _el.parentNode) _el.parentNode.removeChild(_el);
    _el = null;
    _selected.clear();
  }
  return { render, apply, getValues, setValues, updateOptions, isActive, clear, destroy };
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, dimensionsCount: Object.keys(DIMENSIONS).length };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION };
}
var multi_select_default = { MultiSelectFilter, DIMENSIONS, injectPorts, info, healthCheck, VERSION, MODULE_ID };
export {
  DIMENSIONS,
  MODULE_ID,
  MultiSelectFilter,
  VERSION,
  multi_select_default as default,
  healthCheck,
  info,
  injectPorts
};
