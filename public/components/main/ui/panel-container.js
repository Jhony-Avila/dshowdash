const VERSION = "2.1.0-AAA-P0";
const MODULE_ID = "main-panel-container";
const PC_SVGS = {
  warning: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>'
};
const STATES = { IDLE: "idle", LOADING: "loading", ERROR: "error", READY: "ready" };
function createPanelContainer(container) {
  if (!container) return null;
  container.classList.add("main-panel-container");
  container.setAttribute("data-main-container", "true");
  container.setAttribute("data-state", STATES.IDLE);
  let _loadingEl = null;
  let _errorEl = null;
  let _currentState = STATES.IDLE;
  let _lastError = null;
  function _ensureLoadingEl() {
    if (_loadingEl) return _loadingEl;
    _loadingEl = document.createElement("div");
    _loadingEl.className = "main-panel-loading";
    _loadingEl.setAttribute("role", "status");
    _loadingEl.setAttribute("aria-live", "polite");
    const spinner = document.createElement("div");
    spinner.className = "main-panel-spinner";
    const text = document.createElement("span");
    text.className = "main-panel-loading-text";
    text.textContent = "Carregando...";
    _loadingEl.appendChild(spinner);
    _loadingEl.appendChild(text);
    return _loadingEl;
  }
  function _ensureErrorEl() {
    if (_errorEl) return _errorEl;
    _errorEl = document.createElement("div");
    _errorEl.className = "main-panel-error";
    _errorEl.setAttribute("role", "alert");
    _errorEl.setAttribute("aria-live", "assertive");
    const icon = document.createElement("span");
    icon.className = "main-panel-error-icon";
    icon.innerHTML = PC_SVGS.warning;
    icon.setAttribute("aria-hidden", "true");
    const message = document.createElement("span");
    message.className = "main-panel-error-message";
    const retryBtn = document.createElement("button");
    retryBtn.className = "main-panel-error-retry";
    retryBtn.textContent = "Tentar novamente";
    retryBtn.type = "button";
    _errorEl.appendChild(icon);
    _errorEl.appendChild(message);
    _errorEl.appendChild(retryBtn);
    return _errorEl;
  }
  function _setState(newState) {
    if (_currentState === newState) return;
    const oldState = _currentState;
    _currentState = newState;
    container.setAttribute("data-state", newState);
    container.classList.remove(`main-panel--${oldState}`);
    container.classList.add(`main-panel--${newState}`);
  }
  function _clearContent() {
    if (_loadingEl && _loadingEl.parentNode === container) container.removeChild(_loadingEl);
    if (_errorEl && _errorEl.parentNode === container) container.removeChild(_errorEl);
  }
  return {
    getElement() {
      return container;
    },
    setLoading(loading) {
      container.setAttribute("data-loading", String(loading));
      if (loading) {
        _setState(STATES.LOADING);
        _clearContent();
        const loadingEl = _ensureLoadingEl();
        container.appendChild(loadingEl);
      } else {
        if (_currentState === STATES.LOADING) _setState(STATES.READY);
        if (_loadingEl && _loadingEl.parentNode === container) container.removeChild(_loadingEl);
      }
    },
    setError(message, options) {
      const opts = options || {};
      _lastError = typeof message === "string" ? message : message && message.message || "Erro desconhecido";
      _setState(STATES.ERROR);
      _clearContent();
      const errorEl = _ensureErrorEl();
      const messageEl = errorEl.querySelector(".main-panel-error-message");
      if (messageEl) messageEl.textContent = typeof message === "string" ? message : message && message.message || "Erro desconhecido";
      const retryBtn = errorEl.querySelector(".main-panel-error-retry");
      if (retryBtn) {
        retryBtn.style.display = opts.onRetry ? "" : "none";
        if (opts.onRetry) retryBtn.onclick = opts.onRetry;
      }
      container.appendChild(errorEl);
    },
    clearError() {
      _lastError = null;
      if (_errorEl && _errorEl.parentNode === container) container.removeChild(_errorEl);
      if (_currentState === STATES.ERROR) _setState(STATES.READY);
    },
    clear() {
      _clearContent();
      _lastError = null;
      _setState(STATES.IDLE);
      Array.from(container.children).forEach((child) => {
        if (child === _loadingEl || child === _errorEl) container.removeChild(child);
      });
    },
    getState() {
      return _currentState;
    },
    info() {
      return { version: VERSION, moduleId: MODULE_ID, state: _currentState, hasContent: container.children.length > 0, hasError: _currentState === STATES.ERROR, lastError: _lastError };
    },
    healthCheck() {
      const isAttached = document.contains(container);
      const hasValidState = Object.values(STATES).indexOf(_currentState) >= 0;
      return { status: isAttached && hasValidState ? "HEALTHY" : "DEGRADED", version: VERSION, moduleId: MODULE_ID, checks: { isAttached, hasValidState, currentState: _currentState, hasLoadingEl: !!_loadingEl, hasErrorEl: !!_errorEl } };
    }
  };
}
var panel_container_default = { createPanelContainer, VERSION, MODULE_ID, STATES };
export {
  MODULE_ID,
  VERSION,
  createPanelContainer,
  panel_container_default as default
};
