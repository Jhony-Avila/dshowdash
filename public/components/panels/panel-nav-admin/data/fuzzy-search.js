import { createPanelPorts } from "/core/runtime/ports-profiles.js";
const VERSION = "10.1.0-MIGRATION-PHASE2";
const MODULE_ID = "panel-nav-admin.data.fuzzy-search";
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
function _levenshtein(a, b) {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  const matrix = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      const cost = b[i - 1] === a[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }
  return matrix[b.length][a.length];
}
function _getNestedValue(obj, path) {
  return path.split(".").reduce((o, k) => o != null ? o[k] : void 0, obj);
}
class FuzzySearch {
  /**
   * @param {Object} [options]
   * @param {string[]} [options.keys] — Fields to search in
   * @param {number} [options.threshold=0.4] — Minimum score to include (0-1)
   * @param {number} [options.maxResults=50]
   */
  constructor(options = {}) {
    this.keys = options.keys || ["label", "id", "icon", "section", "href", "description"];
    this.threshold = options.threshold || 0.4;
    this.maxResults = options.maxResults || 50;
  }
  /**
   * Search items with fuzzy matching.
   * @param {Array<Object>} items — Array of nav items to search
   * @param {string} query — Search query
   * @returns {Array<{ item: Object, score: number, matchedKey: string }>}
   */
  search(items, query) {
    if (!query || !items || items.length === 0) return [];
    const q = query.toLowerCase().trim();
    if (q.length === 0) return [];
    const results = [];
    for (const item of items) {
      let bestScore = 0;
      let bestKey = "";
      for (const key of this.keys) {
        const value = _getNestedValue(item, key);
        if (value == null) continue;
        const text = String(value).toLowerCase();
        const score = this._scoreMatch(q, text);
        if (score > bestScore) {
          bestScore = score;
          bestKey = key;
        }
      }
      if (bestScore >= this.threshold) {
        results.push({ item, score: bestScore, matchedKey: bestKey });
      }
    }
    results.sort((a, b) => b.score - a.score);
    return results.slice(0, this.maxResults);
  }
  /**
   * Score a query against a text value.
   * @private
   * @param {string} query — Lowercase query
   * @param {string} text — Lowercase text
   * @returns {number} Score between 0 and 1
   */
  _scoreMatch(query, text) {
    if (text === query) return 1;
    if (text.includes(query)) return 0.9;
    if (text.startsWith(query)) return 0.85;
    if (query.length <= 2) return 0;
    const distance = _levenshtein(query, text);
    const maxLen = Math.max(query.length, text.length);
    if (maxLen === 0) return 0;
    const similarity = 1 - distance / maxLen;
    return similarity;
  }
  /**
   * Highlight matching parts of a text.
   * @param {string} text — Original text
   * @param {string} query — Search query
   * @param {string} [className='pna-highlight'] — CSS class for mark tag
   * @returns {string} HTML with highlighted matches
   */
  highlight(text, query, className = "pna-highlight") {
    if (!text || !query) return text || "";
    const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp("(" + escapedQuery + ")", "gi");
    return text.replace(regex, '<mark class="' + className + '">$1</mark>');
  }
  /**
   * Search and return items with highlighted fields.
   * @param {Array<Object>} items
   * @param {string} query
   * @returns {Array<{ item: Object, score: number, matchedKey: string, highlighted: string }>}
   */
  searchWithHighlight(items, query) {
    const results = this.search(items, query);
    return results.map((r) => {
      const value = _getNestedValue(r.item, r.matchedKey);
      return {
        ...r,
        highlighted: this.highlight(String(value || ""), query)
      };
    });
  }
}
function createFuzzySearch(options = {}) {
  return new FuzzySearch(options);
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, portsInitialized: Ports.isInitialized() };
}
function healthCheck() {
  return { status: Ports.isInitialized() ? "HEALTHY" : "DEGRADED", moduleId: MODULE_ID, version: VERSION };
}
var fuzzy_search_default = { FuzzySearch, createFuzzySearch, info, healthCheck, injectPorts, getPorts, VERSION, MODULE_ID };
export {
  FuzzySearch,
  MODULE_ID,
  VERSION,
  createFuzzySearch,
  fuzzy_search_default as default,
  getPorts,
  healthCheck,
  info,
  injectPorts
};
