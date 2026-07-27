// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: overlay-layer.telemetry.debug-panel.ui.renderer
// PURPOSE: Debug Panel - Renderer
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   getConfig, getOverlayLayer, getEventLog, getPanelElement, isVisible from ../state.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   renderPanel() — exported function
//   refresh() — exported function
//
// RECEIVES (via init/options): (none)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   window.__overlayDebugPanel
// ═══════════════════════════════════════════════════════════════
'use strict';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;
export const VERSION = '1.0.0-ENTERPRISE';
export const MODULE_ID = 'overlay-layer.telemetry.debug-panel.ui.renderer';

import { getConfig, getOverlayLayer, getEventLog, getPanelElement, isVisible } from '../state.js';


// ============================================================================
// HELPERS
// ============================================================================

/**
 * Formata timestamp
 * @param {number} ts
 * @returns {string}
 */
function formatTime(ts: DynObj) {
  const d = new Date(ts);
  const h = d.getHours().toString().padStart(2, '0');
  const m = d.getMinutes().toString().padStart(2, '0');
  const s = d.getSeconds().toString().padStart(2, '0');
  return `${h}:${m}:${s}`;
}

// ============================================================================
// SECTION RENDERERS
// ============================================================================

/**
 * Renderiza seção de health
 * @param {Object} health
 * @param {Object} status
 * @returns {string}
 */
function renderHealthSection(health: DynObj, status: DynObj) {
  const healthClass = (health.status || '').toLowerCase();
  
  return `\
    <div class="overlay-debug-section">\
      <div class="overlay-debug-section-title">Health</div>\
      <div class="overlay-debug-row">\
        <span class="overlay-debug-label">Status</span>\
        <span class="overlay-debug-value ${healthClass}">${health.status || 'N/A'}</span>\
      </div>\
      <div class="overlay-debug-row">\
        <span class="overlay-debug-label">Score</span>\
        <span class="overlay-debug-value">${health.scoreDisplay || 'N/A'}</span>\
      </div>\
      <div class="overlay-debug-row">\
        <span class="overlay-debug-label">Kernel</span>\
        <span class="overlay-debug-value">${status.kernelIntegrated ? '✓' : '✗'} ${status.kernelMode || 'N/A'}</span>\
      </div>\
      <div class="overlay-debug-row">\
        <span class="overlay-debug-label">Circuit Breaker</span>\
        <span class="overlay-debug-value">${status.circuitBreakerState || 'N/A'}</span>\
      </div>\
    </div>\
  `;
}

/**
 * Renderiza seção de métricas
 * @param {Object} metrics
 * @param {Object} status
 * @returns {string}
 */
function renderMetricsSection(metrics: DynObj, status: DynObj) {
  return `\
    <div class="overlay-debug-section">\
      <div class="overlay-debug-section-title">Metrics</div>\
      <div class="overlay-debug-row">\
        <span class="overlay-debug-label">Active</span>\
        <span class="overlay-debug-value">${status.activeCount || 0}</span>\
      </div>\
      <div class="overlay-debug-row">\
        <span class="overlay-debug-label">Total Opens</span>\
        <span class="overlay-debug-value">${metrics.totalOpens || 0}</span>\
      </div>\
      <div class="overlay-debug-row">\
        <span class="overlay-debug-label">Total Closes</span>\
        <span class="overlay-debug-value">${metrics.totalCloses || 0}</span>\
      </div>\
      <div class="overlay-debug-row">\
        <span class="overlay-debug-label">Queue Size</span>\
        <span class="overlay-debug-value">${status.pendingQueueSize || 0}</span>\
      </div>\
      <div class="overlay-debug-row">\
        <span class="overlay-debug-label">Focus Trapped</span>\
        <span class="overlay-debug-value">${status.focusTrapped ? 'Yes' : 'No'}</span>\
      </div>\
    </div>\
  `;
}

/**
 * Renderiza seção de stack
 * @param {Array} stack
 * @param {Object} overlayLayer
 * @returns {string}
 */
function renderStackSection(stack: DynObj, overlayLayer: DynObj) {
  let html = `\
    <div class="overlay-debug-section">\
      <div class="overlay-debug-section-title">Stack (${stack.length})</div>\
  `;
  
  const overlays = (overlayLayer.debug && overlayLayer.debug.getStore && overlayLayer.debug.getStore().overlays) || {};
  const displayStack = stack.slice(-5).reverse();
  
  for (let i = 0; i < displayStack.length; i++) {
    const id = displayStack[i];
    const overlay = overlays[id] || {};
    const zIndex = (overlay.config && overlay.config.zIndex) || 'auto';
    
    html += `\
      <div class="overlay-debug-stack-item">\
        <strong>${overlay.type || 'unknown'}</strong> - ${id.slice(0, 12)}...\
        <br>scope: ${overlay.scope || 'global'} | z: ${zIndex}\
      </div>\
    `;
  }
  
  if (stack.length > 5) {
    html += `<div style="opacity:0.5;font-size:10px;">...and ${stack.length - 5} more</div>`;
  }
  
  html += '</div>';
  return html;
}

/**
 * Renderiza seção de eventos
 * @param {Array} eventLog
 * @returns {string}
 */
function renderEventsSection(eventLog: DynObj) {
  let html = '\
    <div class="overlay-debug-section">\
      <div class="overlay-debug-section-title">Recent Events</div>\
  ';
  
  const displayEvents = eventLog.slice(-10).reverse();
  
  for (let i = 0; i < displayEvents.length; i++) {
    const event = displayEvents[i];
    const idPart = event.id ? ` - ${event.id.slice(0, 8)}` : '';
    
    html += `\
      <div class="overlay-debug-event">\
        <span class="overlay-debug-event-time">${formatTime(event.timestamp)}</span>\
        <span class="overlay-debug-event-type">${event.type}</span>\
        ${idPart}\
      </div>\
    `;
  }
  
  html += '</div>';
  return html;
}

/**
 * Renderiza seção de ações
 * @returns {string}
 */
function renderActionsSection() {
  return '\
    <div class="overlay-debug-actions">\
      <button class="overlay-debug-btn" onclick="window.__overlayDebugPanel?.closeAll()">Close All</button>\
      <button class="overlay-debug-btn" onclick="window.__overlayDebugPanel?.scanOrphans()">Scan Orphans</button>\
      <button class="overlay-debug-btn" onclick="window.__overlayDebugPanel?.exportInfo()">Export</button>\
    </div>\
  ';
}

// ============================================================================
// MAIN RENDERER
// ============================================================================

/**
 * Renderiza o painel completo
 * @returns {string}
 */
export function renderPanel() {
  const overlayLayer = getOverlayLayer();
  
  if (!overlayLayer) {
    return '<div class="overlay-debug-body">OverlayLayer not injected</div>';
  }
  
  const config = getConfig();
  const status = (overlayLayer.status && overlayLayer.status()) || {};
  const health = (overlayLayer.healthCheck && overlayLayer.healthCheck()) || {};
  const info = (overlayLayer.info && overlayLayer.info()) || {};
  const stack = (overlayLayer.getStack && overlayLayer.getStack()) || [];
  const eventLog = getEventLog();
  
  let html = `\
    <div class="overlay-debug-header" onclick="window.__overlayDebugPanel?.toggle()">\
      <span class="overlay-debug-title">🔍 Overlay Debug</span>\
      <span class="overlay-debug-status">${status.activeCount || 0} active | ${health.status || 'N/A'}</span>\
    </div>\
  `;
  
  if (!config.collapsed) {
    html += '<div class="overlay-debug-body">';
    
    if (config.showHealth) {
      html += renderHealthSection(health, status);
    }
    
    if (config.showMetrics) {
      const metrics = info.metrics || {};
      html += renderMetricsSection(metrics, status);
    }
    
    if (config.showStack && stack.length > 0) {
      html += renderStackSection(stack, overlayLayer);
    }
    
    if (config.showEvents && eventLog.length > 0) {
      html += renderEventsSection(eventLog);
    }
    
    html += renderActionsSection();
    html += '</div>';
  }
  
  return html;
}

/**
 * Atualiza o painel
 */
export function refresh() {
  const panel = getPanelElement();
  if (!panel || !isVisible()) return;
  
  panel.innerHTML = renderPanel();
}

export default {
  renderPanel,
  refresh
};
