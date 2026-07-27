import { VERSION, MODULE_ID, SEARCH_MODES, MATCH_TYPES, DEFAULT_CONFIG } from "./constants.js";
import {
  _instance,
  setInstance,
  getConfig,
  setConfig,
  isOpen,
  setIsOpen,
  isInitialized,
  setIsInitialized,
  getSearchContainer,
  setSearchContainer,
  getCurrentQuery,
  setCurrentQuery,
  getMatches,
  setMatches,
  getCurrentMatchIndex,
  setCurrentMatchIndex,
  _listeners,
  incrementMetric,
  getMetrics
} from "./state.js";
import { _log, _emit, _saveState, _loadState } from "./helpers/index.js";
import { _createSearchUI, _updateUI } from "./ui/index.js";
import { _getSearchableContent } from "./search/content.js";
import { _findMatches } from "./search/matcher.js";
import { _highlightMatches, _clearHighlights, _updateActiveHighlight } from "./search/highlighter.js";
import { _setupGlobalHotkey } from "./events/hotkey.js";
function createPanelSearchManager(options = {}) {
  setConfig({ ...DEFAULT_CONFIG, ...options });
  _log("info", "Panel Search Manager created");
  return {
    init,
    destroy,
    open,
    close,
    toggle,
    isOpen,
    search,
    nextMatch,
    previousMatch,
    goToMatch,
    clearSearch,
    getMatches: () => [...getMatches()],
    getCurrentMatch: () => getMatches()[getCurrentMatchIndex()] || null,
    getMatchCount: () => getMatches().length,
    setMode,
    getMode: () => getConfig().mode,
    subscribe,
    healthCheck,
    info
  };
}
function getPanelSearchManager(options = {}) {
  if (!_instance) {
    setInstance(createPanelSearchManager(options));
  }
  return _instance;
}
function init() {
  if (isInitialized()) return true;
  _createSearchUI();
  _setupGlobalHotkey();
  setIsInitialized(true);
  _emit("initialized", {});
  _log("info", "Initialized");
  return true;
}
function destroy() {
  if (!isInitialized()) return true;
  _clearHighlights();
  const container = getSearchContainer();
  if (container) {
    container.remove();
    setSearchContainer(null);
  }
  setIsInitialized(false);
  _log("info", "Destroyed");
  return true;
}
function open() {
  if (!isInitialized()) init();
  if (isOpen()) return;
  setIsOpen(true);
  const container = getSearchContainer();
  container.classList.add("dsd-panel-search--open");
  const input = container.querySelector(".dsd-ps-input");
  const lastQuery = _loadState();
  input.value = lastQuery;
  input.focus();
  input.select();
  if (lastQuery) {
    search(lastQuery);
  }
  _emit("opened", {});
}
function close() {
  if (!isOpen()) return;
  setIsOpen(false);
  const container = getSearchContainer();
  container.classList.remove("dsd-panel-search--open");
  _clearHighlights();
  _saveState();
  _emit("closed", {});
}
function toggle() {
  if (isOpen()) {
    close();
  } else {
    open();
  }
}
function search(query, container = null) {
  setCurrentQuery(query);
  incrementMetric("searches");
  _clearHighlights();
  const config = getConfig();
  if (!query || query.length < config.minQueryLength) {
    setMatches([]);
    setCurrentMatchIndex(-1);
    _updateUI();
    return [];
  }
  const searchContainer = container || document.querySelector(".dsd-container__content") || document.querySelector(".container-main") || document.body;
  const textNodes = _getSearchableContent(searchContainer);
  const matches = _findMatches(textNodes, query);
  setMatches(matches);
  incrementMetric("matchesFound", matches.length);
  setCurrentMatchIndex(matches.length > 0 ? 0 : -1);
  _highlightMatches();
  _updateUI();
  if (getCurrentMatchIndex() >= 0) {
    _updateActiveHighlight();
  }
  _emit("searchCompleted", { query, matchCount: matches.length });
  return matches;
}
function nextMatch() {
  const matches = getMatches();
  if (matches.length === 0) return null;
  const newIndex = (getCurrentMatchIndex() + 1) % matches.length;
  setCurrentMatchIndex(newIndex);
  _updateActiveHighlight();
  _updateUI();
  incrementMetric("navigations");
  _emit("matchNavigated", { index: newIndex, direction: "next" });
  return matches[newIndex];
}
function previousMatch() {
  const matches = getMatches();
  if (matches.length === 0) return null;
  const newIndex = (getCurrentMatchIndex() - 1 + matches.length) % matches.length;
  setCurrentMatchIndex(newIndex);
  _updateActiveHighlight();
  _updateUI();
  incrementMetric("navigations");
  _emit("matchNavigated", { index: newIndex, direction: "previous" });
  return matches[newIndex];
}
function goToMatch(index) {
  const matches = getMatches();
  if (index < 0 || index >= matches.length) return null;
  setCurrentMatchIndex(index);
  _updateActiveHighlight();
  _updateUI();
  return matches[index];
}
function clearSearch() {
  setCurrentQuery("");
  setMatches([]);
  setCurrentMatchIndex(-1);
  _clearHighlights();
  _updateUI();
  const container = getSearchContainer();
  if (container) {
    container.querySelector(".dsd-ps-input").value = "";
  }
  _emit("searchCleared", {});
}
function setMode(mode) {
  if (!Object.values(SEARCH_MODES).includes(mode)) return false;
  const config = getConfig();
  config.mode = mode;
  setConfig(config);
  const query = getCurrentQuery();
  if (query) {
    search(query);
  }
  return true;
}
function subscribe(callback) {
  if (typeof callback !== "function") return () => {
  };
  _listeners.push(callback);
  return () => {
    const idx = _listeners.indexOf(callback);
    if (idx >= 0) _listeners.splice(idx, 1);
  };
}
function healthCheck() {
  const metrics = getMetrics();
  const checks = {
    initialized: isInitialized(),
    hasUI: !!getSearchContainer(),
    noErrors: metrics.errors === 0
  };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  return {
    status: passed === total ? "HEALTHY" : passed >= 2 ? "DEGRADED" : "UNHEALTHY",
    score: `${passed}/${total}`,
    checks,
    currentQuery: getCurrentQuery(),
    matchCount: getMatches().length,
    metrics,
    version: VERSION,
    moduleId: MODULE_ID,
    timestamp: Date.now()
  };
}
function info() {
  const config = getConfig();
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    searchModes: Object.values(SEARCH_MODES),
    matchTypes: Object.values(MATCH_TYPES),
    config: {
      hotkey: config.hotkey,
      mode: config.mode,
      matchType: config.matchType,
      minQueryLength: config.minQueryLength
    },
    isInitialized: isInitialized(),
    isOpen: isOpen(),
    currentQuery: getCurrentQuery(),
    matchCount: getMatches().length,
    currentMatchIndex: getCurrentMatchIndex()
  };
}
export {
  clearSearch,
  close,
  createPanelSearchManager,
  destroy,
  getPanelSearchManager,
  goToMatch,
  healthCheck,
  info,
  init,
  nextMatch,
  open,
  previousMatch,
  search,
  setMode,
  subscribe,
  toggle
};
