const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-01/ui/search";
class SearchComponent {
  constructor(container, options = {}) {
    this.container = container;
    this.onSearch = options.onSearch || (() => {
    });
    this.onClear = options.onClear || (() => {
    });
    this.debounceMs = options.debounce || 400;
    this.minLength = options.minLength || 2;
    this._timer = null;
    this._input = null;
  }
  render() {
    if (!this.container) return;
    this.container.innerHTML = `
      <div class="p01-search">
        <svg class="p01-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
        </svg>
        <input type="text" class="p01-search-input" placeholder="Buscar requisi\xE7\xF5es..." data-filter="q" autocomplete="off">
        <button class="p01-search-clear" type="button" hidden>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
        </button>
        <kbd class="p01-search-shortcut">/</kbd>
      </div>
    `;
    this._input = this.container.querySelector(".p01-search-input");
    this._clearBtn = this.container.querySelector(".p01-search-clear");
    this._shortcut = this.container.querySelector(".p01-search-shortcut");
    this._bindEvents();
  }
  _bindEvents() {
    if (!this._input) return;
    this._input.addEventListener("input", () => {
      this._updateClearButton();
      this._debounceSearch();
    });
    this._input.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        this.clear();
        this._input.blur();
      }
      if (e.key === "Enter") {
        clearTimeout(this._timer);
        this._executeSearch();
      }
    });
    this._input.addEventListener("focus", () => {
      this._shortcut.hidden = true;
    });
    this._input.addEventListener("blur", () => {
      if (!this._input.value) this._shortcut.hidden = false;
    });
    this._clearBtn?.addEventListener("click", () => {
      this.clear();
      this._input.focus();
    });
  }
  _debounceSearch() {
    clearTimeout(this._timer);
    this._timer = setTimeout(() => this._executeSearch(), this.debounceMs);
  }
  _executeSearch() {
    const query = this._input?.value?.trim() || "";
    if (query.length === 0 || query.length >= this.minLength) {
      this.onSearch(query);
    }
  }
  _updateClearButton() {
    if (this._clearBtn) {
      this._clearBtn.hidden = !this._input?.value;
    }
  }
  setValue(value) {
    if (this._input) {
      this._input.value = value || "";
      this._updateClearButton();
    }
  }
  getValue() {
    return this._input?.value?.trim() || "";
  }
  clear() {
    if (this._input) {
      this._input.value = "";
      this._updateClearButton();
      this.onClear();
    }
  }
  focus() {
    this._input?.focus();
  }
  destroy() {
    clearTimeout(this._timer);
  }
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION };
}
var search_default = SearchComponent;
export {
  MODULE_ID,
  SearchComponent,
  VERSION,
  search_default as default,
  healthCheck,
  info
};
