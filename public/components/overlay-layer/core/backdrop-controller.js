const VERSION = "1.1.0-P2-ENTERPRISE";
const MODULE_ID = "overlay-layer-backdrop-controller";
const _config = {
  clickDelay: 300,
  closeOnClick: true,
  closeOnEscape: true,
  animated: true
};
let _backdropStates = {};
const _metrics = { clicks: 0, closesFromClick: 0, blockedClicks: 0 };
function register(overlayId, backdropElement, options) {
  options = options || {};
  if (!overlayId || !backdropElement) {
    return { ok: false, reason: "invalid-params" };
  }
  const openedAt = Date.now();
  const closeCallback = options.onClose || (() => {
  });
  const delay = options.clickDelay !== void 0 ? options.clickDelay : _config.clickDelay;
  const closeOnClick = options.closeOnClick !== void 0 ? options.closeOnClick : _config.closeOnClick;
  const handleClick = (e) => {
    if (e.target !== backdropElement) return;
    _metrics.clicks++;
    const elapsed = Date.now() - openedAt;
    if (elapsed < delay) {
      _metrics.blockedClicks++;
      backdropElement.classList.add("click-blocked");
      setTimeout(() => {
        backdropElement.classList.remove("click-blocked");
      }, 150);
      return;
    }
    if (closeOnClick) {
      _metrics.closesFromClick++;
      closeCallback("backdrop-click");
    }
  };
  backdropElement.addEventListener("click", handleClick);
  _backdropStates[overlayId] = {
    element: backdropElement,
    openedAt,
    delay,
    closeOnClick,
    cleanup() {
      backdropElement.removeEventListener("click", handleClick);
    }
  };
  return { ok: true, overlayId, delay };
}
function unregister(overlayId) {
  const state = _backdropStates[overlayId];
  if (!state) {
    return { ok: false, reason: "not-found" };
  }
  state.cleanup();
  delete _backdropStates[overlayId];
  return { ok: true, overlayId };
}
function isClickAllowed(overlayId) {
  const state = _backdropStates[overlayId];
  if (!state) return true;
  const elapsed = Date.now() - state.openedAt;
  return elapsed >= state.delay;
}
function getRemainingDelay(overlayId) {
  const state = _backdropStates[overlayId];
  if (!state) return 0;
  const elapsed = Date.now() - state.openedAt;
  return Math.max(0, state.delay - elapsed);
}
function createBackdrop(overlayId, options) {
  options = options || {};
  const backdrop = document.createElement("div");
  backdrop.className = "overlay-backdrop";
  backdrop.setAttribute("data-overlay-backdrop", overlayId);
  backdrop.setAttribute("aria-hidden", "true");
  if (options.className) {
    backdrop.classList.add(options.className);
  }
  backdrop.style.position = "fixed";
  backdrop.style.top = "0";
  backdrop.style.left = "0";
  backdrop.style.right = "0";
  backdrop.style.bottom = "0";
  backdrop.style.backgroundColor = options.color || "rgba(0, 0, 0, 0.5)";
  backdrop.style.zIndex = String(options.zIndex || 7e3);
  backdrop.style.opacity = "0";
  backdrop.style.transition = _config.animated ? "opacity 150ms ease-out" : "none";
  return backdrop;
}
function show(backdrop) {
  if (!backdrop) return Promise.resolve({ ok: false });
  document.body.appendChild(backdrop);
  backdrop.offsetHeight;
  backdrop.style.opacity = "1";
  if (_config.animated) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ ok: true });
      }, 150);
    });
  }
  return Promise.resolve({ ok: true });
}
function hide(backdrop) {
  if (!backdrop) return Promise.resolve({ ok: false });
  backdrop.style.opacity = "0";
  if (_config.animated) {
    return new Promise((resolve) => {
      setTimeout(() => {
        backdrop.remove();
        resolve({ ok: true });
      }, 150);
    });
  }
  backdrop.remove();
  return Promise.resolve({ ok: true });
}
function cleanup() {
  const keys = Object.keys(_backdropStates);
  for (let i = 0; i < keys.length; i++) {
    _backdropStates[keys[i]].cleanup();
  }
  _backdropStates = {};
  const orphans = document.querySelectorAll("[data-overlay-backdrop]");
  for (let j = 0; j < orphans.length; j++) {
    orphans[j].remove();
  }
  return { ok: true };
}
function getConfig() {
  return Object.assign({}, _config);
}
function setConfig(newConfig) {
  if (newConfig.clickDelay !== void 0) _config.clickDelay = newConfig.clickDelay;
  if (newConfig.closeOnClick !== void 0) _config.closeOnClick = newConfig.closeOnClick;
  if (newConfig.closeOnEscape !== void 0) _config.closeOnEscape = newConfig.closeOnEscape;
  if (newConfig.animated !== void 0) _config.animated = newConfig.animated;
  return { ok: true, config: Object.assign({}, _config) };
}
function getMetrics() {
  return Object.assign({}, _metrics, { activeBackdrops: Object.keys(_backdropStates).length });
}
function healthCheck() {
  const domBackdrops = document.querySelectorAll("[data-overlay-backdrop]").length;
  const stateBackdrops = Object.keys(_backdropStates).length;
  const checks = {
    noOrphanBackdrops: domBackdrops === stateBackdrops,
    lowBlockRate: _metrics.clicks === 0 || _metrics.blockedClicks / _metrics.clicks < 0.5
  };
  const checkKeys = Object.keys(checks);
  let passed = 0;
  for (let i = 0; i < checkKeys.length; i++) {
    if (checks[checkKeys[i]]) passed++;
  }
  const total = checkKeys.length;
  return {
    status: passed === total ? "HEALTHY" : "DEGRADED",
    score: `${passed}/${total}`,
    checks,
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
    config: getConfig(),
    activeBackdrops: Object.keys(_backdropStates).length,
    metrics: getMetrics(),
    timestamp: Date.now()
  };
}
var backdrop_controller_default = {
  register,
  unregister,
  isClickAllowed,
  getRemainingDelay,
  createBackdrop,
  show,
  hide,
  cleanup,
  getConfig,
  setConfig,
  getMetrics,
  healthCheck,
  info,
  VERSION,
  MODULE_ID
};
export {
  MODULE_ID,
  VERSION,
  cleanup,
  createBackdrop,
  backdrop_controller_default as default,
  getConfig,
  getMetrics,
  getRemainingDelay,
  healthCheck,
  hide,
  info,
  isClickAllowed,
  register,
  setConfig,
  show,
  unregister
};
