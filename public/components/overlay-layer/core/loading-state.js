const VERSION = "1.1.0-P2-ENTERPRISE";
const MODULE_ID = "overlay-layer-loading-state";
const _loadingStates = {};
const _metrics = { loadingShown: 0, loadingHidden: 0, avgDuration: 0 };
const LOADING_STYLES = ".overlay-loading-container{position:absolute;top:0;left:0;right:0;bottom:0;display:flex;align-items:center;justify-content:center;background:rgba(255,255,255,0.9);z-index:10;opacity:0;transition:opacity 200ms ease-out;pointer-events:none}.overlay-loading-container.active{opacity:1;pointer-events:auto}.overlay-loading-spinner{width:40px;height:40px;border:3px solid #e5e7eb;border-top-color:#3b82f6;border-radius:50%;animation:overlay-spin 0.8s linear infinite}.overlay-loading-text{margin-top:12px;font-size:14px;color:#6b7280}@keyframes overlay-spin{to{transform:rotate(360deg)}}@media(prefers-reduced-motion:reduce){.overlay-loading-spinner{animation:none;border-top-color:#3b82f6;border-right-color:#3b82f6}}";
let _stylesInjected = false;
function _injectStyles() {
  if (_stylesInjected || typeof document === "undefined") return;
  const style = document.createElement("style");
  style.setAttribute("data-overlay-loading-styles", "");
  style.textContent = LOADING_STYLES;
  document.head.appendChild(style);
  _stylesInjected = true;
}
function _createLoadingElement(message) {
  const container = document.createElement("div");
  container.className = "overlay-loading-container";
  container.setAttribute("role", "status");
  container.setAttribute("aria-live", "polite");
  const inner = document.createElement("div");
  inner.style.textAlign = "center";
  const spinner = document.createElement("div");
  spinner.className = "overlay-loading-spinner";
  spinner.setAttribute("aria-hidden", "true");
  const text = document.createElement("div");
  text.className = "overlay-loading-text";
  text.textContent = message || "Carregando...";
  inner.appendChild(spinner);
  inner.appendChild(text);
  container.appendChild(inner);
  return container;
}
function show(overlayId, overlayElement, options) {
  options = options || {};
  if (!overlayId || !overlayElement) {
    return { ok: false, reason: "invalid-params" };
  }
  _injectStyles();
  hide(overlayId);
  const message = options.message || "Carregando...";
  const loadingEl = _createLoadingElement(message);
  const computed = window.getComputedStyle(overlayElement);
  if (computed.position === "static") {
    overlayElement.style.position = "relative";
  }
  overlayElement.appendChild(loadingEl);
  loadingEl.offsetHeight;
  requestAnimationFrame(() => {
    loadingEl.classList.add("active");
  });
  const startTime = Date.now();
  _loadingStates[overlayId] = {
    element: loadingEl,
    overlayElement,
    startTime,
    message
  };
  _metrics.loadingShown++;
  return { ok: true, overlayId };
}
function hide(overlayId) {
  const state = _loadingStates[overlayId];
  if (!state) {
    return { ok: false, reason: "not-found" };
  }
  const duration = Date.now() - state.startTime;
  _metrics.avgDuration = (_metrics.avgDuration * _metrics.loadingHidden + duration) / (_metrics.loadingHidden + 1);
  _metrics.loadingHidden++;
  state.element.classList.remove("active");
  const elementToRemove = state.element;
  setTimeout(() => {
    elementToRemove.remove();
  }, 200);
  delete _loadingStates[overlayId];
  return { ok: true, overlayId, duration };
}
function updateMessage(overlayId, message) {
  const state = _loadingStates[overlayId];
  if (!state) {
    return { ok: false, reason: "not-found" };
  }
  const textEl = state.element.querySelector(".overlay-loading-text");
  if (textEl) {
    textEl.textContent = message;
  }
  state.message = message;
  return { ok: true, overlayId, message };
}
function isLoading(overlayId) {
  return !!_loadingStates[overlayId];
}
function getState(overlayId) {
  const state = _loadingStates[overlayId];
  if (!state) return null;
  return {
    overlayId,
    message: state.message,
    duration: Date.now() - state.startTime
  };
}
function hideAll() {
  const keys = Object.keys(_loadingStates);
  const count = keys.length;
  for (let i = 0; i < keys.length; i++) {
    hide(keys[i]);
  }
  return { ok: true, hidden: count };
}
function withLoading(overlayId, overlayElement, promise, options) {
  show(overlayId, overlayElement, options);
  return promise.then((result) => {
    hide(overlayId);
    return { ok: true, result };
  }).catch((error) => {
    hide(overlayId);
    return { ok: false, error };
  });
}
function showWithTimeout(overlayId, overlayElement, timeout, options) {
  show(overlayId, overlayElement, options);
  setTimeout(() => {
    if (isLoading(overlayId)) {
      hide(overlayId);
    }
  }, timeout);
  return { ok: true, overlayId, timeout };
}
function getMetrics() {
  return Object.assign({}, _metrics, { activeLoadings: Object.keys(_loadingStates).length });
}
function healthCheck() {
  const stateKeys = Object.keys(_loadingStates);
  let hasStuck = false;
  for (let i = 0; i < stateKeys.length; i++) {
    if (Date.now() - _loadingStates[stateKeys[i]].startTime > 6e4) {
      hasStuck = true;
      break;
    }
  }
  const checks = {
    stylesInjected: _stylesInjected,
    noStuckLoadings: !hasStuck
  };
  const checkKeys = Object.keys(checks);
  let passed = 0;
  for (let j = 0; j < checkKeys.length; j++) {
    if (checks[checkKeys[j]]) passed++;
  }
  const total = checkKeys.length;
  return {
    status: passed === total ? "HEALTHY" : "DEGRADED",
    score: `${passed}/${total}`,
    checks,
    activeLoadings: stateKeys.length,
    metrics: getMetrics(),
    version: VERSION,
    moduleId: MODULE_ID,
    timestamp: Date.now()
  };
}
function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    stylesInjected: _stylesInjected,
    activeLoadings: Object.keys(_loadingStates),
    metrics: getMetrics(),
    timestamp: Date.now()
  };
}
var loading_state_default = {
  show,
  hide,
  updateMessage,
  isLoading,
  getState,
  hideAll,
  withLoading,
  showWithTimeout,
  getMetrics,
  healthCheck,
  info,
  VERSION,
  MODULE_ID
};
export {
  MODULE_ID,
  VERSION,
  loading_state_default as default,
  getMetrics,
  getState,
  healthCheck,
  hide,
  hideAll,
  info,
  isLoading,
  show,
  showWithTimeout,
  updateMessage,
  withLoading
};
