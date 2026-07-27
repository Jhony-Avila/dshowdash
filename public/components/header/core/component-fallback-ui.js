import { escapeHtml } from "../utils/html-helpers.js";
const VERSION = "1.1.0-ES6";
const MODULE_ID = "header/core/component-fallback-ui";
const ICONS = {
  clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
  bell: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>',
  alert: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
  user: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
  refresh: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>',
  error: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
  generic: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>'
};
const COMPONENT_ICONS = {
  "real-time-clock": "clock",
  "notifications": "bell",
  "errors-status": "alert",
  "user-menu": "user",
  "logo": "generic"
};
const COMPONENT_LABELS = {
  "real-time-clock": "Relogio",
  "notifications": "Notificacoes",
  "errors-status": "Status",
  "user-menu": "Menu",
  "logo": "Logo"
};
const _metrics = {
  fallbacksCreated: 0,
  fallbacksRemoved: 0,
  retryClicks: 0
};
const _activeFallbacks = /* @__PURE__ */ new Map();
function _createFallbackHTML(componentName, errorMessage, options) {
  options = options || {};
  const showRetry = options.showRetry !== false;
  const showError = options.showError !== false;
  const compact = options.compact || false;
  const iconKey = COMPONENT_ICONS[componentName] || "generic";
  const icon = ICONS[iconKey] || ICONS.generic;
  const label = COMPONENT_LABELS[componentName] || componentName;
  const errorText = errorMessage ? escapeHtml(errorMessage.substring(0, 50)) : "Indisponivel";
  let html = `<div class="header-component-fallback" data-component="${escapeHtml(componentName)}" role="status" aria-label="${escapeHtml(label)} indisponivel">`;
  html += `<div class="hcf-icon" aria-hidden="true">${icon}</div>`;
  if (!compact) {
    html += '<div class="hcf-content">';
    html += `<span class="hcf-label">${escapeHtml(label)}</span>`;
    if (showError) {
      html += `<span class="hcf-error">${errorText}</span>`;
    }
    html += "</div>";
  }
  if (showRetry) {
    html += `<button class="hcf-retry" type="button" aria-label="Tentar novamente ${escapeHtml(label)}" data-retry-component="${escapeHtml(componentName)}">${ICONS.refresh}</button>`;
  }
  html += "</div>";
  return html;
}
function _ensureStyles() {
  if (document.getElementById("component-fallback-styles")) return;
  const css = ".header-component-fallback{display:inline-flex;align-items:center;gap:6px;padding:4px 8px;background:var(--color-warning-bg,#fff3cd);border:1px solid var(--color-warning-border,#ffc107);border-radius:4px;font-size:12px;color:var(--color-warning-text,#856404);max-width:150px;animation:hcf-fade-in 0.3s ease}.header-component-fallback .hcf-icon{flex-shrink:0;opacity:0.7}.header-component-fallback .hcf-content{display:flex;flex-direction:column;gap:1px;overflow:hidden}.header-component-fallback .hcf-label{font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.header-component-fallback .hcf-error{font-size:10px;opacity:0.8;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.header-component-fallback .hcf-retry{display:flex;align-items:center;justify-content:center;width:24px;height:24px;padding:0;border:none;background:transparent;cursor:pointer;border-radius:50%;transition:background 0.2s}.header-component-fallback .hcf-retry:hover{background:rgba(0,0,0,0.1)}.header-component-fallback .hcf-retry:focus{outline:2px solid var(--color-focus,#0066cc);outline-offset:2px}.header-component-fallback.hcf-removing{animation:hcf-fade-out 0.3s ease forwards}@keyframes hcf-fade-in{from{opacity:0;transform:scale(0.9)}to{opacity:1;transform:scale(1)}}@keyframes hcf-fade-out{from{opacity:1;transform:scale(1)}to{opacity:0;transform:scale(0.9)}}@media(max-width:768px){.header-component-fallback{padding:2px 4px}.header-component-fallback .hcf-content{display:none}}";
  const style = document.createElement("style");
  style.id = "component-fallback-styles";
  style.textContent = css;
  document.head.appendChild(style);
}
function createFallback(componentName, container, errorMessage, options) {
  options = options || {};
  _ensureStyles();
  removeFallback(componentName);
  const html = _createFallbackHTML(componentName, errorMessage, options);
  const wrapper = document.createElement("div");
  wrapper.innerHTML = html;
  const element = wrapper.firstElementChild;
  container.appendChild(element);
  _activeFallbacks.set(componentName, element);
  _metrics.fallbacksCreated++;
  const retryBtn = element.querySelector(".hcf-retry");
  if (retryBtn && options.onRetry) {
    retryBtn.addEventListener("click", () => {
      _metrics.retryClicks++;
      options.onRetry(componentName);
    });
  }
  return element;
}
function removeFallback(componentName, animate) {
  const element = _activeFallbacks.get(componentName);
  if (!element) return false;
  if (animate) {
    element.classList.add("hcf-removing");
    setTimeout(() => {
      if (element.parentNode) element.remove();
    }, 300);
  } else {
    element.remove();
  }
  _activeFallbacks.delete(componentName);
  _metrics.fallbacksRemoved++;
  return true;
}
function removeAllFallbacks(animate) {
  _activeFallbacks.forEach((element, name) => {
    removeFallback(name, animate);
  });
}
function hasFallback(componentName) {
  return _activeFallbacks.has(componentName);
}
function getActiveFallbacks() {
  return Array.from(_activeFallbacks.keys());
}
function getMetrics() {
  return Object.assign({}, _metrics, { activeFallbacks: _activeFallbacks.size });
}
function resetMetrics() {
  _metrics.fallbacksCreated = 0;
  _metrics.fallbacksRemoved = 0;
  _metrics.retryClicks = 0;
}
function healthCheck() {
  const checks = {
    stylesLoaded: !!document.getElementById("component-fallback-styles"),
    noOrphanFallbacks: true
  };
  _activeFallbacks.forEach((element, name) => {
    if (!element.isConnected) {
      checks.noOrphanFallbacks = false;
      _activeFallbacks.delete(name);
    }
  });
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  return {
    status: passed === total ? "HEALTHY" : "DEGRADED",
    score: passed,
    maxScore: total,
    scoreDisplay: `${passed}/${total}`,
    checks,
    activeFallbacks: _activeFallbacks.size,
    version: VERSION,
    moduleId: MODULE_ID,
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  };
}
function info() {
  return {
    version: VERSION,
    moduleId: MODULE_ID,
    activeFallbacks: getActiveFallbacks(),
    metrics: getMetrics(),
    healthCheck: healthCheck()
  };
}
var component_fallback_ui_default = {
  VERSION,
  MODULE_ID,
  createFallback,
  removeFallback,
  removeAllFallbacks,
  hasFallback,
  getActiveFallbacks,
  getMetrics,
  resetMetrics,
  healthCheck,
  info
};
export {
  MODULE_ID,
  VERSION,
  createFallback,
  component_fallback_ui_default as default,
  getActiveFallbacks,
  getMetrics,
  hasFallback,
  healthCheck,
  info,
  removeAllFallbacks,
  removeFallback,
  resetMetrics
};
