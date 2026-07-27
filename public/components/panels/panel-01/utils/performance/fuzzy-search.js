const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-01/utils/performance/fuzzy-search";
class FuzzySearch {
  constructor(options = {}) {
    this.threshold = options.threshold || 0.6;
    this.keys = options.keys || ["descricao", "fornecedor", "centro_custo"];
    this.caseSensitive = options.caseSensitive || false;
  }
  search(items, query) {
    if (!query || query.length < 2) return items;
    const normalizedQuery = this.caseSensitive ? query : query.toLowerCase();
    const results = items.map((item) => {
      let bestScore = 0;
      let matchedKey = null;
      for (const key of this.keys) {
        const value = this._getValue(item, key);
        if (!value) continue;
        const normalizedValue = this.caseSensitive ? value : value.toLowerCase();
        const score = this._calculateScore(normalizedValue, normalizedQuery);
        if (score > bestScore) {
          bestScore = score;
          matchedKey = key;
        }
      }
      return { item, score: bestScore, matchedKey };
    });
    return results.filter((r) => r.score >= this.threshold).sort((a, b) => b.score - a.score).map((r) => r.item);
  }
  _getValue(item, key) {
    const keys = key.split(".");
    let value = item;
    for (const k of keys) value = value && value[k];
    return typeof value === "string" ? value : String(value || "");
  }
  _calculateScore(text, query) {
    if (text === query) return 1;
    if (text.includes(query)) return 0.9;
    if (text.startsWith(query)) return 0.85;
    const distance = this._levenshtein(text.substring(0, 50), query);
    const maxLen = Math.max(text.length, query.length);
    return Math.max(0, 1 - distance / maxLen);
  }
  _levenshtein(a, b) {
    if (a.length === 0) return b.length;
    if (b.length === 0) return a.length;
    const matrix = [];
    for (let i = 0; i <= b.length; i++) matrix[i] = [i];
    for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) matrix[i][j] = matrix[i - 1][j - 1];
        else matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j] + 1);
      }
    }
    return matrix[b.length][a.length];
  }
  highlight(text, query) {
    if (!query || !text) return text;
    const escaped = query.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
    const regex = new RegExp(`(${escaped})`, "gi");
    return text.replace(regex, '<mark class="p01-highlight">$1</mark>');
  }
}
function createFuzzySearch(options = {}) {
  return new FuzzySearch(options);
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION };
}
var fuzzy_search_default = { FuzzySearch, createFuzzySearch };
export {
  FuzzySearch,
  MODULE_ID,
  VERSION,
  createFuzzySearch,
  fuzzy_search_default as default,
  healthCheck,
  info
};
