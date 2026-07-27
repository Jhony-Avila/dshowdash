import { createPanelPorts } from "/core/runtime/ports-profiles.js";
const VERSION = "10.1.0-MIGRATION-PHASE1";
const MODULE_ID = "panel-nav-admin.core.error-boundary";
const hasWindow = typeof window !== "undefined";
const Ports = createPanelPorts({ moduleId: MODULE_ID });
function _initPorts() {
  Ports.init();
}
function _getPort(name) {
  return Ports.get(name);
}
function injectPorts(p) {
  return Ports.inject(p);
}
function getPorts() {
  return Ports.snapshot();
}
const _log = (level, ...args) => {
  const logger = _getPort("logger");
  if (!logger) return;
  const prefix = "[ErrorBoundary]";
  if (level === "error") logger.error?.(prefix, ...args);
  else if (level === "warn") logger.warn?.(prefix, ...args);
  else if (level === "debug") logger.debug?.(prefix, ...args);
  else logger.info?.(prefix, ...args);
};
class ErrorBoundary {
  /**
   * @param {HTMLElement} container — Elemento DOM onde o erro será renderizado
   * @param {Object} [options]
   * @param {Function} [options.onError] — Callback chamado ao capturar erro
   * @param {Function} [options.onRetry] — Callback chamado ao clicar em "Tentar novamente"
   * @param {number} [options.maxRetries=3] — Número máximo de tentativas
   * @param {string} [options.componentName='Componente'] — Nome do componente para exibição
   */
  constructor(container, options = {}) {
    this.container = container;
    this.onError = options.onError || (() => {
    });
    this.onRetry = options.onRetry || (() => {
    });
    this.maxRetries = options.maxRetries || 3;
    this.componentName = options.componentName || "Componente";
    this.retryCount = 0;
    this.lastError = null;
    this._originalContent = null;
    this._boundActions = null;
  }
  /**
   * Wraps an async function with error boundary protection.
   * @param {Function} fn — Função a ser protegida
   * @returns {Function} — Função wrapped que captura erros
   */
  wrap(fn) {
    return async (...args) => {
      try {
        return await fn(...args);
      } catch (error) {
        this.handleError(error);
        return null;
      }
    };
  }
  /**
   * Wraps a synchronous function with error boundary protection.
   * @param {Function} fn — Função a ser protegida
   * @returns {Function} — Função wrapped que captura erros
   */
  wrapSync(fn) {
    return (...args) => {
      try {
        return fn(...args);
      } catch (error) {
        this.handleError(error);
        return null;
      }
    };
  }
  /**
   * Handles an error — stores it, calls onError callback, renders error UI.
   * @param {Error} error
   */
  handleError(error) {
    this.lastError = error;
    this.onError(error);
    _log("error", `[${this.componentName}]`, error.message || error);
    if (this.container) {
      this._originalContent = this.container.innerHTML;
      this.renderError(error);
    }
  }
  /**
   * Renders error UI inside the container.
   * @param {Error} error
   */
  renderError(error) {
    if (!this.container) return;
    const canRetry = this.retryCount < this.maxRetries;
    const remainingRetries = this.maxRetries - this.retryCount;
    this.container.innerHTML = [
      '<div class="pna-error-boundary">',
      '  <div class="pna-error-boundary__icon">',
      '    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="48" height="48">',
      '      <circle cx="12" cy="12" r="10"/>',
      '      <line x1="12" y1="8" x2="12" y2="12"/>',
      '      <line x1="12" y1="16" x2="12.01" y2="16"/>',
      "    </svg>",
      "  </div>",
      '  <h3 class="pna-error-boundary__title">Algo deu errado</h3>',
      '  <p class="pna-error-boundary__message">' + (error.message || "Erro desconhecido") + "</p>",
      '  <div class="pna-error-boundary__actions">',
      canRetry ? '    <button class="pna-btn pna-btn--primary" data-eb-action="retry">Tentar novamente (' + remainingRetries + ")</button>" : "",
      '    <button class="pna-btn pna-btn--secondary" data-eb-action="reload">Recarregar p\xE1gina</button>',
      "  </div>",
      '  <details class="pna-error-boundary__details">',
      "    <summary>Detalhes t\xE9cnicos</summary>",
      "    <pre>" + (error.stack || error.toString()) + "</pre>",
      "  </details>",
      "</div>"
    ].join("\n");
    this._bindActions();
  }
  /**
   * @private Binds click handlers to retry/reload buttons.
   */
  _bindActions() {
    this._unbindActions();
    const retryBtn = this.container.querySelector('[data-eb-action="retry"]');
    const reloadBtn = this.container.querySelector('[data-eb-action="reload"]');
    this._boundActions = [];
    if (retryBtn) {
      const retryHandler = () => this.retry();
      retryBtn.addEventListener("click", retryHandler);
      this._boundActions.push({ el: retryBtn, event: "click", handler: retryHandler });
    }
    if (reloadBtn) {
      const reloadHandler = () => {
        if (hasWindow) window.location.reload();
      };
      reloadBtn.addEventListener("click", reloadHandler);
      this._boundActions.push({ el: reloadBtn, event: "click", handler: reloadHandler });
    }
  }
  /**
   * @private Removes click handlers from buttons.
   */
  _unbindActions() {
    if (this._boundActions) {
      this._boundActions.forEach(({ el, event, handler }) => {
        el.removeEventListener(event, handler);
      });
      this._boundActions = null;
    }
  }
  /**
   * Retry — increments counter, restores original content, calls onRetry.
   */
  retry() {
    this.retryCount++;
    _log("info", "Retry attempt", this.retryCount, "/", this.maxRetries);
    this._unbindActions();
    if (this._originalContent) {
      this.container.innerHTML = this._originalContent;
    }
    this.onRetry();
  }
  /**
   * Reset — clears error state and retry counter.
   */
  reset() {
    this.retryCount = 0;
    this.lastError = null;
    this._originalContent = null;
    this._unbindActions();
  }
  /**
   * @returns {boolean} Whether the boundary currently holds an error.
   */
  hasError() {
    return this.lastError !== null;
  }
  /**
   * @returns {Error|null} The last captured error.
   */
  getError() {
    return this.lastError;
  }
  /**
   * @returns {number} Number of retries executed.
   */
  getRetryCount() {
    return this.retryCount;
  }
  /**
   * Cleanup — removes event listeners and clears state.
   */
  destroy() {
    this._unbindActions();
    this.retryCount = 0;
    this.lastError = null;
    this._originalContent = null;
    this.container = null;
  }
}
function createErrorBoundary(container, options = {}) {
  return new ErrorBoundary(container, options);
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, portsInitialized: Ports.isInitialized() };
}
function healthCheck() {
  return {
    status: Ports.isInitialized() ? "HEALTHY" : "DEGRADED",
    moduleId: MODULE_ID,
    version: VERSION,
    portsInitialized: Ports.isInitialized()
  };
}
var error_boundary_default = { ErrorBoundary, createErrorBoundary, info, healthCheck, injectPorts, getPorts, VERSION, MODULE_ID };
export {
  ErrorBoundary,
  MODULE_ID,
  VERSION,
  createErrorBoundary,
  error_boundary_default as default,
  getPorts,
  healthCheck,
  info,
  injectPorts
};
