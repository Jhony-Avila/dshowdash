// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (2.0.0-MODULAR-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: error-store
// PURPOSE: Error Store
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   MAX_ERROR_LOG from ./constants.js
//   classifyCategory, classifySeverity, suggestRecovery from ./classifier.js
//
// PROVIDES:
//   createErrorStore() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   window.location
// ═══════════════════════════════════════════════════════════════
'use strict';

import { MAX_ERROR_LOG } from './constants.js';
import { classifyCategory, classifySeverity, suggestRecovery } from './classifier.js';

export const VERSION = '15.2.0-MODULAR';
export const MODULE_ID = 'main.ui.container-main.utils.error-handler.error-store';

export function createErrorStore(options: Record<string, any> = {}) {
  const { logCallback, maxLog = MAX_ERROR_LOG } = options;

  let _errorLog: unknown[] = [];

  return {
    // Cria objeto de informação de erro
    createErrorInfo(error: Record<string, unknown>, context: Record<string, any> = {}) {
      const category = classifyCategory(error, context);
      const severity = classifySeverity(error, context);
      
      return {
        id: `err-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: Date.now(),
        name: error.name || 'Error',
        message: error.message || String(error),
        // @ts-expect-error TS migration - TS2339
        stack: error.stack?.substring(0, 1500) || '',
        category,
        severity,
        suggestedRecovery: suggestRecovery(error, context),
        context: {
          moduleId: context.moduleId || null,
          operation: context.operation || null,
          url: typeof window !== 'undefined' ? window.location?.href : '',
          ...context
        },
        handled: false,
        recovered: false,
        recoveryAttempts: 0
      };
    },

    // Armazena erro no log
    log(errorInfo: unknown) {
      _errorLog.push(errorInfo);
      if (_errorLog.length > maxLog) {
        _errorLog.shift();
      }
      
      // Callback para integração com logger externo
      logCallback?.(errorInfo);
      
      return errorInfo;
    },

    // Obtém log de erros com filtros
    getLog(filterOptions: Record<string, any> = {}) {
      const { limit = 50, severity = null, category = null, moduleId = null } = filterOptions;
      
      let filtered = [..._errorLog];
      
      if (severity) {
        filtered = filtered.filter(e => (e as Record<string, unknown>).severity === severity);
      }
      if (category) {
        filtered = filtered.filter(e => (e as Record<string, unknown>).category === category);
      }
      if (moduleId) {
        // @ts-expect-error TS migration - TS2339
        filtered = filtered.filter(e => (e as Record<string, unknown>).context?.moduleId === moduleId);
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
    getRecent(timeWindow = 60000) {
      const cutoff = Date.now() - timeWindow;
      // @ts-expect-error TS migration - TS2365
      return _errorLog.filter(e => (e as Record<string, unknown>).timestamp > cutoff);
    },

    // Obtém erros críticos recentes
    getCritical(timeWindow = 300000, severity = 'critical') {
      const cutoff = Date.now() - timeWindow;
      // @ts-expect-error TS migration - TS2339
      return _errorLog.filter(e => (e as Record<string, unknown>).severity === severity && e.timestamp > cutoff);
    }
  };
}

export default { createErrorStore };
