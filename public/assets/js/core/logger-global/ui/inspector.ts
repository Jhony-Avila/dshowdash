// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.1.0-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: logger-global-inspector
// PURPOSE: Logger Global - Interactive Inspector v1.1.0-ENTERPRISE
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   setBufferRef() — exported function
//   setLoggerRef() — exported function
//   open() — exported function
//   close() — exported function
//   toggle() — exported function
//   isOpen() — exported function
//   healthCheck() — exported function
//
// RECEIVES (via init/options): (none)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

export var VERSION = '1.1.0-ENTERPRISE';
export var MODULE_ID = 'logger-global-inspector';

var INSPECTOR_SVGS = {
  clipboard: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg>',
  refresh: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>',
  trash: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>',
  download: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>',
  x: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>'
};

interface BufferModule {
  getBuffer(): LogEntry[];
  clearBuffer?(): void;
}

interface LogEntry {
  level: string;
  timestamp: number;
  component: string;
  message: string;
  [key: string]: unknown;
}

var _bufferRef: BufferModule | null = null;
var _loggerRef: Record<string, unknown> | null = null;
var _isOpen = false;
var _container: HTMLDivElement | null = null;
var _filters = { level: 'all', component: '', search: '', autoRefresh: true };
var _refreshInterval: ReturnType<typeof setInterval> | null = null;

var STYLES = '.logger-inspector{position:fixed;bottom:0;right:0;width:500px;height:400px;background:#1a1a2e;color:#eee;font-family:"Consolas","Monaco",monospace;font-size:12px;border:1px solid #333;border-radius:8px 0 0 0;box-shadow:-2px -2px 10px rgba(0,0,0,0.3);z-index:99999;display:flex;flex-direction:column;overflow:hidden}.logger-inspector-header{background:#16213e;padding:8px 12px;display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #333}.logger-inspector-title{font-weight:bold;color:#4CAF50;display:flex;align-items:center;gap:6px}.logger-inspector-controls{display:flex;gap:8px}.logger-inspector-btn{background:#333;color:#fff;border:none;padding:4px 8px;border-radius:4px;cursor:pointer;font-size:11px;display:flex;align-items:center;gap:4px}.logger-inspector-btn:hover{background:#444}.logger-inspector-filters{background:#1f1f3d;padding:8px;display:flex;gap:8px;border-bottom:1px solid #333}.logger-inspector-filters select,.logger-inspector-filters input{background:#333;color:#fff;border:1px solid #444;padding:4px 8px;border-radius:4px;font-size:11px}.logger-inspector-logs{flex:1;overflow-y:auto;padding:8px}.logger-inspector-log{padding:4px 8px;border-bottom:1px solid #222;cursor:pointer}.logger-inspector-log:hover{background:#2a2a4e}.logger-inspector-log.level-error{border-left:3px solid #F44336}.logger-inspector-log.level-warn{border-left:3px solid #FF9800}.logger-inspector-log.level-info{border-left:3px solid #4CAF50}.logger-inspector-log.level-debug{border-left:3px solid #2196F3}.logger-inspector-log.level-critical{border-left:3px solid #9C27B0}.logger-inspector-time{color:#888;margin-right:8px}.logger-inspector-level{font-weight:bold;margin-right:8px}.logger-inspector-component{color:#64B5F6;margin-right:8px}.logger-inspector-message{color:#ddd}.logger-inspector-footer{background:#16213e;padding:6px 12px;font-size:10px;color:#888;border-top:1px solid #333}';

function injectStyles() { if (document.getElementById('logger-inspector-styles')) return; var style = document.createElement('style'); style.id = 'logger-inspector-styles'; style.textContent = STYLES; document.head.appendChild(style); }

function createContainer() {
  if (_container) return _container;
  injectStyles();
  _container = document.createElement('div');
  _container.className = 'logger-inspector';
  _container.innerHTML = '<div class="logger-inspector-header"><span class="logger-inspector-title">' + INSPECTOR_SVGS.clipboard + ' Logger Inspector</span><div class="logger-inspector-controls"><button class="logger-inspector-btn" id="li-refresh">' + INSPECTOR_SVGS.refresh + ' Refresh</button><button class="logger-inspector-btn" id="li-clear">' + INSPECTOR_SVGS.trash + ' Clear</button><button class="logger-inspector-btn" id="li-export">' + INSPECTOR_SVGS.download + ' Export</button><button class="logger-inspector-btn" id="li-close">' + INSPECTOR_SVGS.x + '</button></div></div><div class="logger-inspector-filters"><select id="li-level"><option value="all">All Levels</option><option value="critical">Critical</option><option value="error">Error</option><option value="warn">Warn</option><option value="info">Info</option><option value="debug">Debug</option><option value="trace">Trace</option></select><input type="text" id="li-component" placeholder="Component..." /><input type="text" id="li-search" placeholder="Search..." style="flex:1" /></div><div class="logger-inspector-logs" id="li-logs"></div><div class="logger-inspector-footer" id="li-footer">Ready</div>';
  document.body.appendChild(_container);
  bindEvents();
  return _container;
}

function bindEvents() {
  // @ts-expect-error strict migration — TS2531
  document.getElementById('li-close').onclick = close;
  // @ts-expect-error strict migration — TS2531
  document.getElementById('li-refresh').onclick = refresh;
  // @ts-expect-error strict migration — TS2531
  document.getElementById('li-clear').onclick = clearLogs;
  // @ts-expect-error strict migration — TS2531
  document.getElementById('li-export').onclick = exportLogs;
  // @ts-expect-error strict migration — TS2531
  document.getElementById('li-level').onchange = function(e: Event) { _filters.level = (e.target as HTMLSelectElement).value; refresh(); };
  // @ts-expect-error strict migration — TS2531
  document.getElementById('li-component').oninput = function(e: Event) { _filters.component = (e.target as HTMLInputElement).value; refresh(); };
  // @ts-expect-error strict migration — TS2531
  document.getElementById('li-search').oninput = function(e: Event) { _filters.search = (e.target as HTMLInputElement).value; refresh(); };
}

function renderLogs(logs: LogEntry[]) {
  var container = document.getElementById('li-logs');
  if (!container) return;
  container.innerHTML = '';
  logs.forEach(function(entry: LogEntry) {
    var div = document.createElement('div');
    div.className = 'logger-inspector-log level-' + entry.level;
    var time = new Date(entry.timestamp as number).toLocaleTimeString();
    div.innerHTML = '<span class="logger-inspector-time">' + time + '</span><span class="logger-inspector-level">' + (entry.level as string).toUpperCase() + '</span><span class="logger-inspector-component">[' + entry.component + ']</span><span class="logger-inspector-message">' + escapeHtml((entry.message as string).substring(0, 100)) + '</span>';
    div.onclick = function() { console.log('Log Details:', entry); };
    container!.appendChild(div);
  });
  container.scrollTop = container.scrollHeight;
  var footer = document.getElementById('li-footer');
  if (footer) { footer.textContent = 'Showing ' + logs.length + ' logs | Last update: ' + new Date().toLocaleTimeString(); }
}

function escapeHtml(text: string) { var div = document.createElement('div'); div.textContent = text; return div.innerHTML; }
function applyFilters(logs: LogEntry[]) { return logs.filter(function(entry: LogEntry) { if (_filters.level !== 'all' && entry.level !== _filters.level) return false; if (_filters.component && (entry.component as string).indexOf(_filters.component) === -1) return false; if (_filters.search && (entry.message as string).indexOf(_filters.search) === -1) return false; return true; }); }
function refresh() { if (!_bufferRef) return; var logs = _bufferRef.getBuffer(); var filtered = applyFilters(logs); renderLogs(filtered); }
function clearLogs() { if (_bufferRef && _bufferRef.clearBuffer) { _bufferRef.clearBuffer(); } refresh(); }
function exportLogs() { if (!_bufferRef) return; var logs = _bufferRef.getBuffer(); var data = JSON.stringify(logs, null, 2); var blob = new Blob([data], { type: 'application/json' }); var url = URL.createObjectURL(blob); var a = document.createElement('a'); a.href = url; a.download = 'logs-' + Date.now() + '.json'; a.click(); URL.revokeObjectURL(url); }

export function setBufferRef(bufferModule: BufferModule) { _bufferRef = bufferModule; }
export function setLoggerRef(logger: Record<string, unknown>) { _loggerRef = logger; }
export function open() { if (_isOpen) return; createContainer(); if (_container) { _container.style.display = 'flex'; } _isOpen = true; refresh(); if (_filters.autoRefresh) { _refreshInterval = setInterval(refresh, 2000); } }
export function close() { if (!_isOpen) return; if (_container) { _container.style.display = 'none'; } if (_refreshInterval) { clearInterval(_refreshInterval as ReturnType<typeof setInterval>); _refreshInterval = null; } _isOpen = false; }
export function toggle() { if (_isOpen) { close(); } else { open(); } }
export function isOpen() { return _isOpen; }

if (typeof window !== 'undefined') { window.addEventListener('keydown', function(e) { if (e.ctrlKey && e.shiftKey && e.key === 'L') { e.preventDefault(); toggle(); } }); }

export function healthCheck() { return { status: _bufferRef ? 'HEALTHY' : 'DEGRADED', version: VERSION, moduleId: MODULE_ID, isOpen: _isOpen, bufferAvailable: !!_bufferRef, shortcut: 'Ctrl+Shift+L' }; }
