import { MAIN_EVENTS } from "/core/runtime/events/catalog/main.events.js";
import { ICONS } from "../utils/icons.js";
const VERSION = "8.2.0-ENTERPRISE";
const MODULE_ID = "container-search-box";
import { createLogger } from "../utils/logger.js";
const logger = createLogger(MODULE_ID);
let _injectedEventBus = null;
function injectEventBus(eventBus) {
  _injectedEventBus = eventBus;
}
function _getEventBus() {
  return _injectedEventBus;
}
function _emitEvent(eventType, payload) {
  const eb = _getEventBus();
  if (eb?.emit) {
    eb.emit(eventType, { source: MODULE_ID, timestamp: Date.now(), ...payload });
    return true;
  }
  return false;
}
function _validateOptions(options) {
  const errors = [];
  if (options.placeholder !== void 0 && typeof options.placeholder !== "string") errors.push("placeholder must be a string");
  if (options.debounceMs !== void 0 && (typeof options.debounceMs !== "number" || options.debounceMs < 0)) errors.push("debounceMs must be a positive number");
  if (options.showClear !== void 0 && typeof options.showClear !== "boolean") errors.push("showClear must be a boolean");
  if (options.showIcon !== void 0 && typeof options.showIcon !== "boolean") errors.push("showIcon must be a boolean");
  if (options.expandable !== void 0 && typeof options.expandable !== "boolean") errors.push("expandable must be a boolean");
  if (options.onSearch !== void 0 && typeof options.onSearch !== "function") errors.push("onSearch must be a function");
  if (errors.length > 0) logger.warn("Invalid options", { errors });
  return errors.length === 0;
}
function createSearchBox(container, options = {}) {
  _validateOptions(options);
  const { placeholder = "Buscar...", debounceMs = 300, showClear = true, showIcon = true, expandable = false, onSearch, onClear, onFocus, onBlur, eventBus } = options;
  if (eventBus && !_injectedEventBus) _injectedEventBus = eventBus;
  let _initialized = false;
  let _searchEl = null;
  let _inputEl = null;
  let _debounceTimer = null;
  let _value = "";
  let _expanded = !expandable;
  let _boundOnInput = null;
  let _boundOnFocus = null;
  let _boundOnBlur = null;
  let _boundOnKeydown = null;
  let _boundOnClear = null;
  let _boundOnIconClick = null;
  let _searchId = `search-${container?.id || Date.now()}`;
  function _createSearchElement() {
    const header = container.querySelector(".dsd-container__header");
    if (!header) return null;
    let existing = container.querySelector(".dsd-search-box");
    if (existing) return existing;
    const search = document.createElement("div");
    search.className = `dsd-search-box ${expandable ? "dsd-search-box--expandable" : ""}`;
    search.setAttribute("role", "search");
    search.setAttribute("aria-label", "Busca no container");
    search.innerHTML = `${showIcon ? `<button type="button" class="dsd-search-box__icon-btn" aria-label="Abrir busca" aria-controls="${_searchId}">${ICONS.search}</button>` : ""}<input type="search" id="${_searchId}" class="dsd-search-box__input" placeholder="${placeholder}" aria-label="${placeholder}" autocomplete="off" spellcheck="false">${showClear ? `<button type="button" class="dsd-search-box__clear" aria-label="Limpar busca" hidden>${ICONS.closeSmall}</button>` : ""}`;
    const controls = header.querySelector(".dsd-container__controls");
    if (controls) controls.insertAdjacentElement("beforebegin", search);
    else header.appendChild(search);
    return search;
  }
  function _updateClearButton() {
    const clearBtn = _searchEl?.querySelector(".dsd-search-box__clear");
    if (clearBtn) {
      clearBtn.hidden = !_value;
      clearBtn.setAttribute("aria-hidden", String(!_value));
    }
  }
  function _debounceSearch() {
    if (_debounceTimer) clearTimeout(_debounceTimer);
    _debounceTimer = setTimeout(() => {
      onSearch?.(_value);
      _emitEvent(MAIN_EVENTS.SEARCH_QUERY, { query: _value, containerId: container.id });
    }, debounceMs);
  }
  function _setupEvents() {
    if (!_searchEl) return;
    _inputEl = _searchEl.querySelector(".dsd-search-box__input");
    const clearBtn = _searchEl.querySelector(".dsd-search-box__clear");
    const iconBtn = _searchEl.querySelector(".dsd-search-box__icon-btn");
    _boundOnInput = (e) => {
      _value = e.target.value;
      _updateClearButton();
      _debounceSearch();
    };
    _boundOnFocus = () => {
      _searchEl.classList.add("dsd-search-box--focused");
      _searchEl.setAttribute("aria-expanded", "true");
      if (expandable) searchApi.expand();
      onFocus?.();
    };
    _boundOnBlur = () => {
      _searchEl.classList.remove("dsd-search-box--focused");
      if (expandable && !_value) {
        searchApi.collapse();
        _searchEl.setAttribute("aria-expanded", "false");
      }
      onBlur?.();
    };
    _boundOnKeydown = (e) => {
      if (e.key === "Escape") {
        if (_value) {
          searchApi.clear();
        } else if (expandable) {
          searchApi.collapse();
          _inputEl.blur();
        }
      }
    };
    _boundOnClear = () => {
      searchApi.clear();
      _inputEl?.focus();
    };
    _boundOnIconClick = () => {
      if (expandable) {
        searchApi.expand();
        _inputEl?.focus();
      } else {
        _inputEl?.focus();
      }
    };
    _inputEl?.addEventListener("input", _boundOnInput);
    _inputEl?.addEventListener("focus", _boundOnFocus);
    _inputEl?.addEventListener("blur", _boundOnBlur);
    _inputEl?.addEventListener("keydown", _boundOnKeydown);
    clearBtn?.addEventListener("click", _boundOnClear);
    iconBtn?.addEventListener("click", _boundOnIconClick);
  }
  function _removeEvents() {
    const clearBtn = _searchEl?.querySelector(".dsd-search-box__clear");
    const iconBtn = _searchEl?.querySelector(".dsd-search-box__icon-btn");
    if (_inputEl) {
      if (_boundOnInput) _inputEl.removeEventListener("input", _boundOnInput);
      if (_boundOnFocus) _inputEl.removeEventListener("focus", _boundOnFocus);
      if (_boundOnBlur) _inputEl.removeEventListener("blur", _boundOnBlur);
      if (_boundOnKeydown) _inputEl.removeEventListener("keydown", _boundOnKeydown);
    }
    if (clearBtn && _boundOnClear) clearBtn.removeEventListener("click", _boundOnClear);
    if (iconBtn && _boundOnIconClick) iconBtn.removeEventListener("click", _boundOnIconClick);
    _boundOnInput = null;
    _boundOnFocus = null;
    _boundOnBlur = null;
    _boundOnKeydown = null;
    _boundOnClear = null;
    _boundOnIconClick = null;
  }
  const searchApi = {
    init() {
      if (_initialized) return this;
      _searchEl = _createSearchElement();
      _setupEvents();
      if (expandable) {
        this.collapse();
        _searchEl?.setAttribute("aria-expanded", "false");
      }
      _initialized = true;
      return this;
    },
    getValue() {
      return _value;
    },
    setValue(value) {
      if (typeof value !== "string") return this;
      _value = value;
      if (_inputEl) _inputEl.value = value;
      _updateClearButton();
      return this;
    },
    clear() {
      _value = "";
      if (_inputEl) _inputEl.value = "";
      _updateClearButton();
      onClear?.();
      _emitEvent(MAIN_EVENTS.SEARCH_CLEAR, { containerId: container.id });
      return this;
    },
    focus() {
      _inputEl?.focus();
      return this;
    },
    blur() {
      _inputEl?.blur();
      return this;
    },
    expand() {
      _expanded = true;
      _searchEl?.classList.add("dsd-search-box--expanded");
      _searchEl?.setAttribute("aria-expanded", "true");
      return this;
    },
    collapse() {
      _expanded = false;
      _searchEl?.classList.remove("dsd-search-box--expanded");
      _searchEl?.setAttribute("aria-expanded", "false");
      return this;
    },
    isExpanded() {
      return _expanded;
    },
    isInitialized() {
      return _initialized;
    },
    destroy() {
      _removeEvents();
      if (_debounceTimer) clearTimeout(_debounceTimer);
      _debounceTimer = null;
      _searchEl?.remove();
      _searchEl = null;
      _inputEl = null;
      _initialized = false;
    },
    healthCheck() {
      return { status: _initialized ? "HEALTHY" : "NOT_INITIALIZED", version: VERSION, moduleId: MODULE_ID, value: _value, expanded: _expanded, hasInjectedEventBus: !!_injectedEventBus, usesCentralizedIcons: true, hasValidation: true };
    }
  };
  return searchApi;
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, hasInjectedEventBus: !!_injectedEventBus, usesCentralizedIcons: true, hasValidation: true };
}
function healthCheck() {
  return { status: "HEALTHY", version: VERSION, moduleId: MODULE_ID, hasInjectedEventBus: !!_injectedEventBus, usesCentralizedIcons: true, hasValidation: true };
}
var search_box_default = { createSearchBox, injectEventBus, info, healthCheck, VERSION, MODULE_ID };
export {
  MODULE_ID,
  VERSION,
  createSearchBox,
  search_box_default as default,
  healthCheck,
  info,
  injectEventBus
};
