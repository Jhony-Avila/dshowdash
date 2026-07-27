const VERSION = "1.0.0-ENTERPRISE";
const MODULE_ID = "overlay-layer.telemetry.debug-panel.ui.renderer";
import { getConfig, getOverlayLayer, getEventLog, getPanelElement, isVisible } from "../state.js";
function formatTime(ts) {
  const d = new Date(ts);
  const h = d.getHours().toString().padStart(2, "0");
  const m = d.getMinutes().toString().padStart(2, "0");
  const s = d.getSeconds().toString().padStart(2, "0");
  return `${h}:${m}:${s}`;
}
function renderHealthSection(health, status) {
  const healthClass = (health.status || "").toLowerCase();
  return `    <div class="overlay-debug-section">      <div class="overlay-debug-section-title">Health</div>      <div class="overlay-debug-row">        <span class="overlay-debug-label">Status</span>        <span class="overlay-debug-value ${healthClass}">${health.status || "N/A"}</span>      </div>      <div class="overlay-debug-row">        <span class="overlay-debug-label">Score</span>        <span class="overlay-debug-value">${health.scoreDisplay || "N/A"}</span>      </div>      <div class="overlay-debug-row">        <span class="overlay-debug-label">Kernel</span>        <span class="overlay-debug-value">${status.kernelIntegrated ? "\u2713" : "\u2717"} ${status.kernelMode || "N/A"}</span>      </div>      <div class="overlay-debug-row">        <span class="overlay-debug-label">Circuit Breaker</span>        <span class="overlay-debug-value">${status.circuitBreakerState || "N/A"}</span>      </div>    </div>  `;
}
function renderMetricsSection(metrics, status) {
  return `    <div class="overlay-debug-section">      <div class="overlay-debug-section-title">Metrics</div>      <div class="overlay-debug-row">        <span class="overlay-debug-label">Active</span>        <span class="overlay-debug-value">${status.activeCount || 0}</span>      </div>      <div class="overlay-debug-row">        <span class="overlay-debug-label">Total Opens</span>        <span class="overlay-debug-value">${metrics.totalOpens || 0}</span>      </div>      <div class="overlay-debug-row">        <span class="overlay-debug-label">Total Closes</span>        <span class="overlay-debug-value">${metrics.totalCloses || 0}</span>      </div>      <div class="overlay-debug-row">        <span class="overlay-debug-label">Queue Size</span>        <span class="overlay-debug-value">${status.pendingQueueSize || 0}</span>      </div>      <div class="overlay-debug-row">        <span class="overlay-debug-label">Focus Trapped</span>        <span class="overlay-debug-value">${status.focusTrapped ? "Yes" : "No"}</span>      </div>    </div>  `;
}
function renderStackSection(stack, overlayLayer) {
  let html = `    <div class="overlay-debug-section">      <div class="overlay-debug-section-title">Stack (${stack.length})</div>  `;
  const overlays = overlayLayer.debug && overlayLayer.debug.getStore && overlayLayer.debug.getStore().overlays || {};
  const displayStack = stack.slice(-5).reverse();
  for (let i = 0; i < displayStack.length; i++) {
    const id = displayStack[i];
    const overlay = overlays[id] || {};
    const zIndex = overlay.config && overlay.config.zIndex || "auto";
    html += `      <div class="overlay-debug-stack-item">        <strong>${overlay.type || "unknown"}</strong> - ${id.slice(0, 12)}...        <br>scope: ${overlay.scope || "global"} | z: ${zIndex}      </div>    `;
  }
  if (stack.length > 5) {
    html += `<div style="opacity:0.5;font-size:10px;">...and ${stack.length - 5} more</div>`;
  }
  html += "</div>";
  return html;
}
function renderEventsSection(eventLog) {
  let html = '    <div class="overlay-debug-section">      <div class="overlay-debug-section-title">Recent Events</div>  ';
  const displayEvents = eventLog.slice(-10).reverse();
  for (let i = 0; i < displayEvents.length; i++) {
    const event = displayEvents[i];
    const idPart = event.id ? ` - ${event.id.slice(0, 8)}` : "";
    html += `      <div class="overlay-debug-event">        <span class="overlay-debug-event-time">${formatTime(event.timestamp)}</span>        <span class="overlay-debug-event-type">${event.type}</span>        ${idPart}      </div>    `;
  }
  html += "</div>";
  return html;
}
function renderActionsSection() {
  return '    <div class="overlay-debug-actions">      <button class="overlay-debug-btn" onclick="window.__overlayDebugPanel?.closeAll()">Close All</button>      <button class="overlay-debug-btn" onclick="window.__overlayDebugPanel?.scanOrphans()">Scan Orphans</button>      <button class="overlay-debug-btn" onclick="window.__overlayDebugPanel?.exportInfo()">Export</button>    </div>  ';
}
function renderPanel() {
  const overlayLayer = getOverlayLayer();
  if (!overlayLayer) {
    return '<div class="overlay-debug-body">OverlayLayer not injected</div>';
  }
  const config = getConfig();
  const status = overlayLayer.status && overlayLayer.status() || {};
  const health = overlayLayer.healthCheck && overlayLayer.healthCheck() || {};
  const info = overlayLayer.info && overlayLayer.info() || {};
  const stack = overlayLayer.getStack && overlayLayer.getStack() || [];
  const eventLog = getEventLog();
  let html = `    <div class="overlay-debug-header" onclick="window.__overlayDebugPanel?.toggle()">      <span class="overlay-debug-title">\u{1F50D} Overlay Debug</span>      <span class="overlay-debug-status">${status.activeCount || 0} active | ${health.status || "N/A"}</span>    </div>  `;
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
    html += "</div>";
  }
  return html;
}
function refresh() {
  const panel = getPanelElement();
  if (!panel || !isVisible()) return;
  panel.innerHTML = renderPanel();
}
var renderer_default = {
  renderPanel,
  refresh
};
export {
  MODULE_ID,
  VERSION,
  renderer_default as default,
  refresh,
  renderPanel
};
