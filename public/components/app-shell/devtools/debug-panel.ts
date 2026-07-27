
/**
 * @file Debug Panel — Orchestrator
 * @version 4.2.1-P2-ENTERPRISE
 * @module app-shell/devtools/debug-panel
 * 
 * ============================================================================
 * DEPENDENCY CONTRACT
 * ============================================================================
 * @requires ./panel/helpers.js (icon, sanitize, formatBytes, etc.)
 * @requires ./panel/event-handlers.js (attachEventListeners)
 * @requires ./panel/health-tracker.js (HealthTracker)
 * @requires ./panel/tabs/*.js (15 tab renderers)
 * 
 * @provides VERSION, MODULE_ID
 * @provides open, close, toggle, isOpen, setActiveTab
 * @provides refresh, forceRender, exportDiagnostic
 * @provides configure, getConfig, subscribe
 * @provides getMetrics, healthCheck, info
 * 
 * @browserAPI localStorage, DOM manipulation, keyboard events, ResizeObserver
 * 
 * @description
 * Debug panel orchestrator with modular tab architecture.
 * 15 tabs: overview, bootstrap, regions, events, network, performance,
 * state, snapshots, diff, regionMetrics, debugPresets, apiMetrics,
 * memory, indexeddb, docs.
 * 
 * Features: issue counter, compact mode, search/filter with highlight,
 * export diagnostic, smart refresh, XSS guard, error handler,
 * keyboard shortcuts (Alt+F12), drag resize, theme toggle, pin tab.
 * 
 * @example
 * import DebugPanel from './debug-panel.js';
 * DebugPanel.open();
 * DebugPanel.setActiveTab('performance');
 * ============================================================================
 */
// Debug Panel Enterprise - Unified UI (Modular Orchestrator)
// @version 4.2.1-P2-ENTERPRISE
// @description Orquestrador modular - delega tabs, helpers, health e eventos para submódulos
// @spec UI-UNIFICATION-SPEC.md
// @changelog v4.2.1-PHASE2C - Fix: riscos técnicos (#7 interceptor safety, #18 Firefox fallback, #23 touch+re-attach guard), imports órfãos removidos
// @changelog v4.2.0-PHASE2C - Bloco 4B: #14 (diff viewer), #18 (IndexedDB), #23 (resize drag)
// @changelog v4.1.0-PHASE2C - Bloco 4A: #7 (network tab), #25 (search highlight), #26 (theme toggle), #29 (collapse sections), #30 (full docs)
// @changelog v4.0.0-MODULAR - Item C: Modularização completa - 991 linhas → ~250 linhas orquestrador + 15 módulos
// @changelog v3.5.0-PHASE2B - Bloco 3: #6 (ARIA), #8 (tab issue dots), #9 (copy tab), #10 (health history), #11 (status notifications), #13 (auto-snapshot issues), #15 (lazy render), #20 (persist search), #22 (metrics cap), #24 (last update ts), #27 (pin tab), #28 (rate limit refresh)
// @changelog v3.4.0-PHASE2 - Fase 2: #2 (XSS guard), #3 (_handleError), #4 (smart refresh), #5 (export robustez), #12 (CSS healthCheck), #16 (connection indicator), #17 (render metrics), #21 (export feedback)
// @changelog v3.3.0-ENHANCED - Melhorias #14 (Contador Problemas), #15 (Modo Compacto), #17 (Busca/Filtro), #20 (Export Diagnóstico)
// @changelog v3.2.0-KEYBOARD - Melhoria #19: Atalhos de teclado para tabs (Alt+1-0, setas, Escape)
// @changelog v3.1.1-BOOTSTRAP - FIX: Corrigido _getBootstrap() - BootstrapV2 já é instância
// @changelog v3.1.0-BOOTSTRAP - Adicionada aba Bootstrap com métricas do Sprint 7
// @changelog v3.0.0-ENTERPRISE - UI unificada, SVG icons, CSS variables, aba Docs integrada
// @changelog v2.0.0-ENTERPRISE - Adicionadas abas: Snapshots, Region Metrics, Debug Presets, API Metrics, Memory
// @changelog v1.0.0 - Sprint 4: Melhoria #14 - Debug Panel Integration
'use strict';

// === MODULE IMPORTS ===
import { icon, formatDate, getAppShell, getBootstrap, setCollapsedSections, getCollapsedSections } from './panel/helpers.js';
import { recordHealthStatus, getIssueCount, getTabIssues, getHealthHistory, flashStatusChange, getMetricsCap } from './panel/health-tracker.js';
import { attachEventListeners } from './panel/event-handlers.js';

// Tab renderers
import { renderOverviewTab } from './panel/tabs/overview.js';
import { renderBootstrapTab } from './panel/tabs/bootstrap.js';
import { renderRegionsTab } from './panel/tabs/regions.js';
import { renderEventsTab } from './panel/tabs/events.js';
import { renderPerformanceTab } from './panel/tabs/performance.js';
import { renderStateTab } from './panel/tabs/state.js';
import { renderSnapshotsTab } from './panel/tabs/snapshots.js';
import { renderRegionMetricsTab } from './panel/tabs/region-metrics.js';
import { renderDebugPresetsTab } from './panel/tabs/debug-presets.js';
import { renderAPIMetricsTab } from './panel/tabs/api-metrics.js';
import { renderMemoryTab } from './panel/tabs/memory.js';
import { renderDocsTab } from './panel/tabs/docs.js';
import { renderNetworkTab, interceptNetwork, clearNetworkRequests, getNetworkStats } from './panel/tabs/network.js';
import { renderDiffViewer, setDiffLeft, setDiffRight } from './panel/tabs/diff-viewer.js';
import { renderIndexedDBTab, scanDatabases } from './panel/tabs/indexeddb.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export const VERSION = '4.2.1-P2-ENTERPRISE';
export const MODULE_ID = 'app-shell-debug-panel';

// === CONSTANTS ===
const PANEL_ID = 'dsd-debug-panel';
const STORAGE_KEY = 'dsd:debug-panel:state';
const COLLAPSED_KEY = 'dsd:debug-panel:collapsed';
const TABS = [
  { id: 'overview', label: 'Overview', icon: 'overview' },
  { id: 'bootstrap', label: 'Bootstrap', icon: 'zap' },
  { id: 'regions', label: 'Regions', icon: 'regions' },
  { id: 'events', label: 'Events', icon: 'events' },
  { id: 'network', label: 'Network', icon: 'wifi' },
  { id: 'performance', label: 'Performance', icon: 'performance' },
  { id: 'state', label: 'State', icon: 'state' },
  { id: 'snapshots', label: 'Snapshots', icon: 'snapshots' },
  { id: 'diff', label: 'Diff', icon: 'columns' },
  { id: 'regionMetrics', label: 'Metrics', icon: 'metrics' },
  { id: 'debugPresets', label: 'Presets', icon: 'presets' },
  { id: 'apiMetrics', label: 'APIs', icon: 'api' },
  { id: 'memory', label: 'Memory', icon: 'memory' },
  { id: 'indexeddb', label: 'IDB', icon: 'database' },
  { id: 'docs', label: 'Docs', icon: 'docs' }
];

// === STATE ===
let _isOpen = false;
let _activeTab = 'overview';
let _panelElement: DynObj = null;
let _refreshInterval: DynObj = null;
let _initialized = false;
let _isCompact = false;
let _searchQuery = '';
let _metrics = { opens: 0, refreshes: 0, errors: 0, exports: 0 };
let _lastRenderHash = '';
let _renderTimings = {};
let _lastUpdateTs = 0;
let _pinnedTab: DynObj = null;
let _lastRenderTime = 0;
const _RENDER_MIN_INTERVAL = 500;
let _isDarkTheme = true;
// #23 - Resize state
let _panelHeight: DynObj = null;
let _isResizing = false;
let _resizeAttached = false;

// === TAB RENDERER DISPATCH ===
const _tabRenderers = {
  overview: renderOverviewTab,
  bootstrap: renderBootstrapTab,
  regions: renderRegionsTab,
  events: renderEventsTab,
  network: renderNetworkTab,
  performance() { return renderPerformanceTab(_renderTimings); },
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

// === ERROR HANDLER ===
function _handleError(context: DynObj, error: DynObj) {
  _metrics.errors++;
  if (_metrics.errors > getMetricsCap()) _metrics.errors = getMetricsCap();
  const msg = `[DebugPanel][${context}] ${error && error.message ? error.message : String(error)}`;
  if (typeof console !== 'undefined' && console.warn) console.warn(msg);
}

function _incrementMetric(key: string) {
  (_metrics as DynObj)[key] = ((_metrics as DynObj)[key] || 0) + 1;
  if ((_metrics as DynObj)[key] > getMetricsCap()) (_metrics as DynObj)[key] = getMetricsCap();
}

// === STATE PERSISTENCE ===
function _saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      isOpen: _isOpen, activeTab: _activeTab, isCompact: _isCompact,
      searchQuery: _searchQuery, pinnedTab: _pinnedTab, isDarkTheme: _isDarkTheme,
      panelHeight: _panelHeight
    }));
  } catch (e: any) { _handleError('_saveState', e); }
}

function _loadState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const state = JSON.parse(saved);
      _activeTab = state.activeTab || 'overview';
      _isCompact = state.isCompact || false;
      _searchQuery = state.searchQuery || '';
      _pinnedTab = state.pinnedTab || null;
      _isDarkTheme = state.isDarkTheme !== undefined ? state.isDarkTheme : true;
      _panelHeight = state.panelHeight || null;
    }
  } catch (e: any) { _handleError('_loadState', e); }
  try {
    const collSaved = localStorage.getItem(COLLAPSED_KEY);
    if (collSaved) setCollapsedSections(JSON.parse(collSaved));
  } catch (e: any) { _handleError('_loadCollapsed', e); }
}

function _saveCollapsed() {
  try { localStorage.setItem(COLLAPSED_KEY, JSON.stringify(getCollapsedSections())); } catch (e: any) { _handleError('_saveCollapsed', e); }
}

function _toggleSection(sectionId: string) {
  const coll = getCollapsedSections();
  (coll as DynObj)[sectionId] = !(coll as DynObj)[sectionId];
  setCollapsedSections(coll);
  _saveCollapsed();
  _render(true);
}

// #26 - Theme toggle
function _toggleTheme() {
  const shell = getAppShell();
  if (shell && shell.theme && shell.theme.toggleTheme) { shell.theme.toggleTheme(); }
  _isDarkTheme = !_isDarkTheme;
  if (_panelElement) {
    if (_isDarkTheme) _panelElement.classList.remove('dsd-ui-panel--light');
    else _panelElement.classList.add('dsd-ui-panel--light');
  }
  _saveState(); _render(true);
}

// #23 - Resize drag (with touch support + re-attach guard)
function _handleResizeStart(startY: DynObj) {
  _isResizing = true;
  const startHeight = _panelElement.offsetHeight;
  if (_panelElement) _panelElement.classList.add('dsd-ui-panel--resizing');

  function onMove(clientY: DynObj) {
    if (!_isResizing || !_panelElement) return;
    const diff = startY - clientY;
    const newHeight = Math.max(200, Math.min(window.innerHeight - 40, startHeight + diff));
    _panelElement.style.maxHeight = `${newHeight}px`;
    _panelHeight = newHeight;
  }

  function cleanup() {
    _isResizing = false;
    if (_panelElement) _panelElement.classList.remove('dsd-ui-panel--resizing');
    _saveState();
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onEnd);
    document.removeEventListener('touchmove', onTouchMove);
    document.removeEventListener('touchend', onEnd);
    document.removeEventListener('touchcancel', onEnd);
  }

  function onMouseMove(ev: MouseEvent) { onMove(ev.clientY); }
  function onTouchMove(ev: TouchEvent) { if (ev.touches.length > 0) onMove(ev.touches[0].clientY); }
  function onEnd() { cleanup(); }

  document.addEventListener('mousemove', onMouseMove);
  document.addEventListener('mouseup', onEnd);
  document.addEventListener('touchmove', onTouchMove, { passive: true });
  document.addEventListener('touchend', onEnd);
  document.addEventListener('touchcancel', onEnd);
}

function _initResize() {
  if (!_panelElement || _resizeAttached) return;
  const handle = _panelElement.querySelector('.dsd-ui-resize-handle');
  if (!handle) return;
  _resizeAttached = true;

  handle.addEventListener('mousedown', (e: MouseEvent) => {
    e.preventDefault();
    _handleResizeStart(e.clientY);
  });

  handle.addEventListener('touchstart', (e: TouchEvent) => {
    if (e.touches.length === 1) {
      e.preventDefault();
      _handleResizeStart(e.touches[0].clientY);
    }
  }, { passive: false });
}

// === SMART REFRESH HASH ===
function _computeStateHash() {
  const shell = getAppShell();
  const bs = getBootstrap();
  const parts = [_activeTab, _isCompact, _searchQuery];
  if (shell) { try { const h = shell.healthCheck(); parts.push(h.status, h.score); } catch (e: any) { parts.push('err'); } }
  if (bs) { try { const bh = bs.healthCheck ? bs.healthCheck() : {}; parts.push(bh.status || 'N/A'); } catch (e: any) { parts.push('err'); } }
  if (typeof performance !== 'undefined' && (performance as any).memory) { parts.push(Math.round((performance as any).memory.usedJSHeapSize / 1048576) as DynObj); }
  return parts.join('|');
}

// === SEARCH FILTER + #25 HIGHLIGHT ===
function _applySearch() {
  if (!_panelElement) return;
  const content = _panelElement.querySelector('.dsd-ui-content');
  if (!content) return;
  const query = _searchQuery.toLowerCase().trim();
  const oldHighlights = content.querySelectorAll('.dsd-ui-highlight');
  oldHighlights.forEach((span: DynObj) => {
    const parent = span.parentNode;
    parent.replaceChild(document.createTextNode(span.textContent), span);
    parent.normalize();
  });
  const items = content.querySelectorAll('.dsd-ui-list-item, .dsd-ui-card, .dsd-ui-log-item, .dsd-ui-snapshot-item, .dsd-ui-region-metric, .dsd-ui-preset-btn');
  items.forEach((item: DynObj) => {
    if (!query) { item.style.display = ''; return; }
    item.style.display = item.textContent.toLowerCase().indexOf(query) !== -1 ? '' : 'none';
  });
  const sections = content.querySelectorAll('.dsd-ui-section');
  sections.forEach((section: DynObj) => {
    if (!query) { section.style.display = ''; return; }
    const visibleChildren = section.querySelectorAll('.dsd-ui-list-item:not([style*="display: none"]), .dsd-ui-card:not([style*="display: none"]), .dsd-ui-log-item:not([style*="display: none"]), .dsd-ui-snapshot-item:not([style*="display: none"]), .dsd-ui-region-metric:not([style*="display: none"]), .dsd-ui-preset-btn:not([style*="display: none"])');
    const title = section.querySelector('.dsd-ui-section__title');
    const titleMatch = title && title.textContent.toLowerCase().indexOf(query) !== -1;
    section.style.display = (visibleChildren.length > 0 || titleMatch) ? '' : 'none';
  });
  if (query) _highlightMatches(content, query);
}

function _highlightMatches(root: HTMLElement, query: string) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const parent = node.parentElement;
      if (!parent) return NodeFilter.FILTER_REJECT;
      const tag = parent.tagName;
      if (tag === 'BUTTON' || tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return NodeFilter.FILTER_REJECT;
      if (parent.classList.contains('dsd-ui-section__title') && parent.classList.contains('dsd-ui-section__title--collapsible')) return NodeFilter.FILTER_REJECT;
      if (parent.closest('.dsd-ui-header') || parent.closest('.dsd-ui-tabs') || parent.closest('.dsd-ui-search')) return NodeFilter.FILTER_REJECT;
      if (parent.style.display === 'none' || parent.closest('[style*="display: none"]')) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    }
  });
  const textNodes = [];
  while (walker.nextNode()) textNodes.push(walker.currentNode);
  textNodes.forEach(node => {
    const text = node.textContent;
    const lowerText = text!.toLowerCase();
    let idx = lowerText.indexOf(query);
    if (idx === -1) return;
    const frag = document.createDocumentFragment();
    let lastIdx = 0;
    while (idx !== -1) {
      if (idx > lastIdx) frag.appendChild(document.createTextNode(text!.substring(lastIdx, idx)));
      const span = document.createElement('span');
      span.className = 'dsd-ui-highlight';
      span.textContent = text!.substring(idx, idx + query.length);
      frag.appendChild(span);
      lastIdx = idx + query.length;
      idx = lowerText.indexOf(query, lastIdx);
    }
    if (lastIdx < text!.length) frag.appendChild(document.createTextNode(text!.substring(lastIdx)));
    // @ts-expect-error strict migration — TS18047
    node.parentNode.replaceChild(frag, node);
  });
}

// === COPY TAB DATA ===
function _copyTabData() {
  if (!_panelElement) return;
  const content = _panelElement.querySelector('.dsd-ui-content');
  if (!content) return;
  const text = content.innerText || content.textContent || '';
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => { _showCopyFeedback(); });
    } else {
      const ta = document.createElement('textarea');
      ta.value = text; ta.style.position = 'fixed'; ta.style.left = '-9999px';
      document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta);
      _showCopyFeedback();
    }
  } catch (e: any) { _handleError('_copyTabData', e); }
}

function _showCopyFeedback() {
  const copyBtn = _panelElement ? _panelElement.querySelector('#dsd-debug-copy') : null;
  if (!copyBtn) return;
  const orig = copyBtn.innerHTML;
  copyBtn.innerHTML = icon('check', 16); copyBtn.classList.add('active');
  setTimeout(() => { copyBtn.innerHTML = orig; copyBtn.classList.remove('active'); }, 1500);
}

// === EXPORT DIAGNOSTIC ===
function _exportDiagnostic() {
  const shell = getAppShell();
  const bs = getBootstrap();
  const netStats = getNetworkStats();
  const diagnostic = {
    timestamp: new Date().toISOString(),
    debugPanel: { version: VERSION, activeTab: _activeTab, isCompact: _isCompact, metrics: _metrics, issueCount: getIssueCount(_handleError), renderTimings: _renderTimings, healthHistory: getHealthHistory(), networkStats: netStats },
    appShell: null as DynObj, bootstrap: null as DynObj,
    browser: { userAgent: navigator.userAgent, language: navigator.language, online: navigator.onLine, url: window.location.href },
    performance: null as DynObj
  };
  if (shell) {
    diagnostic.appShell = {};
    try { diagnostic.appShell.info = shell.info(); } catch (e: any) { diagnostic.appShell.info = { error: e.message }; _handleError('export:shell.info', e); }
    try { diagnostic.appShell.health = shell.healthCheck(); } catch (e: any) { diagnostic.appShell.health = { error: e.message }; _handleError('export:shell.health', e); }
    try { diagnostic.appShell.regionMetrics = shell.regionMetrics ? shell.regionMetrics.getAllMetrics() : null; } catch (e: any) { diagnostic.appShell.regionMetrics = { error: e.message }; }
    try { diagnostic.appShell.apiMetrics = shell.apiMetrics ? { topAPIs: shell.apiMetrics.getTopAPIs(10), errors: shell.apiMetrics.getAPIsWithErrors() } : null; } catch (e: any) { diagnostic.appShell.apiMetrics = { error: e.message }; }
    try { diagnostic.appShell.memoryLeaks = shell.memoryLeaks ? shell.memoryLeaks.info() : null; } catch (e: any) { diagnostic.appShell.memoryLeaks = { error: e.message }; }
    try { diagnostic.appShell.snapshots = shell.stateSnapshots ? { count: shell.stateSnapshots.getAll().length, metrics: shell.stateSnapshots.getMetrics() } : null; } catch (e: any) { diagnostic.appShell.snapshots = { error: e.message }; }
  }
  if (bs) {
    diagnostic.bootstrap = {};
    try { diagnostic.bootstrap.version = bs.VERSION || 'N/A'; } catch (e: any) { diagnostic.bootstrap.version = 'error'; }
    try { diagnostic.bootstrap.health = bs.healthCheck ? bs.healthCheck() : null; } catch (e: any) { diagnostic.bootstrap.health = { error: e.message }; }
    try { diagnostic.bootstrap.network = bs.getNetworkInfo ? bs.getNetworkInfo() : null; } catch (e: any) { diagnostic.bootstrap.network = { error: e.message }; }
    try { diagnostic.bootstrap.lazy = bs.getLazyStats ? bs.getLazyStats() : null; } catch (e: any) { diagnostic.bootstrap.lazy = { error: e.message }; }
    try { diagnostic.bootstrap.cancelled = bs.isBootCancelled ? bs.isBootCancelled() : false; } catch (e: any) { diagnostic.bootstrap.cancelled = 'error'; }
  }
  try {
    const perf = typeof performance !== 'undefined' ? performance : null;
    if (perf && (perf as any).memory) { diagnostic.performance = { usedJSHeapSize: (perf as any).memory.usedJSHeapSize, totalJSHeapSize: (perf as any).memory.totalJSHeapSize, jsHeapSizeLimit: (perf as any).memory.jsHeapSizeLimit }; }
  } catch (e: any) { diagnostic.performance = { error: e.message }; }
  try {
    const blob = new Blob([JSON.stringify(diagnostic, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `dshowdash-diagnostic-${Date.now()}.json`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
    _incrementMetric('exports');
  } catch (e: any) { _handleError('export:download', e); }
  const exportBtn = _panelElement ? _panelElement.querySelector('#dsd-debug-export') : null;
  if (exportBtn) {
    const originalHtml = exportBtn.innerHTML;
    exportBtn.innerHTML = icon('check', 16); exportBtn.classList.add('active');
    setTimeout(() => { exportBtn.innerHTML = originalHtml; exportBtn.classList.remove('active'); }, 1500);
  }
}

// === KEYBOARD NAVIGATION ===
function _navigateTab(direction: DynObj) {
  const currentIndex = TABS.findIndex(t => t.id === _activeTab);
  const newIndex = direction === 'next' ? (currentIndex + 1) % TABS.length : (currentIndex - 1 + TABS.length) % TABS.length;
  _activeTab = TABS[newIndex].id; _saveState(); _render();
}

function _goToTabByNumber(num: DynObj) {
  const index = num === 0 ? 9 : num - 1;
  if (index >= 0 && index < TABS.length) { _activeTab = TABS[index].id; _saveState(); _render(); }
}

function _togglePinTab() {
  _pinnedTab = (_pinnedTab === _activeTab) ? null : _activeTab;
  _saveState(); _render(true);
}

function _handleKeydown(e: KeyboardEvent) {
  if (e.altKey && e.key === 'F12') { e.preventDefault(); toggle(); return; }
  if (!_isOpen) return;
  if (e.key === 'Escape') { e.preventDefault(); close(); return; }
  if (e.altKey && /^[0-9]$/.test(e.key)) { e.preventDefault(); _goToTabByNumber(parseInt(e.key, 10)); return; }
  if ((e.target as DynObj).tagName !== 'INPUT' && (e.target as DynObj).tagName !== 'TEXTAREA' && (e.target as DynObj).tagName !== 'SELECT') {
    if (e.key === 'ArrowLeft') { e.preventDefault(); _navigateTab('prev'); return; }
    if (e.key === 'ArrowRight') { e.preventDefault(); _navigateTab('next'); return; }
    if ((e.key === 'r' || e.key === 'R') && !e.ctrlKey && !e.metaKey) { e.preventDefault(); _render(); return; }
    if ((e.key === 'f' || e.key === 'F') && !e.ctrlKey && !e.metaKey) { e.preventDefault(); const si = _panelElement ? _panelElement.querySelector('#dsd-debug-search') : null; if (si) si.focus(); return; }
    if ((e.key === 'c' || e.key === 'C') && !e.ctrlKey && !e.metaKey) { e.preventDefault(); _copyTabData(); return; }
    if ((e.key === 'p' || e.key === 'P') && !e.ctrlKey && !e.metaKey) { e.preventDefault(); _togglePinTab(); return; }
    if ((e.key === 't' || e.key === 'T') && !e.ctrlKey && !e.metaKey) { e.preventDefault(); _toggleTheme(); return; }
  }
}

// === RENDER ENGINE ===
function _renderTabContent() {
  const t0 = typeof performance !== 'undefined' ? performance.now() : 0;
  const renderer = (_tabRenderers as DynObj)[_activeTab];
  const result = renderer ? renderer() : '';
  if (typeof performance !== 'undefined') {
    const elapsed = performance.now() - t0;
    if (!(_renderTimings as DynObj)[_activeTab]) { (_renderTimings as DynObj)[_activeTab] = { last: elapsed, avg: elapsed, max: elapsed, count: 1 }; }
    else { const rt = (_renderTimings as DynObj)[_activeTab]; rt.count++; rt.last = elapsed; rt.avg = ((rt.avg * (rt.count - 1)) + elapsed) / rt.count; if (elapsed > rt.max) rt.max = elapsed; }
  }
  return result;
}

function _render(force?: boolean) {
  if (!_panelElement) return;
  const now = Date.now();
  if (!force && (now - _lastRenderTime) < _RENDER_MIN_INTERVAL) return;
  if (!force) { const currentHash = _computeStateHash(); if (currentHash === _lastRenderHash) return; _lastRenderHash = currentHash; }
  _lastRenderTime = now;
  recordHealthStatus(_handleError, _panelElement, (status: DynObj) => { flashStatusChange(status, _panelElement); });
  _lastUpdateTs = now;
  const issueCount = getIssueCount(_handleError);
  const issueBadge = issueCount > 0 ? `<span class="dsd-ui-header__badge dsd-ui-status--unhealthy" aria-label="${issueCount} issues">${issueCount}</span>` : '';
  const conn = { appShell: !!getAppShell(), bootstrap: !!getBootstrap() };
  const connHtml = `<span class="dsd-ui-header__conn" title="AppShell: ${conn.appShell ? 'Connected' : 'Disconnected'} | Bootstrap: ${conn.bootstrap ? 'Connected' : 'Disconnected'}"><span class="dsd-ui-conn-dot ${conn.appShell ? 'dsd-ui-conn-dot--on' : 'dsd-ui-conn-dot--off'}" title="AppShell"></span><span class="dsd-ui-conn-dot ${conn.bootstrap ? 'dsd-ui-conn-dot--on' : 'dsd-ui-conn-dot--off'}" title="Bootstrap"></span></span>`;
  const tabIssues = getTabIssues();
  const netStats = getNetworkStats();
  if (netStats.failed > 0) tabIssues.network = true;
  const tabsHtml = TABS.map((tab, index) => {
    const active = tab.id === _activeTab;
    const shortcut = index < 9 ? (index + 1) : (index === 9 ? '0' : '');
    const title = tab.label + (shortcut ? ` (Alt+${shortcut})` : '');
    const hasIssue = tabIssues[tab.id] ? ' has-issue' : '';
    const isPinned = _pinnedTab === tab.id;
    return `<button class="dsd-ui-tab${active ? ' active' : ''}${hasIssue}${isPinned ? ' pinned' : ''}" data-tab="${tab.id}" title="${title}" role="tab" aria-selected="${active}" aria-controls="dsd-tabpanel-${tab.id}">${icon(tab.icon, 18)}${tabIssues[tab.id] ? '<span class="dsd-ui-tab__dot"></span>' : ''}${isPinned ? '<span class="dsd-ui-tab__pin"></span>' : ''}</button>`;
  }).join('');
  const tsHtml = _lastUpdateTs > 0 ? `<span class="dsd-ui-header__ts" title="Last updated">${formatDate(_lastUpdateTs)}</span>` : '';
  const themeIcon = _isDarkTheme ? 'moon' : 'sun';
  _panelElement.setAttribute('role', 'dialog');
  _panelElement.setAttribute('aria-label', `Debug Panel v${VERSION}`);
  // Reset resize guard antes de reescrever innerHTML (handle será destruído)
  _resizeAttached = false;
  _panelElement.innerHTML =
    `<div class="dsd-ui-resize-handle" title="Drag to resize"></div><div class="dsd-ui-header"><div class="dsd-ui-header__title">${icon('tool', 16)} Debug Panel <span class="dsd-ui-header__version">v${VERSION}</span>${connHtml}${issueBadge}${tsHtml}</div><div class="dsd-ui-header__actions"><button class="dsd-ui-btn dsd-ui-btn--icon" id="dsd-debug-export" title="Export Diagnostic" aria-label="Export diagnostic">${icon('fileText', 16)}</button><button class="dsd-ui-btn dsd-ui-btn--icon" id="dsd-debug-copy" title="Copy Tab Data (C)" aria-label="Copy tab data">${icon('clipboard', 16)}</button><button class="dsd-ui-btn dsd-ui-btn--icon${_pinnedTab === _activeTab ? ' active' : ''}" id="dsd-debug-pin" title="Pin Tab (P)" aria-label="Pin tab">${icon('pin', 16)}</button><button class="dsd-ui-btn dsd-ui-btn--icon" id="dsd-debug-theme" title="Toggle Theme (T)" aria-label="Toggle theme">${icon(themeIcon, 16)}</button><button class="dsd-ui-btn dsd-ui-btn--icon${_isCompact ? ' active' : ''}" id="dsd-debug-compact" title="Compact Mode" aria-label="Toggle compact mode">${icon('minimize', 16)}</button><button class="dsd-ui-btn dsd-ui-btn--icon" id="dsd-debug-refresh" title="Refresh (R)" aria-label="Refresh">${icon('refresh', 16)}</button><button class="dsd-ui-btn dsd-ui-btn--icon" id="dsd-debug-close" title="Close (Esc)" aria-label="Close panel">${icon('close', 16)}</button></div></div><div class="dsd-ui-tabs" role="tablist" aria-label="Debug panel tabs">${tabsHtml}</div><div class="dsd-ui-search"><input type="text" id="dsd-debug-search" class="dsd-ui-search__input" placeholder="Filter content... (F)" spellcheck="false" autocomplete="off" aria-label="Search panel content" /></div><div class="dsd-ui-content" id="dsd-tabpanel-${_activeTab}" role="tabpanel" aria-label="${_activeTab} tab content">${_renderTabContent()}</div>`;
  attachEventListeners(_panelElement, { searchQuery: _searchQuery }, {
    close, render() { _render(); }, forceRender() { _lastRenderHash = ''; _render(true); },
    exportDiagnostic: _exportDiagnostic, copyTabData: _copyTabData,
    toggleCompact() { _isCompact = !_isCompact; if (_panelElement) { if (_isCompact) _panelElement.classList.add('dsd-ui-panel--compact'); else _panelElement.classList.remove('dsd-ui-panel--compact'); } _saveState(); _render(); },
    togglePinTab: _togglePinTab,
    toggleTheme: _toggleTheme,
    toggleSection: _toggleSection,
    clearNetwork() { clearNetworkRequests(); _render(true); },
    scanIdb() { scanDatabases().then(() => { _render(true); }); },
    runDiff(leftId: string, rightId: string) { setDiffLeft(leftId); setDiffRight(rightId); _activeTab = 'diff'; _render(true); },
    onSearchInput(value: DynObj) { _searchQuery = value; _saveState(); _applySearch(); },
    switchTab(tabId: string) { _activeTab = tabId; _searchQuery = ''; _saveState(); _render(); }
  });
  // #23 - Re-attach resize after innerHTML rewrite
  _initResize();
  if (_panelHeight && _panelElement) _panelElement.style.maxHeight = `${_panelHeight}px`;
  if (_searchQuery) _applySearch();
  _incrementMetric('refreshes');
}

// === INJECT STYLES ===
function _injectStyles() {
  if (typeof document === 'undefined') return;
  const linkId = 'dsd-panel-ui-css';
  if (document.getElementById(linkId)) return;
  const link = document.createElement('link');
  link.id = linkId; link.rel = 'stylesheet';
  link.href = '/components/app-shell/styles/_panel-ui.css';
  link.onerror = () => { _handleError('_injectStyles', new Error('Failed to load _panel-ui.css')); };
  document.head.appendChild(link);
}

// === PUBLIC API ===
export function init() {
  if (_initialized) return true;
  if (typeof document === 'undefined') return false;
  _loadState(); _injectStyles(); document.addEventListener('keydown', _handleKeydown);
  try { interceptNetwork(); } catch (e: any) { _handleError('interceptNetwork', e); }
  _initialized = true; return true;
}

export function open() {
  if (typeof document === 'undefined') return false;
  if (!_panelElement) {
    _panelElement = document.createElement('div');
    _panelElement.id = PANEL_ID;
    _panelElement.className = `dsd-ui-panel dsd-ui-panel--debug${_isCompact ? ' dsd-ui-panel--compact' : ''}${!_isDarkTheme ? ' dsd-ui-panel--light' : ''}`;
    document.body.appendChild(_panelElement);
  }
  _isOpen = true; _panelElement.style.display = 'flex'; _lastRenderHash = '';
  if (_pinnedTab) { const validPin = TABS.some(t => t.id === _pinnedTab); if (validPin) _activeTab = _pinnedTab; }
  _render(true); _saveState(); _incrementMetric('opens');
  if (_refreshInterval) clearInterval(_refreshInterval);
  _refreshInterval = setInterval(() => { if (_isOpen) _render(); }, 2000);
  return true;
}

export function close() {
  if (!_panelElement) return false;
  _isOpen = false; _panelElement.style.display = 'none'; _saveState();
  if (_refreshInterval) { clearInterval(_refreshInterval); _refreshInterval = null; }
  return true;
}

export function toggle() { return _isOpen ? close() : open(); }
export function isOpen() { return _isOpen; }
export function setActiveTab(tabId: string) { const valid = TABS.some(t => t.id === tabId); if (valid) { _activeTab = tabId; _lastRenderHash = ''; if (_isOpen) _render(true); _saveState(); } }
export function refresh() { if (_isOpen) { _lastRenderHash = ''; _render(true); } }
export function exportDiagnostic() { _exportDiagnostic(); }

export function healthCheck() {
  const linkEl = document.getElementById('dsd-panel-ui-css');
  const stylesLoaded = !!(linkEl && (linkEl as any).sheet);
  const checks = { initialized: _initialized, stylesInjected: !!linkEl, stylesLoaded, noErrors: _metrics.errors === 0 };
  const passed = Object.values(checks).filter(Boolean).length;
  const conn = { appShell: !!getAppShell(), bootstrap: !!getBootstrap() };
  const hh = getHealthHistory();
  const netStats = getNetworkStats();
  return { status: passed === 4 ? 'HEALTHY' : 'DEGRADED', score: `${passed}/4`, checks, isOpen: _isOpen, activeTab: _activeTab, tabs: TABS.length, issueCount: getIssueCount(_handleError), isCompact: _isCompact, pinnedTab: _pinnedTab, metrics: _metrics, renderTimings: _renderTimings, healthHistory: { entries: hh.length, last: hh.length > 0 ? hh[hh.length - 1] : null }, connections: conn, lastUpdate: _lastUpdateTs, networkRequests: netStats, version: VERSION, moduleId: MODULE_ID, timestamp: Date.now() };
}

export function info() {
  const conn = { appShell: !!getAppShell(), bootstrap: !!getBootstrap() };
  return { moduleId: MODULE_ID, version: VERSION, architecture: 'MODULAR', modules: { helpers: '1.1.0', healthTracker: '1.0.0', eventHandlers: '2.1.0', tabs: TABS.length }, initialized: _initialized, isOpen: _isOpen, activeTab: _activeTab, isCompact: _isCompact, pinnedTab: _pinnedTab, tabs: TABS.map(t => t.id), tabCount: TABS.length, shortcuts: { toggle: 'Alt+F12', close: 'Escape', tabs: 'Alt+1-0', navigate: 'Arrow Left/Right', refresh: 'R', search: 'F', copy: 'C', pin: 'P', theme: 'T' }, features: { issueCounter: true, compactMode: true, searchFilter: true, exportDiagnostic: true, smartRefresh: true, xssGuard: true, errorHandler: true, connectionIndicator: true, renderTimings: true, exportFeedback: true, ariaAccessibility: true, tabIssueDots: true, copyTabData: true, healthHistory: true, statusNotifications: true, autoSnapshotIssues: true, lazyRender: true, persistSearch: true, metricsCap: true, lastUpdateTimestamp: true, pinTab: true, rateLimitRefresh: true, networkTab: true, searchHighlight: true, themeToggle: true, collapseSections: true, fullDocs: true, diffViewer: true, indexedDB: true, resizeDrag: true }, metrics: _metrics, renderTimings: _renderTimings, connections: conn, lastUpdate: _lastUpdateTs, timestamp: Date.now() };
}

// === AUTO-INIT ===
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', () => { init(); }); }
  else { init(); }
}

export default { VERSION, MODULE_ID, init, open, close, toggle, isOpen, setActiveTab, refresh, exportDiagnostic, healthCheck, info };
