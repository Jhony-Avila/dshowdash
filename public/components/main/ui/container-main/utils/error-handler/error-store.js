import { MAX_ERROR_LOG } from "./constants.js";
import { classifyCategory, classifySeverity, suggestRecovery } from "./classifier.js";
const VERSION = "15.2.0-MODULAR";
const MODULE_ID = "main.ui.container-main.utils.error-handler.error-store";
function createErrorStore(options = {}) {
  const { logCallback, maxLog = MAX_ERROR_LOG } = options;
  let _errorLog = [];
  return {
    // Cria objeto de informação de erro
    createErrorInfo(error, context = {}) {
      const category = classifyCategory(error, context);
      const severity = classifySeverity(error, context);
      return {
        id: `err-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: Date.now(),
        name: error.name || "Error",
        message: error.message || String(error),
        // @ts-expect-error TS migration - TS2339
        stack: error.stack?.substring(0, 1500) || "",
        category,
        severity,
        suggestedRecovery: suggestRecovery(error, context),
        context: {
          moduleId: context.moduleId || null,
          operation: context.operation || null,
          url: typeof window !== "undefined" ? window.location?.href : "",
          ...context
        },
        handled: false,
        recovered: false,
        recoveryAttempts: 0
      };
    },
    // Armazena erro no log
    log(errorInfo) {
      _errorLog.push(errorInfo);
      if (_errorLog.length > maxLog) {
        _errorLog.shift();
      }
      logCallback?.(errorInfo);
      return errorInfo;
    },
    // Obtém log de erros com filtros
    getLog(filterOptions = {}) {
      const { limit = 50, severity = null, category = null, moduleId = null } = filterOptions;
      let filtered = [..._errorLog];
      if (severity) {
        filtered = filtered.filter((e) => e.severity === severity);
      }
      if (category) {
        filtered = filtered.filter((e) => e.category === category);
      }
      if (moduleId) {
        filtered = filtered.filter((e) => e.context?.moduleId === moduleId);
      }
      return filtered.slice(-limit);
    },
    // Limpa log
    clear() {
      const count = _errorLog.length;
      _errorLog = [];
      return count;
    },
    // Obtém tamanho do log
    size() {
      return _errorLog.length;
    },
    // Obtém erros recentes
    getRecent(timeWindow = 6e4) {
      const cutoff = Date.now() - timeWindow;
      return _errorLog.filter((e) => e.timestamp > cutoff);
    },
    // Obtém erros críticos recentes
    getCritical(timeWindow = 3e5, severity = "critical") {
      const cutoff = Date.now() - timeWindow;
      return _errorLog.filter((e) => e.severity === severity && e.timestamp > cutoff);
    }
  };
}
var error_store_default = { createErrorStore };
export {
  MODULE_ID,
  VERSION,
  createErrorStore,
  error_store_default as default
};
