import { createPanelPorts } from "/core/runtime/ports-profiles.js";
const VERSION = "10.2.0-MIGRATION-PHASE4";
const MODULE_ID = "panel-nav-admin.ui.filters.filter-presets";
const Ports = createPanelPorts({ moduleId: MODULE_ID });
function injectPorts(p) {
  return Ports.inject(p);
}
const _log = (level, ...args) => {
  const logger = Ports.get("logger");
  if (!logger) return;
  const prefix = "[FilterPresets]";
  if (level === "error") logger.error?.(prefix, ...args);
  else if (level === "debug") logger.debug?.(prefix, ...args);
  else logger.info?.(prefix, ...args);
};
const STORAGE_KEY = "pna_filter_presets";
const MAX_PRESETS = 20;
function FilterPresets(options = {}) {
  const container = options.container;
  const onApply = options.onApply;
  const getCurrentConfig = options.getCurrentConfig;
  let _presets = [];
  let _el = null;
  let _isOpen = false;
  _loadFromStorage();
  function _loadFromStorage() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      _presets = raw ? JSON.parse(raw) : [];
    } catch (e) {
      _log("error", "Failed to load presets:", e.message);
      _presets = [];
    }
  }
  function _saveToStorage() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(_presets));
    } catch (e) {
      _log("error", "Failed to save presets:", e.message);
    }
  }
  function render() {
    if (!container) return;
    const presetList = _presets.map((p, i) => `
      <div class="pna-filter-preset__item" data-preset-index="${i}">
        <button type="button" class="pna-filter-preset__apply" data-action="apply-preset" data-index="${i}" title="Aplicar: ${_escAttr(p.name)}">${_esc(p.name)}</button>
        <span class="pna-filter-preset__date">${_formatDate(p.createdAt)}</span>
        <button type="button" class="pna-filter-preset__delete" data-action="delete-preset" data-index="${i}" title="Remover">&times;</button>
      </div>
    `).join("");
    const html = `
      <div class="pna-filter-presets" data-filter-type="filter-presets">
        <div class="pna-filter-presets__header">
          <button type="button" class="pna-filter-presets__toggle" data-action="toggle-presets">
            Presets de filtros (${_presets.length})
          </button>
          <button type="button" class="pna-filter-presets__save" data-action="save-preset" title="Salvar filtros atuais como preset">+</button>
        </div>
        <div class="pna-filter-presets__body" style="display:${_isOpen ? "block" : "none"}">
          ${_presets.length === 0 ? '<div class="pna-filter-presets__empty">Nenhum preset salvo</div>' : presetList}
        </div>
      </div>
    `;
    if (!_el) {
      _el = document.createElement("div");
      _el.className = "pna-filter-presets-wrapper";
      container.appendChild(_el);
    }
    _el.innerHTML = html;
    _bindEvents();
  }
  function _bindEvents() {
    if (!_el) return;
    _el.addEventListener("click", (e) => {
      const action = e.target.closest("[data-action]");
      if (!action) return;
      const actionName = action.dataset.action;
      const index = action.dataset.index != null ? parseInt(action.dataset.index, 10) : -1;
      switch (actionName) {
        case "toggle-presets":
          _isOpen = !_isOpen;
          render();
          break;
        case "save-preset":
          _promptSave();
          break;
        case "apply-preset":
          if (index >= 0 && index < _presets.length) {
            _applyPreset(index);
          }
          break;
        case "delete-preset":
          if (index >= 0 && index < _presets.length) {
            _deletePreset(index);
          }
          break;
      }
    });
  }
  function _promptSave() {
    const name = prompt("Nome do preset de filtros:");
    if (!name || !name.trim()) return;
    if (name.trim().length > 50) {
      alert("Nome muito longo (m\xE1x. 50 caracteres)");
      return;
    }
    save(name.trim());
  }
  function save(name) {
    if (_presets.length >= MAX_PRESETS) {
      _log("warn", "Max presets reached:", MAX_PRESETS);
      alert(`Limite de ${MAX_PRESETS} presets atingido. Remova um antes de salvar.`);
      return;
    }
    const config = typeof getCurrentConfig === "function" ? getCurrentConfig() : {};
    const preset = {
      id: "fp_" + Date.now(),
      name,
      config,
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    _presets.unshift(preset);
    _saveToStorage();
    _isOpen = true;
    render();
    _log("info", "Preset saved:", name);
  }
  function _applyPreset(index) {
    const preset = _presets[index];
    if (!preset) return;
    if (typeof onApply === "function") {
      onApply(preset.config);
    }
    _log("info", "Preset applied:", preset.name);
  }
  function _deletePreset(index) {
    const preset = _presets[index];
    if (!preset) return;
    _presets.splice(index, 1);
    _saveToStorage();
    render();
    _log("info", "Preset deleted:", preset.name);
  }
  function getAll() {
    return [..._presets];
  }
  function importPresets(jsonStr) {
    try {
      const imported = JSON.parse(jsonStr);
      if (!Array.isArray(imported)) throw new Error("Expected array");
      _presets = imported.slice(0, MAX_PRESETS);
      _saveToStorage();
      render();
    } catch (e) {
      _log("error", "Import failed:", e.message);
    }
  }
  function exportPresets() {
    return JSON.stringify(_presets, null, 2);
  }
  function clear() {
    _presets = [];
    _saveToStorage();
    render();
  }
  function destroy() {
    if (_el && _el.parentNode) _el.parentNode.removeChild(_el);
    _el = null;
  }
  function _esc(str) {
    const d = document.createElement("div");
    d.textContent = str;
    return d.innerHTML;
  }
  function _escAttr(str) {
    return String(str).replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }
  function _formatDate(isoStr) {
    try {
      return new Date(isoStr).toLocaleDateString("pt-BR");
    } catch {
      return "";
    }
  }
  return { render, save, getAll, importPresets, exportPresets, clear, destroy };
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, maxPresets: MAX_PRESETS };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION };
}
var filter_presets_default = { FilterPresets, STORAGE_KEY, injectPorts, info, healthCheck, VERSION, MODULE_ID };
export {
  FilterPresets,
  MODULE_ID,
  STORAGE_KEY,
  VERSION,
  filter_presets_default as default,
  healthCheck,
  info,
  injectPorts
};
