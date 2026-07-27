import { createPanelPorts } from "/core/runtime/ports-profiles.js";
const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-01.ui.error-boundary";
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
  constructor(container, options = {}) {
    this.container = container;
    this.onError = options.onError || (() => {
    });
    this.onRetry = options.onRetry || (() => {
    });
    this.maxRetries = options.maxRetries || 3;
    this.retryCount = 0;
    this.lastError = null;
    this._originalContent = null;
  }
  // @ts-expect-error strict migration — TS2345
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
  handleError(error) {
    this.lastError = error;
    this.onError(error);
    _log("error", error.message || error);
    if (this.container) {
      this._originalContent = this.container.innerHTML;
      this.renderError(error);
    }
  }
  renderError(error) {
    if (!this.container) return;
    const canRetry = this.retryCount < this.maxRetries;
    this.container.innerHTML = `<div class="p01-error-boundary"><div class="p01-error-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg></div><h3 class="p01-error-title">Algo deu errado</h3><p class="p01-error-message">${error.message || "Erro desconhecido"}</p><div class="p01-error-actions">${canRetry ? `<button class="p01-btn p01-btn--primary" data-action="retry">Tentar novamente (${this.maxRetries - this.retryCount})</button>` : ""}<button class="p01-btn p01-btn--secondary" data-action="reload">Recarregar pagina</button></div><details class="p01-error-details"><summary>Detalhes tecnicos</summary><pre>${error.stack || error.toString()}</pre></details></div>`;
    this._bindActions();
  }
  _bindActions() {
    this.container.querySelector('[data-action="retry"]')?.addEventListener("click", () => this.retry());
    this.container.querySelector('[data-action="reload"]')?.addEventListener("click", () => {
      if (hasWindow) window.location.reload();
    });
  }
  retry() {
    this.retryCount++;
    if (this._originalContent) this.container.innerHTML = this._originalContent;
    this.onRetry();
  }
  reset() {
    this.retryCount = 0;
    this.lastError = null;
    this._originalContent = null;
  }
  hasError() {
    return this.lastError !== null;
  }
  getError() {
    return this.lastError;
  }
}
function createErrorBoundary(container, options = {}) {
  return new ErrorBoundary(container, options);
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, portsInitialized: Ports.isInitialized() };
}
function healthCheck() {
  return { status: Ports.isInitialized() ? "HEALTHY" : "DEGRADED", moduleId: MODULE_ID, version: VERSION, portsInitialized: Ports.isInitialized() };
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
