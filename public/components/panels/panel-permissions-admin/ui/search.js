const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "uarps-search";
function levenshtein(a, b) {
  const matrix = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
  for (let i2 = 1; i2 <= b.length; i2++) {
    for (let j2 = 1; j2 <= a.length; j2++) {
      matrix[i2][j2] = b[i2 - 1] === a[j2 - 1] ? matrix[i2 - 1][j2 - 1] : Math.min(matrix[i2 - 1][j2 - 1] + 1, matrix[i2][j2 - 1] + 1, matrix[i2 - 1][j2] + 1);
    }
  }
  return matrix[b.length][a.length];
}
function fuzzyMatch(text, query, threshold) {
  if (threshold === void 0) threshold = 0.3;
  if (!query) return { match: true, score: 1 };
  const t = text.toLowerCase();
  const q = query.toLowerCase();
  if (t.indexOf(q) !== -1) return { match: true, score: 1, exact: true };
  const distance = levenshtein(t, q);
  const maxLen = Math.max(t.length, q.length);
  const score = 1 - distance / maxLen;
  return { match: score >= 1 - threshold, score };
}
function fuzzySearch(items, query, keys, threshold) {
  if (!keys) keys = ["label", "id"];
  if (threshold === void 0) threshold = 0.3;
  if (!query) return items;
  const results = [];
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    let bestScore = 0;
    for (let k = 0; k < keys.length; k++) {
      const value = String(item[keys[k]] || "");
      const res = fuzzyMatch(value, query, threshold);
      if (res.match && res.score > bestScore) bestScore = res.score;
    }
    if (bestScore > 0) results.push({ item, score: bestScore });
  }
  results.sort((a, b) => b.score - a.score);
  const out = [];
  for (let j = 0; j < results.length; j++) out.push(results[j].item);
  return out;
}
function highlight(text, query) {
  if (!query) return text;
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
  return text.replace(regex, '<span class="uarps-search__highlight">$1</span>');
}
function regexSearch(items, pattern, keys) {
  if (!keys) keys = ["label", "id"];
  try {
    const regex = new RegExp(pattern, "i");
    return items.filter((item) => {
      for (let k = 0; k < keys.length; k++) {
        if (regex.test(String(item[keys[k]] || ""))) return true;
      }
      return false;
    });
  } catch (e) {
    return [];
  }
}
function VoiceSearch(options) {
  if (!options) options = {};
  this._recognition = null;
  this._isListening = false;
  this._onResult = options.onResult || (() => {
  });
  this._onError = options.onError || (() => {
  });
  this._lang = options.lang || "pt-BR";
}
VoiceSearch.isSupported = () => !!(window.SpeechRecognition || window.webkitSpeechRecognition);
VoiceSearch.prototype.init = function() {
  if (!VoiceSearch.isSupported()) return false;
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const self = this;
  this._recognition = new SpeechRecognition();
  this._recognition.lang = this._lang;
  this._recognition.continuous = false;
  this._recognition.interimResults = false;
  this._recognition.onresult = (e) => {
    const transcript = e.results[0][0].transcript;
    self._onResult(transcript);
    self._isListening = false;
  };
  this._recognition.onerror = (e) => {
    self._onError(e.error);
    self._isListening = false;
  };
  this._recognition.onend = () => {
    self._isListening = false;
  };
  return true;
};
VoiceSearch.prototype.start = function() {
  if (!this._recognition || this._isListening) return;
  this._isListening = true;
  this._recognition.start();
};
VoiceSearch.prototype.stop = function() {
  if (!this._recognition || !this._isListening) return;
  this._recognition.stop();
  this._isListening = false;
};
VoiceSearch.prototype.toggle = function() {
  this._isListening ? this.stop() : this.start();
};
VoiceSearch.prototype.isListening = function() {
  return this._isListening;
};
function getSuggestions(items, query, recentSearches, limit) {
  if (!recentSearches) recentSearches = [];
  if (limit === void 0) limit = 8;
  const suggestions = [];
  if (!query && recentSearches.length) {
    for (let i = 0; i < Math.min(3, recentSearches.length); i++) suggestions.push({ type: "recent", text: recentSearches[i] });
  }
  if (query) {
    const matches = fuzzySearch(items, query).slice(0, limit);
    for (let j = 0; j < matches.length; j++) suggestions.push({ type: "result", item: matches[j] });
  }
  return suggestions;
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION, checks: { fuzzySearchReady: typeof fuzzySearch === "function", voiceSupported: VoiceSearch.isSupported() } };
}
const Search = { fuzzyMatch, fuzzySearch, highlight, regexSearch, VoiceSearch, getSuggestions, VERSION, MODULE_ID, info, healthCheck };
var search_default = Search;
export {
  MODULE_ID,
  Search,
  VERSION,
  VoiceSearch,
  search_default as default,
  fuzzyMatch,
  fuzzySearch,
  getSuggestions,
  healthCheck,
  highlight,
  info,
  regexSearch
};
