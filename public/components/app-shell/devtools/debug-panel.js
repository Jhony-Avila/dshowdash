import { icon, formatDate, getAppShell, getBootstrap, setCollapsedSections, getCollapsedSections } from "./panel/helpers.js";
import { recordHealthStatus, getIssueCount, getTabIssues, getHealthHistory, flashStatusChange, getMetricsCap } from "./panel/health-tracker.js";
import { attachEventListeners } from "./panel/event-handlers.js";
import { renderOverviewTab } from "./panel/tabs/overview.js";
import { renderBootstrapTab } from "./panel/tabs/bootstrap.js";
import { renderRegionsTab } from "./panel/tabs/regions.js";
import { renderEventsTab } from "./panel/tabs/events.js";
import { renderPerformanceTab } from "./panel/tabs/performance.js";
import { renderStateTab } from "./panel/tabs/state.js";
import { renderSnapshotsTab } from "./panel/tabs/snapshots.js";
import { renderRegionMetricsTab } from "./panel/tabs/region-metrics.js";
import { renderDebugPresetsTab } from "./panel/tabs/debug-presets.js";
import { renderAPIMetricsTab } from "./panel/tabs/api-metrics.js";
import { renderMemoryTab } from "./panel/tabs/memory.js";
import { renderDocsTab } from "./panel/tabs/docs.js";
import { renderNetworkTab, interceptNetwork, clearNetworkRequests, getNetworkStats } from "./panel/tabs/network.js";
import { renderDiffViewer, setDiffLeft, setDiffRight } from "./panel/tabs/diff-viewer.js";
import { renderIndexedDBTab, scanDatabases } from "./panel/tabs/indexeddb.js";
const VERSION = "4.2.1-P2-ENTERPRISE";
const MODULE_ID = "app-shell-debug-panel";
const PANEL_ID = "dsd-debug-panel";
const STORAGE_KEY = "dsd:debug-panel:state";
const COLLAPSED_KEY = "dsd:debug-panel:collapsed";
const TABS = [
  { id: "overview", label: "Overview", icon: "overview" },
  { id: "bootstrap", label: "Bootstrap", icon: "zap" },
  { id: "regions", label: "Regions", icon: "regions" },
  { id: "events", label: "Events", icon: "events" },
  { id: "network", label: "Network", icon: "wifi" },
  { id: "performance", label: "Performance", icon: "performance" },
  { id: "state", label: "State", icon: "state" },
  { id: "snapshots", label: "Snapshots", icon: "snapshots" },
  { id: "diff", label: "Diff", icon: "columns" },
  { id: "regionMetrics", label: "Metrics", icon: "metrics" },
  { id: "debugPresets", label: "Presets", icon: "presets" },
  { id: "apiMetrics", label: "APIs", icon: "api" },
  { id: "memory", label: "Memory", icon: "memory" },
  { id: "indexeddb", label: "IDB", icon: "database" },
  { id: "docs", label: "Docs", icon: "docs" }
];
let _isOpen = false;
let _activeTab = "overview";
let _panelElement = null;
let _refreshInterval = null;
let _initialized = false;
let _isCompact = false;
let _searchQuery = "";
let _metrics = { opens: 0, refreshes: 0, errors: 0, exports: 0 };
let _lastRenderHash = "";
let _renderTimings = {};
let _lastUpdateTs = 0;
let _pinnedTab = null;
let _lastRenderTime = 0;
const _RENDER_MIN_INTERVAL = 500;
let _isDarkTheme = true;
let _panelHeight = null;
let _isResizing = false;
let _resizeAttached = false;
const _tabRenderers = {
  overview: renderOverviewTab,
  bootstrap: renderBootstrapTab,
  regions: renderRegionsTab,
  events: renderEventsTab,
  network: renderNetworkTab,
  performance() {
    return renderPerformanceTab(_renderTimings);
  },
  state: renderStateTab,
  snapshots: renderSnapshotsTab,
  diff: renderDiffViewer,
  regionMetrics: renderRegionMetricsTab,
  debugPresets: renderDebugPresetsTab,
  apiMetrics: renderAPIMetricsTab,
  memory: renderMemoryTab,
  indexeddb: renderIndexedDBTab,
  docs: renderDocsTab
};
function _handleError(context, error) {
  _metrics.errors++;
  if (_metrics.errors > getMetricsCap()) _metrics.errors = getMetricsCap();
  const msg = `[DebugPanel][${context}] ${error && error.message ? error.message : String(error)}`;
  if (typeof console !== "undefined" && console.warn) console.warn(msg);
}
function _incrementMetric(key) {
  _metrics[key] = (_metrics[key] || 0) + 1;
  if (_metrics[key] > getMetricsCap()) _metrics[key] = getMetricsCap();
}
function _saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      isOpen: _isOpen,
      activeTab: _activeTab,
      isCompact: _isCompact,
      searchQuery: _searchQuery,
      pinnedTab: _pinnedTab,
      isDarkTheme: _isDarkTheme,
      panelHeight: _panelHeight
    }));
  } catch (e) {
    _handleError("_saveState", e);
  }
}
function _loadState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const state = JSON.parse(saved);
      _activeTab = state.activeTab || "overview";
      _isCompact = state.isCompact || false;
      _searchQuery = state.searchQuery || "";
      _pinnedTab = state.pinnedTab || null;
      _isDarkTheme = state.isDarkTheme !== void 0 ? state.isDarkTheme : true;
      _panelHeight = state.panelHeight || null;
    }
  } catch (e) {
    _handleError("_loadState", e);
  }
  try {
    const collSaved = localStorage.getItem(COLLAPSED_KEY);
    if (collSaved) setCollapsedSections(JSON.parse(collSaved));
  } catch (e) {
    _handleError("_loadCollapsed", e);
  }
}
function _saveCollapsed() {
  try {
    localStorage.setItem(COLLAPSED_KEY, JSON.stringify(getCollapsedSections()));
  } catch (e) {
    _handleError("_saveCollapsed", e);
  }
}
function _toggleSection(sectionId) {
  const coll = getCollapsedSections();
  coll[sectionId] = !coll[sectionId];
  setCollapsedSections(coll);
  _saveCollapsed();
  _render(true);
}
function _toggleTheme() {
  const shell = getAppShell();
  if (shell && shell.theme && shell.theme.toggleTheme) {
    shell.theme.toggleTheme();
  }
  _isDarkTheme = !_isDarkTheme;
  if (_panelElement) {
    if (_isDarkTheme) _panelElement.classList.remove("dsd-ui-panel--light");
    else _panelElement.classList.add("dsd-ui-panel--light");
  }
  _saveState();
  _render(true);
}
function _handleResizeStart(startY) {
  _isResizing = true;
  const startHeight = _panelElement.offsetHeight;
  if (_panelElement) _panelElement.classList.add("dsd-ui-panel--resizing");
  function onMove(clientY) {
    if (!_isResizing || !_panelElement) return;
    const diff = startY - clientY;
    const newHeight = Math.max(200, Math.min(window.innerHeight - 40, startHeight + diff));
    _panelElement.style.maxHeight = `${newHeight}px`;
    _panelHeight = newHeight;
  }
  function cleanup() {
    _isResizing = false;
    if (_panelElement) _panelElement.classList.remove("dsd-ui-panel--resizing");
    _saveState();
    document.removeEventListener("mousemove", onMouseMove);
    document.removeEventListener("mouseup", onEnd);
    document.removeEventListener("touchmove", onTouchMove);
    document.removeEventListener("touchend", onEnd);
    document.removeEventListener("touchcancel", onEnd);
  }
  function onMouseMove(ev) {
    onMove(ev.clientY);
  }
  function onTouchMove(ev) {
    if (ev.touches.length > 0) onMove(ev.touches[0].clientY);
  }
  function onEnd() {
    cleanup();
  }
  document.addEventListener("mousemove", onMouseMove);
  document.addEventListener("mouseup", onEnd);
  document.addEventListener("touchmove", onTouchMove, { passive: true });
  document.addEventListener("touchend", onEnd);
  document.addEventListener("touchcancel", onEnd);
}
function _initResize() {
  if (!_panelElement || _resizeAttached) return;
  const handle = _panelElement.querySelector(".dsd-ui-resize-handle");
  if (!handle) return;
  _resizeAttached = true;
  handle.addEventListener("mousedown", (e) => {
    e.preventDefault();
    _handleResizeStart(e.clientY);
  });
  handle.addEventListener("touchstart", (e) => {
    if (e.touches.length === 1) {
      e.preventDefault();
      _handleResizeStart(e.touches[0].clientY);
    }
  }, { passive: false });
}
function _computeStateHash() {
  const shell = getAppShell();
  const bs = getBootstrap();
  const parts = [_activeTab, _isCompact, _searchQuery];
  if (shell) {
    try {
      const h = shell.healthCheck();
      parts.push(h.status, h.score);
    } catch (e) {
      parts.push("err");
    }
  }
  if (bs) {
    try {
      const bh = bs.healthCheck ? bs.healthCheck() : {};
      parts.push(bh.status || "N/A");
    } catch (e) {
      parts.push("err");
    }
  }
  if (typeof performance !== "undefined" && performance.memory) {
    parts.push(Math.round(performance.memory.usedJSHeapSize / 1048576));
  }
  return parts.join("|");
}
function _applySearch() {
  if (!_panelElement) return;
  const content = _panelElement.querySelector(".dsd-ui-content");
  if (!content) return;
  const query = _searchQuery.toLowerCase().trim();
  const oldHighlights = content.querySelectorAll(".dsd-ui-highlight");
  oldHighlights.forEach((span) => {
    const parent = span.parentNode;
    parent.replaceChild(document.createTextNode(span.textContent), span);
    parent.normalize();
  });
  const items = content.querySelectorAll(".dsd-ui-list-item, .dsd-ui-card, .dsd-ui-log-item, .dsd-ui-snapshot-item, .dsd-ui-region-metric, .dsd-ui-preset-btn");
  items.forEach((item) => {
    if (!query) {
      item.style.display = "";
      return;
    }
    item.style.display = item.textContent.toLowerCase().indexOf(query) !== -1 ? "" : "none";
  });
  const sections = content.querySelectorAll(".dsd-ui-section");
  sections.forEach((section) => {
    if (!query) {
      section.style.display = "";
      return;
    }
    const visibleChildren = section.querySelectorAll('.dsd-ui-list-item:not([style*="display: none"]), .dsd-ui-card:not([style*="display: none"]), .dsd-ui-log-item:not([style*="display: none"]), .dsd-ui-snapshot-item:not([style*="display: none"]), .dsd-ui-region-metric:not([style*="display: none"]), .dsd-ui-preset-btn:not([style*="display: none"])');
    const title = section.querySelector(".dsd-ui-section__title");
    const titleMatch = title && title.textContent.toLowerCase().indexOf(query) !== -1;
    section.style.display = visibleChildren.length > 0 || titleMatch ? "" : "none";
  });
  if (query) _highlightMatches(content, query);
}
function _highlightMatches(root, query) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const parent = node.parentElement;
      if (!parent) return NodeFilter.FILTER_REJECT;
      const tag = parent.tagName;
      if (tag === "BUTTON" || tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return NodeFilter.FILTER_REJECT;
      if (parent.classList.contains("dsd-ui-section__title") && parent.classList.contains("dsd-ui-section__title--collapsible")) return NodeFilter.FILTER_REJECT;
      if (parent.closest(".dsd-ui-header") || parent.closest(".dsd-ui-tabs") || parent.closest(".dsd-ui-search")) return NodeFilter.FILTER_REJECT;
      if (parent.style.display === "none" || parent.closest('[style*="display: none"]')) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    }
  });
  const textNodes = [];
  while (walker.nextNode()) textNodes.push(walker.currentNode);
  textNodes.forEach((node) => {
    const text = node.textContent;
    const lowerText = text.toLowerCase();
    let idx = lowerText.indexOf(query);
    if (idx === -1) return;
    const frag = document.createDocumentFragment();
    let lastIdx = 0;
    while (idx !== -1) {
      if (idx > lastIdx) frag.appendChild(document.createTextNode(text.substring(lastIdx, idx)));
      const span = document.createElement("span");
      span.className = "dsd-ui-highlight";
      span.textContent = text.substring(idx, idx + query.length);
      frag.appendChild(span);
      lastIdx = idx + query.length;
      idx = lowerText.indexOf(query, lastIdx);
    }
    if (lastIdx < text.length) frag.appendChild(document.createTextNode(text.substring(lastIdx)));
    node.parentNode.replaceChild(frag, node);
  });
}
function _copyTabData() {
  if (!_panelElement) return;
  const content = _panelElement.querySelector(".dsd-ui-content");
  if (!content) return;
  const text = content.innerText || content.textContent || "";
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        _showCopyFeedback();
      });
    } else {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.left = "-9999px";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      _showCopyFeedback();
    }
  } catch (e) {
    _handleError("_copyTabData", e);
  }
}
function _showCopyFeedback() {
  const copyBtn = _panelElement ? _panelElement.querySelector("#dsd-debug-copy") : null;
  if (!copyBtn) return;
  const orig = copyBtn.innerHTML;
  copyBtn.innerHTML = icon("check", 16);
  copyBtn.classList.add("active");
  setTimeout(() => {
    copyBtn.innerHTML = orig;
    copyBtn.classList.remove("active");
  }, 1500);
}
function _exportDiagnostic() {
  const shell = getAppShell();
  const bs = getBootstrap();
  const netStats = getNetworkStats();
  const diagnostic = {
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    debugPanel: { version: VERSION, activeTab: _activeTab, isCompact: _isCompact, metrics: _metrics, issueCount: getIssueCount(_handleError), renderTimings: _renderTimings, healthHistory: getHealthHistory(), networkStats: netStats },
    appShell: null,
    bootstrap: null,
    browser: { userAgent: navigator.userAgent, language: navigator.language, online: navigator.onLine, url: window.location.href },
    performance: null
  };
  if (shell) {
    diagnostic.appShell = {};
    try {
      diagnostic.appShell.info = shell.info();
    } catch (e) {
      diagnostic.appShell.info = { error: e.message };
      _handleError("export:shell.info", e);
    }
    try {
      diagnostic.appShell.health = shell.healthCheck();
    } catch (e) {
      diagnostic.appShell.health = { error: e.message };
      _handleError("export:shell.health", e);
    }
    try {
      diagnostic.appShell.regionMetrics = shell.regionMetrics ? shell.regionMetrics.getAllMetrics() : null;
    } catch (e) {
      diagnostic.appShell.regionMetrics = { error: e.message };
    }
    try {
      diagnostic.appShell.apiMetrics = shell.apiMetrics ? { topAPIs: shell.apiMetrics.getTopAPIs(10), errors: shell.apiMetrics.getAPIsWithErrors() } : null;
    } catch (e) {
      diagnostic.appShell.apiMetrics = { error: e.message };
    }
    try {
      diagnostic.appShell.memoryLeaks = shell.memoryLeaks ? shell.memoryLeaks.info() : null;
    } catch (e) {
      diagnostic.appShell.memoryLeaks = { error: e.message };
    }
    try {
      diagnostic.appShell.snapshots = shell.stateSnapshots ? { count: shell.stateSnapshots.getAll().length, metrics: shell.stateSnapshots.getMetrics() } : null;
    } catch (e) {
      diagnostic.appShell.snapshots = { error: e.message };
    }
  }
  if (bs) {
    diagnostic.bootstrap = {};
    try {
      diagnostic.bootstrap.version = bs.VERSION || "N/A";
    } catch (e) {
      diagnostic.bootstrap.version = "error";
    }
    try {
      diagnostic.bootstrap.health = bs.healthCheck ? bs.healthCheck() : null;
    } catch (e) {
      diagnostic.bootstrap.health = { error: e.message };
    }
    try {
      diagnostic.bootstrap.network = bs.getNetworkInfo ? bs.getNetworkInfo() : null;
    } catch (e) {
      diagnostic.bootstrap.network = { error: e.message };
    }
    try {
      diagnostic.bootstrap.lazy = bs.getLazyStats ? bs.getLazyStats() : null;
    } catch (e) {
      diagnostic.bootstrap.lazy = { error: e.message };
    }
    try {
      diagnostic.bootstrap.cancelled = bs.isBootCancelled ? bs.isBootCancelled() : false;
    } catch (e) {
      diagnostic.bootstrap.cancelled = "error";
    }
  }
  try {
    const perf = typeof performance !== "undefined" ? performance : null;
    if (perf && perf.memory) {
      diagnostic.performance = { usedJSHeapSize: perf.memory.usedJSHeapSize, totalJSHeapSize: perf.memory.totalJSHeapSize, jsHeapSizeLimit: perf.memory.jsHeapSizeLimit };
    }
  } catch (e) {
    diagnostic.performance = { error: e.message };
  }
  try {
    const blob = new Blob([JSON.stringify(diagnostic, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `dshowdash-diagnostic-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    _incrementMetric("exports");
  } catch (e) {
    _handleError("export:download", e);
  }
  const exportBtn = _panelElement ? _panelElement.querySelector("#dsd-debug-export") : null;
  if (exportBtn) {
    const originalHtml = exportBtn.innerHTML;
    exportBtn.innerHTML = icon("check", 16);
    exportBtn.classList.add("active");
    setTimeout(() => {
      exportBtn.innerHTML = originalHtml;
      exportBtn.classList.remove("active");
    }, 1500);
  }
}
function _navigateTab(direction) {
  const currentIndex = TABS.findIndex((t) => t.id === _activeTab);
  const newIndex = direction === "next" ? (currentIndex + 1) % TABS.length : (currentIndex - 1 + TABS.length) % TABS.length;
  _activeTab = TABS[newIndex].id;
  _saveState();
  _render();
}
function _goToTabByNumber(num) {
  const index = num === 0 ? 9 : num - 1;
  if (index >= 0 && index < TABS.length) {
    _activeTab = TABS[index].id;
    _saveState();
    _render();
  }
}
function _togglePinTab() {
  _pinnedTab = _pinnedTab === _activeTab ? null : _activeTab;
  _saveState();
  _render(true);
}
function _handleKeydown(e) {
  if (e.altKey && e.key === "F12") {
    e.preventDefault();
    toggle();
    return;
  }
  if (!_isOpen) return;
  if (e.key === "Escape") {
    e.preventDefault();
    close();
    return;
  }
  if (e.altKey && /^[0-9]$/.test(e.key)) {
    e.preventDefault();
    _goToTabByNumber(parseInt(e.key, 10));
    return;
  }
  if (e.target.tagName !== "INPUT" && e.target.tagName !== "TEXTAREA" && e.target.tagName !== "SELECT") {
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      _navigateTab("prev");
      return;
    }
    if (e.key === "ArrowRight") {
      e.preventDefault();
      _navigateTab("next");
      return;
    }
    if ((e.key === "r" || e.key === "R") && !e.ctrlKey && !e.metaKey) {
      e.preventDefault();
      _render();
      return;
    }
    if ((e.key === "f" || e.key === "F") && !e.ctrlKey && !e.metaKey) {
      e.preventDefault();
      const si = _panelElement ? _panelElement.querySelector("#dsd-debug-search") : null;
      if (si) si.focus();
      return;
    }
    if ((e.key === "c" || e.key === "C") && !e.ctrlKey && !e.metaKey) {
      e.preventDefault();
      _copyTabData();
      return;
    }
    if ((e.key === "p" || e.key === "P") && !e.ctrlKey && !e.metaKey) {
      e.preventDefault();
      _togglePinTab();
      return;
    }
    if ((e.key === "t" || e.key === "T") && !e.ctrlKey && !e.metaKey) {
      e.preventDefault();
      _toggleTheme();
      return;
    }
  }
}
function _renderTabContent() {
  const t0 = typeof performance !== "undefined" ? performance.now() : 0;
  const renderer = _tabRenderers[_activeTab];
  const result = renderer ? renderer() : "";
  if (typeof performance !== "undefined") {
    const elapsed = performance.now() - t0;
    if (!_renderTimings[_activeTab]) {
      _renderTimings[_activeTab] = { last: elapsed, avg: elapsed, max: elapsed, count: 1 };
    } else {
      const rt = _renderTimings[_activeTab];
      rt.count++;
      rt.last = elapsed;
      rt.avg = (rt.avg * (rt.count - 1) + elapsed) / rt.count;
      if (elapsed > rt.max) rt.max = elapsed;
    }
  }
  return result;
}
function _render(force) {
  if (!_panelElement) return;
  const now = Date.now();
  if (!force && now - _lastRenderTime < _RENDER_MIN_INTERVAL) return;
  if (!force) {
    const currentHash = _computeStateHash();
    if (currentHash === _lastRenderHash) return;
    _lastRenderHash = currentHash;
  }
  _lastRenderTime = now;
  recordHealthStatus(_handleError, _panelElement, (status) => {
    flashStatusChange(status, _panelElement);
  });
  _lastUpdateTs = now;
  const issueCount = getIssueCount(_handleError);
  const issueBadge = issueCount > 0 ? `<span class="dsd-ui-header__badge dsd-ui-status--unhealthy" aria-label="${issueCount} issues">${issueCount}</span>` : "";
  const conn = { appShell: !!getAppShell(), bootstrap: !!getBootstrap() };
  const connHtml = `<span class="dsd-ui-header__conn" title="AppShell: ${conn.appShell ? "Connected" : "Disconnected"} | Bootstrap: ${conn.bootstrap ? "Connected" : "Disconnected"}"><span class="dsd-ui-conn-dot ${conn.appShell ? "dsd-ui-conn-dot--on" : "dsd-ui-conn-dot--off"}" title="AppShell"></span><span class="dsd-ui-conn-dot ${conn.bootstrap ? "dsd-ui-conn-dot--on" : "dsd-ui-conn-dot--off"}" title="Bootstrap"></span></span>`;
  const tabIssues = getTabIssues();
  const netStats = getNetworkStats();
  if (netStats.failed > 0) tabIssues.network = true;
  const tabsHtml = TABS.map((tab, index) => {
    const active = tab.id === _activeTab;
    const shortcut = index < 9 ? index + 1 : index === 9 ? "0" : "";
    const title = tab.label + (shortcut ? ` (Alt+${shortcut})` : "");
    const hasIssue = tabIssues[tab.id] ? " has-issue" : "";
    const isPinned = _pinnedTab === tab.id;
    return `<button class="dsd-ui-tab${active ? " active" : ""}${hasIssue}${isPinned ? " pinned" : ""}" data-tab="${tab.id}" title="${title}" role="tab" aria-selected="${active}" aria-controls="dsd-tabpanel-${tab.id}">${icon(tab.icon, 18)}${tabIssues[tab.id] ? '<span class="dsd-ui-tab__dot"></span>' : ""}${isPinned ? '<span class="dsd-ui-tab__pin"></span>' : ""}</button>`;
  }).join("");
  const tsHtml = _lastUpdateTs > 0 ? `<span class="dsd-ui-header__ts" title="Last updated">${formatDate(_lastUpdateTs)}</span>` : "";
  const themeIcon = _isDarkTheme ? "moon" : "sun";
  _panelElement.setAttribute("role", "dialog");
  _panelElement.setAttribute("aria-label", `Debug Panel v${VERSION}`);
  _resizeAttached = false;
  _panelElement.innerHTML = `<div class="dsd-ui-resize-handle" title="Drag to resize"></div><div class="dsd-ui-header"><div class="dsd-ui-header__title">${icon("tool", 16)} Debug Panel <span class="dsd-ui-header__version">v${VERSION}</span>${connHtml}${issueBadge}${tsHtml}</div><div class="dsd-ui-header__actions"><button class="dsd-ui-btn dsd-ui-btn--icon" id="dsd-debug-export" title="Export Diagnostic" aria-label="Export diagnostic">${icon("fileText", 16)}</button><button class="dsd-ui-btn dsd-ui-btn--icon" id="dsd-debug-copy" title="Copy Tab Data (C)" aria-label="Copy tab data">${icon("clipboard", 16)}</button><button class="dsd-ui-btn dsd-ui-btn--icon${_pinnedTab === _activeTab ? " active" : ""}" id="dsd-debug-pin" title="Pin Tab (P)" aria-label="Pin tab">${icon("pin", 16)}</button><button class="dsd-ui-btn dsd-ui-btn--icon" id="dsd-debug-theme" title="Toggle Theme (T)" aria-label="Toggle theme">${icon(themeIcon, 16)}</button><button class="dsd-ui-btn dsd-ui-btn--icon${_isCompact ? " active" : ""}" id="dsd-debug-compact" title="Compact Mode" aria-label="Toggle compact mode">${icon("minimize", 16)}</button><button class="dsd-ui-btn dsd-ui-btn--icon" id="dsd-debug-refresh" title="Refresh (R)" aria-label="Refresh">${icon("refresh", 16)}</button><button class="dsd-ui-btn dsd-ui-btn--icon" id="dsd-debug-close" title="Close (Esc)" aria-label="Close panel">${icon("close", 16)}</button></div></div><div class="dsd-ui-tabs" role="tablist" aria-label="Debug panel tabs">${tabsHtml}</div><div class="dsd-ui-search"><input type="text" id="dsd-debug-search" class="dsd-ui-search__input" placeholder="Filter content... (F)" spellcheck="false" autocomplete="off" aria-label="Search panel content" /></div><div class="dsd-ui-content" id="dsd-tabpanel-${_activeTab}" role="tabpanel" aria-label="${_activeTab} tab content">${_renderTabContent()}</div>`;
  attachEventListeners(_panelElement, { searchQuery: _searchQuery }, {
    close,
    render() {
      _render();
    },
    forceRender() {
      _lastRenderHash = "";
      _render(true);
    },
    exportDiagnostic: _exportDiagnostic,
    copyTabData: _copyTabData,
    toggleCompact() {
      _isCompact = !_isCompact;
      if (_panelElement) {
        if (_isCompact) _panelElement.classList.add("dsd-ui-panel--compact");
        else _panelElement.classList.remove("dsd-ui-panel--compact");
      }
      _saveState();
      _render();
    },
    togglePinTab: _togglePinTab,
    toggleTheme: _toggleTheme,
    toggleSection: _toggleSection,
    clearNetwork() {
      clearNetworkRequests();
      _render(true);
    },
    scanIdb() {
      scanDatabases().then(() => {
        _render(true);
      });
    },
    runDiff(leftId, rightId) {
      setDiffLeft(leftId);
      setDiffRight(rightId);
      _activeTab = "diff";
      _render(true);
    },
    onSearchInput(value) {
      _searchQuery = value;
      _saveState();
      _applySearch();
    },
    switchTab(tabId) {
      _activeTab = tabId;
      _searchQuery = "";
      _saveState();
      _render();
    }
  });
  _initResize();
  if (_panelHeight && _panelElement) _panelElement.style.maxHeight = `${_panelHeight}px`;
  if (_searchQuery) _applySearch();
  _incrementMetric("refreshes");
}
function _injectStyles() {
  if (typeof document === "undefined") return;
  const linkId = "dsd-panel-ui-css";
  if (document.getElementById(linkId)) return;
  const link = document.createElement("link");
  link.id = linkId;
  link.rel = "stylesheet";
  link.href = "/components/app-shell/styles/_panel-ui.css";
  link.onerror = () => {
    _handleError("_injectStyles", new Error("Failed to load _panel-ui.css"));
  };
  document.head.appendChild(link);
}
function init() {
  if (_initialized) return true;
  if (typeof document === "undefined") return false;
  _loadState();
  _injectStyles();
  document.addEventListener("keydown", _handleKeydown);
  try {
    interceptNetwork();
  } catch (e) {
    _handleError("interceptNetwork", e);
  }
  _initialized = true;
  return true;
}
function open() {
  if (typeof document === "undefined") return false;
  if (!_panelElement) {
    _panelElement = document.createElement("div");
    _panelElement.id = PANEL_ID;
    _panelElement.className = `dsd-ui-panel dsd-ui-panel--debug${_isCompact ? " dsd-ui-panel--compact" : ""}${!_isDarkTheme ? " dsd-ui-panel--light" : ""}`;
    document.body.appendChild(_panelElement);
  }
  _isOpen = true;
  _panelElement.style.display = "flex";
  _lastRenderHash = "";
  if (_pinnedTab) {
    const validPin = TABS.some((t) => t.id === _pinnedTab);
    if (validPin) _activeTab = _pinnedTab;
  }
  _render(true);
  _saveState();
  _incrementMetric("opens");
  if (_refreshInterval) clearInterval(_refreshInterval);
  _refreshInterval = setInterval(() => {
    if (_isOpen) _render();
  }, 2e3);
  return true;
}
function close() {
  if (!_panelElement) return false;
  _isOpen = false;
  _panelElement.style.display = "none";
  _saveState();
  if (_refreshInterval) {
    clearInterval(_refreshInterval);
    _refreshInterval = null;
  }
  return true;
}
function toggle() {
  return _isOpen ? close() : open();
}
function isOpen() {
  return _isOpen;
}
function setActiveTab(tabId) {
  const valid = TABS.some((t) => t.id === tabId);
  if (valid) {
    _activeTab = tabId;
    _lastRenderHash = "";
    if (_isOpen) _render(true);
    _saveState();
  }
}
function refresh() {
  if (_isOpen) {
    _lastRenderHash = "";
    _render(true);
  }
}
function exportDiagnostic() {
  _exportDiagnostic();
}
function healthCheck() {
  const linkEl = document.getElementById("dsd-panel-ui-css");
  const stylesLoaded = !!(linkEl && linkEl.sheet);
  const checks = { initialized: _initialized, stylesInjected: !!linkEl, stylesLoaded, noErrors: _metrics.errors === 0 };
  const passed = Object.values(checks).filter(Boolean).length;
  const conn = { appShell: !!getAppShell(), bootstrap: !!getBootstrap() };
  const hh = getHealthHistory();
  const netStats = getNetworkStats();
  return { status: passed === 4 ? "HEALTHY" : "DEGRADED", score: `${passed}/4`, checks, isOpen: _isOpen, activeTab: _activeTab, tabs: TABS.length, issueCount: getIssueCount(_handleError), isCompact: _isCompact, pinnedTab: _pinnedTab, metrics: _metrics, renderTimings: _renderTimings, healthHistory: { entries: hh.length, last: hh.length > 0 ? hh[hh.length - 1] : null }, connections: conn, lastUpdate: _lastUpdateTs, networkRequests: netStats, version: VERSION, moduleId: MODULE_ID, timestamp: Date.now() };
}
function info() {
  const conn = { appShell: !!getAppShell(), bootstrap: !!getBootstrap() };
  return { moduleId: MODULE_ID, version: VERSION, architecture: "MODULAR", modules: { helpers: "1.1.0", healthTracker: "1.0.0", eventHandlers: "2.1.0", tabs: TABS.length }, initialized: _initialized, isOpen: _isOpen, activeTab: _activeTab, isCompact: _isCompact, pinnedTab: _pinnedTab, tabs: TABS.map((t) => t.id), tabCount: TABS.length, shortcuts: { toggle: "Alt+F12", close: "Escape", tabs: "Alt+1-0", navigate: "Arrow Left/Right", refresh: "R", search: "F", copy: "C", pin: "P", theme: "T" }, features: { issueCounter: true, compactMode: true, searchFilter: true, exportDiagnostic: true, smartRefresh: true, xssGuard: true, errorHandler: true, connectionIndicator: true, renderTimings: true, exportFeedback: true, ariaAccessibility: true, tabIssueDots: true, copyTabData: true, healthHistory: true, statusNotifications: true, autoSnapshotIssues: true, lazyRender: true, persistSearch: true, metricsCap: true, lastUpdateTimestamp: true, pinTab: true, rateLimitRefresh: true, networkTab: true, searchHighlight: true, themeToggle: true, collapseSections: true, fullDocs: true, diffViewer: true, indexedDB: true, resizeDrag: true }, metrics: _metrics, renderTimings: _renderTimings, connections: conn, lastUpdate: _lastUpdateTs, timestamp: Date.now() };
}
if (typeof document !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      init();
    });
  } else {
    init();
  }
}
var debug_panel_default = { VERSION, MODULE_ID, init, open, close, toggle, isOpen, setActiveTab, refresh, exportDiagnostic, healthCheck, info };
export {
  MODULE_ID,
  VERSION,
  close,
  debug_panel_default as default,
  exportDiagnostic,
  healthCheck,
  info,
  init,
  isOpen,
  open,
  refresh,
  setActiveTab,
  toggle
};
