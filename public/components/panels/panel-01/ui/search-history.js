const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-01/ui/search-history";
function SearchHistory(options = {}) {
  this.storageKey = options.storageKey || "p01_search_history";
  this.maxItems = options.maxItems || 10;
  this.onSelect = options.onSelect || (() => {
  });
  this._history = [];
  this._dropdown = null;
  this._visible = false;
  this._loadHistory();
}
SearchHistory.prototype._loadHistory = function() {
  try {
    const saved = localStorage.getItem(this.storageKey);
    if (saved) this._history = JSON.parse(saved);
  } catch (e) {
    this._history = [];
  }
};
SearchHistory.prototype._saveHistory = function() {
  try {
    localStorage.setItem(this.storageKey, JSON.stringify(this._history));
  } catch (e) {
  }
};
SearchHistory.prototype.add = function(query, resultCount) {
  if (!query || query.trim().length < 2) return;
  const normalized = query.trim();
  this._history = this._history.filter((item) => item.query.toLowerCase() !== normalized.toLowerCase());
  this._history.unshift({
    query: normalized,
    timestamp: Date.now(),
    resultCount: resultCount || 0
  });
  if (this._history.length > this.maxItems) {
    this._history = this._history.slice(0, this.maxItems);
  }
  this._saveHistory();
};
SearchHistory.prototype.remove = function(query) {
  this._history = this._history.filter((item) => item.query !== query);
  this._saveHistory();
};
SearchHistory.prototype.clear = function() {
  this._history = [];
  this._saveHistory();
};
SearchHistory.prototype.getHistory = function() {
  return this._history.slice();
};
SearchHistory.prototype.init = function(container) {
  this._container = container;
  this._createDropdown();
};
SearchHistory.prototype._createDropdown = function() {
  this._dropdown = document.createElement("div");
  this._dropdown.className = "p01-search-history";
  this._dropdown.style.display = "none";
  if (this._container) {
    this._container.style.position = "relative";
    this._container.appendChild(this._dropdown);
  }
};
SearchHistory.prototype.show = function() {
  if (this._history.length === 0) return;
  this._render();
  this._dropdown.style.display = "block";
  this._visible = true;
};
SearchHistory.prototype.hide = function() {
  this._dropdown.style.display = "none";
  this._visible = false;
};
SearchHistory.prototype.toggle = function() {
  if (this._visible) {
    this.hide();
  } else {
    this.show();
  }
};
SearchHistory.prototype._render = function() {
  const self = this;
  if (this._history.length === 0) {
    this._dropdown.innerHTML = '<div class="p01-history-empty">Nenhuma busca recente</div>';
    return;
  }
  let html = '<div class="p01-history-header"><span>Buscas recentes</span><button class="p01-history-clear" data-action="clear">Limpar</button></div>';
  html += '<div class="p01-history-items">';
  html += this._history.map((item) => {
    const timeAgo = self._formatTimeAgo(item.timestamp);
    return `<div class="p01-history-item" data-query="${self._escapeHtml(item.query)}"><span class="p01-history-icon">\u{1F552}</span><span class="p01-history-query">${self._escapeHtml(item.query)}</span><span class="p01-history-meta">${item.resultCount || 0} resultados \xB7 ${timeAgo}</span><button class="p01-history-remove" data-action="remove" data-query="${self._escapeHtml(item.query)}">&times;</button></div>`;
  }).join("");
  html += "</div>";
  this._dropdown.innerHTML = html;
  this._bindEvents();
};
SearchHistory.prototype._bindEvents = function() {
  const self = this;
  this._dropdown.querySelectorAll(".p01-history-item").forEach((item) => {
    item.addEventListener("click", (e) => {
      if (e.target.closest('[data-action="remove"]')) return;
      self.onSelect(item.dataset.query);
      self.hide();
    });
  });
  this._dropdown.querySelectorAll('[data-action="remove"]').forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      self.remove(btn.dataset.query);
      self._render();
      if (self._history.length === 0) self.hide();
    });
  });
  const clearBtn = this._dropdown.querySelector('[data-action="clear"]');
  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      self.clear();
      self.hide();
    });
  }
};
SearchHistory.prototype._formatTimeAgo = (timestamp) => {
  const seconds = Math.floor((Date.now() - timestamp) / 1e3);
  if (seconds < 60) return "agora";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return new Date(timestamp).toLocaleDateString("pt-BR");
};
SearchHistory.prototype._escapeHtml = (str) => {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
};
SearchHistory.prototype.destroy = function() {
  if (this._dropdown && this._dropdown.parentNode) {
    this._dropdown.parentNode.removeChild(this._dropdown);
  }
  this._dropdown = null;
  this._visible = false;
};
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION };
}
var search_history_default = { SearchHistory, info, healthCheck };
export {
  MODULE_ID,
  SearchHistory,
  VERSION,
  search_history_default as default,
  healthCheck,
  info
};
