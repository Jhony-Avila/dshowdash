const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-01/ui/search-suggestions";
function SearchSuggestions(inputElement, options = {}) {
  this.input = inputElement;
  this.onSelect = options.onSelect || (() => {
  });
  this.onSearch = options.onSearch || (() => {
  });
  this.fields = options.fields || ["descricao", "fornecedor", "centro_custo"];
  this.maxSuggestions = options.maxSuggestions || 8;
  this.minChars = options.minChars || 2;
  this.debounceMs = options.debounceMs || 200;
  this._data = [];
  this._suggestions = [];
  this._dropdown = null;
  this._selectedIndex = -1;
  this._debounceTimer = null;
  this._visible = false;
  this._bound = {
    onInput: this._onInput.bind(this),
    onKeydown: this._onKeydown.bind(this),
    onBlur: this._onBlur.bind(this),
    onFocus: this._onFocus.bind(this)
  };
}
SearchSuggestions.prototype.init = function() {
  this._createDropdown();
  this._bindEvents();
};
SearchSuggestions.prototype.setData = function(data) {
  this._data = data || [];
  this._buildIndex();
};
SearchSuggestions.prototype._buildIndex = function() {
  const self = this;
  this._index = {};
  this._data.forEach((item) => {
    self.fields.forEach((field) => {
      const value = item[field] || item[self._capitalizeFirst(field)];
      if (value && typeof value === "string") {
        const normalized = value.toLowerCase().trim();
        if (!self._index[normalized]) {
          self._index[normalized] = { text: value, count: 0, field };
        }
        self._index[normalized].count++;
      }
    });
  });
};
SearchSuggestions.prototype._capitalizeFirst = (str) => str.charAt(0).toUpperCase() + str.slice(1);
SearchSuggestions.prototype._createDropdown = function() {
  this._dropdown = document.createElement("div");
  this._dropdown.className = "p01-search-suggestions";
  this._dropdown.style.display = "none";
  if (this.input && this.input.parentNode) {
    this.input.parentNode.style.position = "relative";
    this.input.parentNode.appendChild(this._dropdown);
  }
};
SearchSuggestions.prototype._bindEvents = function() {
  if (!this.input) return;
  this.input.addEventListener("input", this._bound.onInput);
  this.input.addEventListener("keydown", this._bound.onKeydown);
  this.input.addEventListener("blur", this._bound.onBlur);
  this.input.addEventListener("focus", this._bound.onFocus);
};
SearchSuggestions.prototype._onInput = function() {
  const self = this;
  clearTimeout(this._debounceTimer);
  this._debounceTimer = setTimeout(() => {
    self._updateSuggestions();
  }, this.debounceMs);
};
SearchSuggestions.prototype._onFocus = function() {
  if (this.input.value.length >= this.minChars) {
    this._updateSuggestions();
  }
};
SearchSuggestions.prototype._onBlur = function() {
  const self = this;
  setTimeout(() => {
    self._hide();
  }, 150);
};
SearchSuggestions.prototype._onKeydown = function(e) {
  if (!this._visible) return;
  switch (e.key) {
    case "ArrowDown":
      e.preventDefault();
      this._selectNext();
      break;
    case "ArrowUp":
      e.preventDefault();
      this._selectPrev();
      break;
    case "Enter":
      if (this._selectedIndex >= 0) {
        e.preventDefault();
        this._selectCurrent();
      }
      break;
    case "Escape":
      this._hide();
      break;
  }
};
SearchSuggestions.prototype._updateSuggestions = function() {
  const query = this.input.value.toLowerCase().trim();
  if (query.length < this.minChars) {
    this._hide();
    return;
  }
  const self = this;
  const matches = [];
  Object.keys(this._index).forEach((key) => {
    if (key.indexOf(query) !== -1) {
      matches.push(self._index[key]);
    }
  });
  matches.sort((a, b) => {
    const aStarts = a.text.toLowerCase().indexOf(query) === 0;
    const bStarts = b.text.toLowerCase().indexOf(query) === 0;
    if (aStarts && !bStarts) return -1;
    if (!aStarts && bStarts) return 1;
    return b.count - a.count;
  });
  this._suggestions = matches.slice(0, this.maxSuggestions);
  this._selectedIndex = -1;
  this._render();
  this._show();
};
SearchSuggestions.prototype._render = function() {
  const self = this;
  const query = this.input.value.toLowerCase();
  if (this._suggestions.length === 0) {
    this._dropdown.innerHTML = '<div class="p01-suggestion-empty">Nenhuma sugest\xE3o encontrada</div>';
    return;
  }
  const html = this._suggestions.map((item, index) => {
    const highlighted = self._highlight(item.text, query);
    const selectedClass = index === self._selectedIndex ? " selected" : "";
    return `<div class="p01-suggestion-item${selectedClass}" data-index="${index}"><span class="p01-suggestion-text">${highlighted}</span><span class="p01-suggestion-field">${item.field}</span><span class="p01-suggestion-count">${item.count}</span></div>`;
  }).join("");
  this._dropdown.innerHTML = html;
  this._bindItemEvents();
};
SearchSuggestions.prototype._highlight = (text, query) => {
  const index = text.toLowerCase().indexOf(query);
  if (index === -1) return text;
  return `${text.substring(0, index)}<mark>${text.substring(index, index + query.length)}</mark>${text.substring(index + query.length)}`;
};
SearchSuggestions.prototype._bindItemEvents = function() {
  const self = this;
  this._dropdown.querySelectorAll(".p01-suggestion-item").forEach((item) => {
    item.addEventListener("mousedown", (e) => {
      e.preventDefault();
      self._selectedIndex = parseInt(item.dataset.index);
      self._selectCurrent();
    });
    item.addEventListener("mouseenter", () => {
      self._selectedIndex = parseInt(item.dataset.index);
      self._updateSelection();
    });
  });
};
SearchSuggestions.prototype._selectNext = function() {
  this._selectedIndex = Math.min(this._selectedIndex + 1, this._suggestions.length - 1);
  this._updateSelection();
};
SearchSuggestions.prototype._selectPrev = function() {
  this._selectedIndex = Math.max(this._selectedIndex - 1, 0);
  this._updateSelection();
};
SearchSuggestions.prototype._updateSelection = function() {
  const self = this;
  this._dropdown.querySelectorAll(".p01-suggestion-item").forEach((item, index) => {
    item.classList.toggle("selected", index === self._selectedIndex);
  });
};
SearchSuggestions.prototype._selectCurrent = function() {
  if (this._selectedIndex < 0 || this._selectedIndex >= this._suggestions.length) return;
  const selected = this._suggestions[this._selectedIndex];
  this.input.value = selected.text;
  this._hide();
  this.onSelect(selected.text, selected.field);
  this.onSearch(selected.text);
};
SearchSuggestions.prototype._show = function() {
  this._dropdown.style.display = "block";
  this._visible = true;
};
SearchSuggestions.prototype._hide = function() {
  this._dropdown.style.display = "none";
  this._visible = false;
  this._selectedIndex = -1;
};
SearchSuggestions.prototype.destroy = function() {
  clearTimeout(this._debounceTimer);
  if (this.input) {
    this.input.removeEventListener("input", this._bound.onInput);
    this.input.removeEventListener("keydown", this._bound.onKeydown);
    this.input.removeEventListener("blur", this._bound.onBlur);
    this.input.removeEventListener("focus", this._bound.onFocus);
  }
  if (this._dropdown && this._dropdown.parentNode) {
    this._dropdown.parentNode.removeChild(this._dropdown);
  }
  this._dropdown = null;
  this._data = [];
  this._index = {};
};
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION };
}
var search_suggestions_default = { SearchSuggestions, info, healthCheck };
export {
  MODULE_ID,
  SearchSuggestions,
  VERSION,
  search_suggestions_default as default,
  healthCheck,
  info
};
