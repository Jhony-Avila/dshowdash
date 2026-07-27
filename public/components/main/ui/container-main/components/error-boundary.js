import { ERROR_EVENTS } from "/core/runtime/events/catalog/error.events.js";
const VERSION = "8.2.0-ENTERPRISE";
const MODULE_ID = "container-error-boundary";
let _injectedEventBus = null;
function injectEventBus(eventBus) {
  _injectedEventBus = eventBus;
}
function _getEventBus() {
  return _injectedEventBus;
}
function _emitEvent(eventType, payload) {
  const eb = _getEventBus();
  if (eb?.emit) {
    eb.emit(eventType, { source: MODULE_ID, timestamp: Date.now(), ...payload });
    return true;
  }
  return false;
}
const ERROR_SEVERITY = { LOW: "low", MEDIUM: "medium", HIGH: "high", CRITICAL: "critical" };
function _calculateBackoffDelay(attempt, baseDelay = 1e3, maxDelay = 3e4) {
  const delay = Math.min(baseDelay * Math.pow(2, attempt - 1), maxDelay);
  const jitter = delay * 0.1 * Math.random();
  return Math.round(delay + jitter);
}
function createErrorBoundary(container, options = {}) {
  const { maxErrors = 10, resetTimeout = 3e4, showFallback = true, recoveryAttempts = 3, baseRetryDelay = 1e3, maxRetryDelay = 3e4, onError, onRecover, onFatalError, fallbackContent = null, eventBus } = options;
  if (eventBus && !_injectedEventBus) _injectedEventBus = eventBus;
  let _initialized = false;
  let _errors = [];
  let _errorCount = 0;
  let _recoveryCount = 0;
  let _isFatalState = false;
  let _fallbackEl = null;
  let _originalContent = null;
  let _recoveryTimeout = null;
  let _resetTimeout = null;
  let _retryBtnHandler = null;
  let _detailsBtnHandler = null;
  function _createFallbackElement() {
    const fallback = document.createElement("div");
    fallback.className = "dsd-error-boundary__fallback";
    fallback.setAttribute("role", "alert");
    fallback.setAttribute("aria-live", "assertive");
    if (fallbackContent) {
      if (typeof fallbackContent === "string") fallback.innerHTML = fallbackContent;
      else if (fallbackContent instanceof HTMLElement) fallback.appendChild(fallbackContent.cloneNode(true));
    } else {
      fallback.innerHTML = '<div class="dsd-error-boundary__icon"><svg width="48" height="48" viewBox="0 0 48 48" fill="none"><circle cx="24" cy="24" r="22" stroke="currentColor" stroke-width="2"/><path d="M24 14v12M24 30v4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></div><h3 class="dsd-error-boundary__title">Algo deu errado</h3><p class="dsd-error-boundary__message">Ocorreu um erro inesperado. Tente novamente.</p><div class="dsd-error-boundary__actions"><button type="button" class="dsd-error-boundary__btn dsd-error-boundary__btn--retry">Tentar novamente</button><button type="button" class="dsd-error-boundary__btn dsd-error-boundary__btn--details">Ver detalhes</button></div><div class="dsd-error-boundary__details" hidden><pre></pre></div>';
    }
    const retryBtn = fallback.querySelector(".dsd-error-boundary__btn--retry");
    if (retryBtn) {
      _retryBtnHandler = () => errorBoundary.recover();
      retryBtn.addEventListener("click", _retryBtnHandler);
    }
    const detailsBtn = fallback.querySelector(".dsd-error-boundary__btn--details");
    const detailsEl = fallback.querySelector(".dsd-error-boundary__details");
    if (detailsBtn && detailsEl) {
      _detailsBtnHandler = () => {
        const isHidden = detailsEl.hidden;
        detailsEl.hidden = !isHidden;
        detailsBtn.textContent = isHidden ? "Ocultar detalhes" : "Ver detalhes";
      };
      detailsBtn.addEventListener("click", _detailsBtnHandler);
    }
    return fallback;
  }
  function _classifyError(error) {
    const message = (error?.message || "").toLowerCase();
    if (message.includes("network") || message.includes("fetch")) return { severity: ERROR_SEVERITY.MEDIUM, recoverable: true, type: "network" };
    if (message.includes("timeout")) return { severity: ERROR_SEVERITY.MEDIUM, recoverable: true, type: "timeout" };
    if (message.includes("memory") || message.includes("heap")) return { severity: ERROR_SEVERITY.CRITICAL, recoverable: false, type: "memory" };
    if (message.includes("undefined") || message.includes("null")) return { severity: ERROR_SEVERITY.HIGH, recoverable: true, type: "reference" };
    if (message.includes("syntax")) return { severity: ERROR_SEVERITY.CRITICAL, recoverable: false, type: "syntax" };
    return { severity: ERROR_SEVERITY.MEDIUM, recoverable: true, type: "unknown" };
  }
  function _recordError(error, context = {}) {
    const classification = _classifyError(error);
    const errorRecord = { id: `err-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, message: error?.message || String(error), stack: error?.stack, timestamp: Date.now(), ...classification, context, recovered: false };
    _errors.push(errorRecord);
    if (_errors.length > maxErrors) _errors.shift();
    _errorCount++;
    return errorRecord;
  }
  function _showFallback() {
    if (!showFallback) return;
    const content = container.querySelector(".dsd-container__content");
    if (!content) return;
    if (!_originalContent) _originalContent = content.innerHTML;
    _fallbackEl = _createFallbackElement();
    content.innerHTML = "";
    content.appendChild(_fallbackEl);
    const detailsPre = _fallbackEl.querySelector(".dsd-error-boundary__details pre");
    if (detailsPre && _errors.length > 0) {
      const lastError = _errors[_errors.length - 1];
      detailsPre.textContent = `${lastError.message}

${lastError.stack || "No stack trace"}`;
    }
    container.classList.add("dsd-container--error-state");
  }
  function _hideFallback() {
    if (_fallbackEl) {
      const retryBtn = _fallbackEl.querySelector(".dsd-error-boundary__btn--retry");
      const detailsBtn = _fallbackEl.querySelector(".dsd-error-boundary__btn--details");
      if (retryBtn && _retryBtnHandler) retryBtn.removeEventListener("click", _retryBtnHandler);
      if (detailsBtn && _detailsBtnHandler) detailsBtn.removeEventListener("click", _detailsBtnHandler);
      _retryBtnHandler = null;
      _detailsBtnHandler = null;
    }
    const content = container.querySelector(".dsd-container__content");
    if (content && _originalContent) content.innerHTML = _originalContent;
    _fallbackEl = null;
    container.classList.remove("dsd-container--error-state");
  }
  function _handleGlobalError(event) {
    const error = event.error || new Error(event.message);
    errorBoundary.catch(error, { source: "global", event: "error" });
  }
  function _handleUnhandledRejection(event) {
    const error = event.reason instanceof Error ? event.reason : new Error(String(event.reason));
    errorBoundary.catch(error, { source: "global", event: "unhandledrejection" });
  }
  const errorBoundary = {
    init() {
      if (_initialized) return this;
      window.addEventListener("error", _handleGlobalError);
      window.addEventListener("unhandledrejection", _handleUnhandledRejection);
      _initialized = true;
      return this;
    },
    catch(error, context = {}) {
      const record = _recordError(error, context);
      onError?.(record);
      _emitEvent(ERROR_EVENTS.CATCH, { error: record, containerId: container.id });
      if (record.severity === ERROR_SEVERITY.CRITICAL || _errorCount > maxErrors) return this.fatal(record);
      if (!record.recoverable || _recoveryCount >= recoveryAttempts) {
        _showFallback();
      } else if (record.recoverable) {
        const backoffDelay = _calculateBackoffDelay(_recoveryCount + 1, baseRetryDelay, maxRetryDelay);
        if (_recoveryTimeout) clearTimeout(_recoveryTimeout);
        _recoveryTimeout = setTimeout(() => this.recover(), backoffDelay);
        _emitEvent(ERROR_EVENTS.RETRY_SCHEDULED, { attempt: _recoveryCount + 1, delay: backoffDelay, containerId: container.id });
      }
      return this;
    },
    wrap(fn, context = {}) {
      return (...args) => {
        try {
          const result = fn(...args);
          if (result && typeof result.catch === "function") return result.catch((error) => {
            this.catch(error, { ...context, type: "async" });
            throw error;
          });
          return result;
        } catch (error) {
          this.catch(error, { ...context, type: "sync" });
          throw error;
        }
      };
    },
    recover() {
      if (_isFatalState) return false;
      _recoveryCount++;
      if (_recoveryCount > recoveryAttempts) return this.fatal(_errors[_errors.length - 1]);
      _hideFallback();
      if (_errors.length > 0) _errors[_errors.length - 1].recovered = true;
      onRecover?.(_recoveryCount);
      _emitEvent(ERROR_EVENTS.RECOVER, { attempt: _recoveryCount, containerId: container.id });
      if (_resetTimeout) clearTimeout(_resetTimeout);
      _resetTimeout = setTimeout(() => {
        if (!_isFatalState) _recoveryCount = 0;
      }, resetTimeout);
      return true;
    },
    fatal(errorRecord) {
      _isFatalState = true;
      if (_recoveryTimeout) {
        clearTimeout(_recoveryTimeout);
        _recoveryTimeout = null;
      }
      _showFallback();
      if (_fallbackEl) {
        const title = _fallbackEl.querySelector(".dsd-error-boundary__title");
        const message = _fallbackEl.querySelector(".dsd-error-boundary__message");
        const retryBtn = _fallbackEl.querySelector(".dsd-error-boundary__btn--retry");
        if (title) title.textContent = "Erro cr\xEDtico";
        if (message) message.textContent = "N\xE3o foi poss\xEDvel recuperar. Por favor, recarregue a p\xE1gina.";
        if (retryBtn) {
          if (_retryBtnHandler) retryBtn.removeEventListener("click", _retryBtnHandler);
          _retryBtnHandler = () => window.location.reload();
          retryBtn.textContent = "Recarregar p\xE1gina";
          retryBtn.addEventListener("click", _retryBtnHandler);
        }
      }
      onFatalError?.(errorRecord);
      _emitEvent(ERROR_EVENTS.FATAL, { error: errorRecord, containerId: container.id });
      return this;
    },
    reset() {
      if (_recoveryTimeout) {
        clearTimeout(_recoveryTimeout);
        _recoveryTimeout = null;
      }
      if (_resetTimeout) {
        clearTimeout(_resetTimeout);
        _resetTimeout = null;
      }
      _errors = [];
      _errorCount = 0;
      _recoveryCount = 0;
      _isFatalState = false;
      _hideFallback();
      return this;
    },
    getErrors() {
      return [..._errors];
    },
    getLastError() {
      return _errors[_errors.length - 1] || null;
    },
    getStats() {
      return { totalErrors: _errorCount, recoveryAttempts: _recoveryCount, maxRecoveryAttempts: recoveryAttempts, isFatalState: _isFatalState, recentErrors: _errors.length };
    },
    isFatal() {
      return _isFatalState;
    },
    isInitialized() {
      return _initialized;
    },
    destroy() {
      window.removeEventListener("error", _handleGlobalError);
      window.removeEventListener("unhandledrejection", _handleUnhandledRejection);
      if (_recoveryTimeout) {
        clearTimeout(_recoveryTimeout);
        _recoveryTimeout = null;
      }
      if (_resetTimeout) {
        clearTimeout(_resetTimeout);
        _resetTimeout = null;
      }
      _hideFallback();
      _initialized = false;
    },
    healthCheck() {
      return { status: _isFatalState ? "DEGRADED" : _initialized ? "HEALTHY" : "NOT_INITIALIZED", version: VERSION, moduleId: MODULE_ID, hasInjectedEventBus: !!_injectedEventBus, backoffEnabled: true, ...errorBoundary.getStats() };
    }
  };
  return errorBoundary;
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, hasInjectedEventBus: !!_injectedEventBus, backoffEnabled: true };
}
function healthCheck() {
  return { status: "HEALTHY", version: VERSION, moduleId: MODULE_ID, hasInjectedEventBus: !!_injectedEventBus, backoffEnabled: true };
}
var error_boundary_default = { createErrorBoundary, injectEventBus, info, healthCheck, VERSION, MODULE_ID, ERROR_SEVERITY };
export {
  ERROR_SEVERITY,
  MODULE_ID,
  VERSION,
  createErrorBoundary,
  error_boundary_default as default,
  healthCheck,
  info,
  injectEventBus
};
