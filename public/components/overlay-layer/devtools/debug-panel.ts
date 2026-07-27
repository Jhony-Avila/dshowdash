
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0)
// ═══════════════════════════════════════════════════════════════
// MODULE: overlay-layer-debug-panel.devtools.debug-panel
// PURPOSE: Overlay Layer - Debug Panel v1.0.0
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   inject() — exported function
//   show() — exported function
//   hide() — exported function
//   toggle() — exported function
//   toggleCollapse() — exported function
//   logEvent() — exported function
//   clearEventLog() — exported function
//   closeAll() — exported function
//   scanOrphans() — exported function
//   exportInfo() — exported function
//   init() — exported function
//   destroy() — exported function
//   configure() — exported function
//   getConfig() — exported function
//   isVisible() — exported function
//   healthCheck() — exported function
//   info() — exported function
//
// RECEIVES (via init/options): (see init function)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   document.addEventListener
//   (window as any).__overlayDebugPanel
// ═══════════════════════════════════════════════════════════════
'use strict';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export const VERSION = '1.0.0';
export const MODULE_ID = 'overlay-layer-debug-panel.devtools.debug-panel';

// Configuração padrão
const DEFAULT_CONFIG = {
  enabled: false,
  position: 'bottom-right',
  collapsed: true,
  opacity: 0.95,
  showMetrics: true,
  showStack: true,
  showEvents: true,
  showHealth: true,
  maxEvents: 50,
  refreshInterval: 1000,
  hotkey: 'ctrl+shift+o'
};

// Estado interno
let _config = { ...DEFAULT_CONFIG };
let _state = {
  panelElement: null as DynObj,
  refreshIntervalId: null as DynObj,
  eventLog: [] as DynObj,
  isVisible: false
};

// Referências externas
let _overlayLayer: DynObj = null;

/**
 * Injeta dependências
 */
export function inject(dependencies: DynObj) {
  if (dependencies.overlayLayer) _overlayLayer = dependencies.overlayLayer;
}

/**
 * Estilos do painel
 */
const PANEL_STYLES = `
  .overlay-debug-panel {
    position: fixed;
    z-index: 99999;
    font-family: 'Monaco', 'Consolas', monospace;
    font-size: 11px;
    background: rgba(0, 0, 0, 0.92);
    color: #0f0;
    border: 1px solid #0f0;
    border-radius: 4px;
    max-width: 420px;
    max-height: 500px;
    overflow: hidden;
    box-shadow: 0 4px 20px rgba(0, 255, 0, 0.2);
  }
  .overlay-debug-panel.collapsed { max-height: 32px; }
  .overlay-debug-panel.bottom-right { bottom: 10px; right: 10px; }
  .overlay-debug-panel.bottom-left { bottom: 10px; left: 10px; }
  .overlay-debug-panel.top-right { top: 10px; right: 10px; }
  .overlay-debug-panel.top-left { top: 10px; left: 10px; }
  .overlay-debug-header {
    background: rgba(0, 255, 0, 0.1);
    padding: 6px 10px;
    cursor: pointer;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid #0f03;
  }
  .overlay-debug-header:hover { background: rgba(0, 255, 0, 0.2); }
  .overlay-debug-title { font-weight: bold; }
  .overlay-debug-status { font-size: 10px; opacity: 0.8; }
  .overlay-debug-body { padding: 8px; overflow-y: auto; max-height: 460px; }
  .overlay-debug-section { margin-bottom: 10px; padding-bottom: 8px; border-bottom: 1px solid #0f02; }
  .overlay-debug-section:last-child { border-bottom: none; margin-bottom: 0; }
  .overlay-debug-section-title { color: #0ff; font-weight: bold; margin-bottom: 4px; font-size: 10px; text-transform: uppercase; }
  .overlay-debug-row { display: flex; justify-content: space-between; padding: 2px 0; }
  .overlay-debug-label { opacity: 0.7; }
  .overlay-debug-value { font-weight: bold; }
  .overlay-debug-value.healthy { color: #0f0; }
  .overlay-debug-value.degraded { color: #ff0; }
  .overlay-debug-value.unhealthy { color: #f00; }
  .overlay-debug-stack-item { background: rgba(0, 255, 0, 0.05); padding: 4px 6px; margin: 2px 0; border-radius: 2px; font-size: 10px; }
  .overlay-debug-event { font-size: 10px; padding: 2px 0; opacity: 0.8; }
  .overlay-debug-event-time { color: #666; margin-right: 6px; }
  .overlay-debug-event-type { color: #0ff; }
  .overlay-debug-actions { display: flex; gap: 4px; margin-top: 8px; }
  .overlay-debug-btn { background: rgba(0, 255, 0, 0.1); border: 1px solid #0f0; color: #0f0; padding: 4px 8px; font-size: 10px; cursor: pointer; border-radius: 2px; }
  .overlay-debug-btn:hover { background: rgba(0, 255, 0, 0.2); }
`;

/**
 * Cria elemento do painel
 */
function createPanelElement() {
  if (typeof document !== 'undefined' && !document.getElementById('overlay-debug-styles')) {
    const styleEl = document.createElement('style');
    styleEl.id = 'overlay-debug-styles';
    styleEl.textContent = PANEL_STYLES;
    document.head.appendChild(styleEl);
  }
  
  const panel = document.createElement('div');
  panel.id = 'overlay-debug-panel';
  panel.className = `overlay-debug-panel ${_config.position} ${_config.collapsed ? 'collapsed' : ''}`;
  panel.style.opacity = String(_config.opacity);
  
  return panel;
}

/**
 * Formata timestamp
 */
function formatTime(ts: DynObj) {
  const d = new Date(ts);
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')}`;
}

/**
 * Gera HTML do painel
 */
function renderPanel() {
  if (!_overlayLayer) return '<div class="overlay-debug-body">OverlayLayer not injected</div>';
  
  const status = _overlayLayer.status?.() || {};
  const health = _overlayLayer.healthCheck?.() || {};
  const info = _overlayLayer.info?.() || {};
  const stack = _overlayLayer.getStack?.() || [];
  
  let html = `
    <div class="overlay-debug-header" onclick="(window as any).__overlayDebugPanel?.toggle()">
      <span class="overlay-debug-title">🔍 Overlay Debug</span>
      <span class="overlay-debug-status">${status.activeCount || 0} active | ${health.status || 'N/A'}</span>
    </div>
  `;
  
  if (!_config.collapsed) {
    html += '<div class="overlay-debug-body">';
    
    if (_config.showHealth) {
      const healthClass = (health.status || '').toLowerCase();
      html += `
        <div class="overlay-debug-section">
          <div class="overlay-debug-section-title">Health</div>
          <div class="overlay-debug-row"><span class="overlay-debug-label">Status</span><span class="overlay-debug-value ${healthClass}">${health.status || 'N/A'}</span></div>
          <div class="overlay-debug-row"><span class="overlay-debug-label">Score</span><span class="overlay-debug-value">${health.scoreDisplay || 'N/A'}</span></div>
          <div class="overlay-debug-row"><span class="overlay-debug-label">Kernel</span><span class="overlay-debug-value">${status.kernelIntegrated ? '✓' : '✗'} ${status.kernelMode || 'N/A'}</span></div>
          <div class="overlay-debug-row"><span class="overlay-debug-label">Circuit Breaker</span><span class="overlay-debug-value">${status.circuitBreakerState || 'N/A'}</span></div>
        </div>
      `;
    }
    
    if (_config.showMetrics) {
      const metrics = info.metrics || {};
      html += `
        <div class="overlay-debug-section">
          <div class="overlay-debug-section-title">Metrics</div>
          <div class="overlay-debug-row"><span class="overlay-debug-label">Active</span><span class="overlay-debug-value">${status.activeCount || 0}</span></div>
          <div class="overlay-debug-row"><span class="overlay-debug-label">Total Opens</span><span class="overlay-debug-value">${metrics.totalOpens || 0}</span></div>
          <div class="overlay-debug-row"><span class="overlay-debug-label">Queue Size</span><span class="overlay-debug-value">${status.pendingQueueSize || 0}</span></div>
          <div class="overlay-debug-row"><span class="overlay-debug-label">Focus Trapped</span><span class="overlay-debug-value">${status.focusTrapped ? 'Yes' : 'No'}</span></div>
        </div>
      `;
    }
    
    if (_config.showStack && stack.length > 0) {
      html += `<div class="overlay-debug-section"><div class="overlay-debug-section-title">Stack (${stack.length})</div>`;
      const overlays = _overlayLayer.debug?.getStore?.()?.overlays || {};
      for (const id of stack.slice(-5).reverse()) {
        const overlay = overlays[id] || {};
        html += `<div class="overlay-debug-stack-item"><strong>${overlay.type || 'unknown'}</strong> - ${id.slice(0, 12)}...<br>scope: ${overlay.scope || 'global'} | z: ${overlay.config?.zIndex || 'auto'}</div>`;
      }
      if (stack.length > 5) html += `<div style="opacity:0.5;font-size:10px;">...and ${stack.length - 5} more</div>`;
      html += '</div>';
    }
    
    if (_config.showEvents && _state.eventLog.length > 0) {
      html += `<div class="overlay-debug-section"><div class="overlay-debug-section-title">Recent Events</div>`;
      for (const event of _state.eventLog.slice(-10).reverse()) {
        html += `<div class="overlay-debug-event"><span class="overlay-debug-event-time">${formatTime(event.timestamp)}</span><span class="overlay-debug-event-type">${event.type}</span>${event.id ? ` - ${event.id.slice(0, 8)}` : ''}</div>`;
      }
      html += '</div>';
    }
    
    html += `
      <div class="overlay-debug-actions">
        <button class="overlay-debug-btn" onclick="(window as any).__overlayDebugPanel?.closeAll()">Close All</button>
        <button class="overlay-debug-btn" onclick="(window as any).__overlayDebugPanel?.scanOrphans()">Scan Orphans</button>
        <button class="overlay-debug-btn" onclick="(window as any).__overlayDebugPanel?.exportInfo()">Export</button>
      </div>
    </div>`;
  }
  
  return html;
}

function refresh() {
  if (!_state.panelElement || !_state.isVisible) return;
  _state.panelElement.innerHTML = renderPanel();
}

export function show() {
  if (typeof document === 'undefined') return { ok: false, error: 'no-document' };
  if (!_state.panelElement) {
    _state.panelElement = createPanelElement();
    document.body.appendChild(_state.panelElement);
  }
  _state.isVisible = true;
  _state.panelElement.style.display = 'block';
  refresh();
  if (!_state.refreshIntervalId && _config.refreshInterval > 0) {
    _state.refreshIntervalId = setInterval(refresh, _config.refreshInterval);
  }
  return { ok: true };
}

export function hide() {
  _state.isVisible = false;
  if (_state.panelElement) _state.panelElement.style.display = 'none';
  if (_state.refreshIntervalId) { clearInterval(_state.refreshIntervalId); _state.refreshIntervalId = null; }
  return { ok: true };
}

export function toggle() {
  if (_state.isVisible) hide(); else show();
  return { ok: true, visible: _state.isVisible };
}

export function toggleCollapse() {
  _config.collapsed = !_config.collapsed;
  if (_state.panelElement) { _state.panelElement.classList.toggle('collapsed', _config.collapsed); refresh(); }
  return { ok: true, collapsed: _config.collapsed };
}

export function logEvent(type: DynObj, data = {}) {
  _state.eventLog.push({ type, ...data, timestamp: Date.now() });
  while (_state.eventLog.length > _config.maxEvents) _state.eventLog.shift();
  if (_state.isVisible) refresh();
}

export function clearEventLog() { _state.eventLog = []; if (_state.isVisible) refresh(); return { ok: true }; }

export function closeAll() {
  if (_overlayLayer?.closeAll) { _overlayLayer.closeAll({ reason: 'debug-panel' }); logEvent('DEBUG_ACTION', { action: 'closeAll' }); }
}

export function scanOrphans() {
  if (_overlayLayer?.scanOrphans) {
    const result = _overlayLayer.scanOrphans();
    logEvent('DEBUG_ACTION', { action: 'scanOrphans', orphans: result?.orphans?.length || 0 });
  }
}

export function exportInfo() {
  if (_overlayLayer?.info) { console.log('[OverlayDebug] Full Info:', JSON.stringify(_overlayLayer.info(), null, 2)); logEvent('DEBUG_ACTION', { action: 'exportInfo' }); }
}

function setupHotkey() {
  if (typeof document === 'undefined') return;
  document.addEventListener('keydown', (e) => {
    const keys = _config.hotkey.toLowerCase().split('+');
    if (keys.includes('ctrl') === e.ctrlKey && keys.includes('shift') === e.shiftKey && keys.some(k => !['ctrl', 'shift', 'alt'].includes(k) && e.key.toLowerCase() === k)) {
      e.preventDefault(); toggle();
    }
  });
}

export function init(overlayLayerRef: DynObj) {
  if (overlayLayerRef) _overlayLayer = overlayLayerRef;
  setupHotkey();
  if (typeof window !== 'undefined') {
    (window as any).__overlayDebugPanel = { toggle: toggleCollapse, closeAll, scanOrphans, exportInfo };
  }
  _config.enabled = true;
  return { ok: true };
}

export function destroy() {
  hide();
  if (_state.panelElement?.parentNode) { _state.panelElement.parentNode.removeChild(_state.panelElement); _state.panelElement = null; }
  const styleEl = document.getElementById?.('overlay-debug-styles');
  if (styleEl) styleEl.remove();
  if (typeof window !== 'undefined') delete (window as any).__overlayDebugPanel;
  _config.enabled = false;
  return { ok: true };
}

export function configure(config: DynObj) {
  if (!config || typeof config !== 'object') return false;
  _config = { ..._config, ...config };
  if (_state.panelElement) {
    _state.panelElement.className = `overlay-debug-panel ${_config.position} ${_config.collapsed ? 'collapsed' : ''}`;
    _state.panelElement.style.opacity = String(_config.opacity);
  }
  return true;
}

export function getConfig() { return { ..._config }; }
export function isVisible() { return _state.isVisible; }

export function healthCheck() {
  const checks = { enabled: _config.enabled, overlayLayerInjected: !!_overlayLayer, panelCreated: !!_state.panelElement || !_state.isVisible };
  const passed = Object.values(checks).filter(Boolean).length;
  return { status: passed === 3 ? 'HEALTHY' : 'DEGRADED', score: `${passed}/3`, checks, visible: _state.isVisible, version: VERSION, moduleId: MODULE_ID, timestamp: Date.now() };
}

export function info() {
  return { moduleId: MODULE_ID, version: VERSION, enabled: _config.enabled, visible: _state.isVisible, collapsed: _config.collapsed, position: _config.position, hotkey: _config.hotkey, eventLogSize: _state.eventLog.length, timestamp: Date.now() };
}

export default {
  inject, init, destroy, show, hide, toggle, toggleCollapse, logEvent, clearEventLog, closeAll, scanOrphans, exportInfo, configure, getConfig, isVisible, healthCheck, info, VERSION, MODULE_ID
};
