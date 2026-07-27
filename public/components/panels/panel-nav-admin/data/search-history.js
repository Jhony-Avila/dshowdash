import { createPanelPorts } from "/core/runtime/ports-profiles.js";
const VERSION = "10.1.0-MIGRATION-PHASE2";
const MODULE_ID = "panel-nav-admin.data.search-history";
const Ports = createPanelPorts({ moduleId: MODULE_ID });
function _getPort(name) {
  return Ports.get(name);
}
function injectPorts(p) {
  return Ports.inject(p);
}
function getPorts() {
  return Ports.snapshot();
}
function _timeAgo(timestamp) {
  const diff = Date.now() - timestamp;
  const seconds = Math.floor(diff / 1e3);
  if (seconds < 60) return "agora";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return minutes + "min";
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return hours + "h";
  const days = Math.floor(hours / 24);
  return days + "d";
}
class SearchHistory {
  /**
   * @param {Object} [options]
   * @param {string} [options.storageKey='pna_search_history'] — localStorage key
   * @param {number} [options.maxItems=15] — Maximum stored searches
   */
  constructor(options = {}) {
    this.storageKey = options.storageKey || "pna_search_history";
    this.maxItems = options.maxItems || 15;
    this._history = [];
    this._load();
  }
  /**
   * Add a search query to history.
   * @param {string} query — Search term
   * @param {number} [resultCount=0] — Number of results found
   */
  add(query, resultCount = 0) {
    if (!query || query.trim().length < 2) return;
    const normalized = query.trim();
    this._history = this._history.filter(
      (entry) => entry.query.toLowerCase() !== normalized.toLowerCase()
    );
    this._history.unshift({
      query: normalized,
      timestamp: Date.now(),
      resultCount
    });
    if (this._history.length > this.maxItems) {
      this._history = this._history.slice(0, this.maxItems);
    }
    this._save();
  }
  /**
   * Remove a specific entry by query.
   * @param {string} query
   */
  remove(query) {
    this._history = this._history.filter(
      (entry) => entry.query.toLowerCase() !== query.toLowerCase()
    );
    this._save();
  }
  /** Clear all history. */
  clear() {
    this._history = [];
    this._save();
  }
  /**
   * Get the full history.
   * @returns {Array<{ query: string, timestamp: number, resultCount: number, timeAgo: string }>}
   */
  getHistory() {
    return this._history.map((entry) => ({
      ...entry,
      timeAgo: _timeAgo(entry.timestamp)
    }));
  }
  /**
   * Get suggestions based on a partial query.
   * @param {string} partial — Current input value
   * @param {number} [limit=5]
   * @returns {Array<{ query: string, timeAgo: string, resultCount: number }>}
   */
  getSuggestions(partial, limit = 5) {
    if (!partial || partial.trim().length === 0) {
      return this.getHistory().slice(0, limit);
    }
    const q = partial.toLowerCase().trim();
    return this._history.filter((entry) => entry.query.toLowerCase().includes(q)).slice(0, limit).map((entry) => ({
      query: entry.query,
      timeAgo: _timeAgo(entry.timestamp),
      resultCount: entry.resultCount
    }));
  }
  /** @returns {number} Number of stored entries */
  size() {
    return this._history.length;
  }
  /** @private Load from localStorage */
  _load() {
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          this._history = parsed.slice(0, this.maxItems);
        }
      }
    } catch (e) {
    }
  }
  /** @private Save to localStorage */
  _save() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this._history));
    } catch (e) {
    }
  }
}
function createSearchHistory(options = {}) {
  return new SearchHistory(options);
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, portsInitialized: Ports.isInitialized() };
}
function healthCheck() {
  return { status: Ports.isInitialized() ? "HEALTHY" : "DEGRADED", moduleId: MODULE_ID, version: VERSION };
}
var search_history_default = { SearchHistory, createSearchHistory, info, healthCheck, injectPorts, getPorts, VERSION, MODULE_ID };
export {
  MODULE_ID,
  SearchHistory,
  VERSION,
  createSearchHistory,
  search_history_default as default,
  getPorts,
  healthCheck,
  info,
  injectPorts
};
