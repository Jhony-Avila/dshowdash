// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (2.0.0-MODULAR-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: metrics-tracker
// PURPOSE: Error Metrics Tracker
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   createMetricsTracker() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

export const VERSION = '15.2.0-MODULAR';
export const MODULE_ID = 'main.ui.container-main.utils.error-handler.metrics-tracker';

export function createMetricsTracker() {
  let _metrics = {
    total: 0,
    handled: 0,
    unhandled: 0,
    recovered: 0,
    byCategory: {},
    bySeverity: {}
  };

  return {
    // Incrementa contador total
    incrementTotal() {
      _metrics.total++;
    },

    // Incrementa handled
    incrementHandled() {
      _metrics.handled++;
    },

    // Incrementa unhandled
    incrementUnhandled() {
      _metrics.unhandled++;
    },

    // Incrementa recovered
    incrementRecovered() {
      _metrics.recovered++;
    },

    // Registra por categoria
    trackCategory(category: string) {
      // @ts-expect-error TS migration - TS2365
      (_metrics.byCategory as Record<string, unknown>)[category] = ((_metrics.byCategory as Record<string, unknown>)[category] || 0) + 1;
    },

    // Registra por severidade
    trackSeverity(severity: string) {
      // @ts-expect-error TS migration - TS2365
      (_metrics.bySeverity as Record<string, unknown>)[severity] = ((_metrics.bySeverity as Record<string, unknown>)[severity] || 0) + 1;
    },

    // Registra erro completo
    track(errorInfo: unknown) {
      this.incrementTotal();
      if ((errorInfo as Record<string, unknown>).handled) {
        this.incrementHandled();
      } else {
        this.incrementUnhandled();
      }
      if ((errorInfo as Record<string, unknown>).recovered) {
        this.incrementRecovered();
      }
      // @ts-expect-error strict migration — TS2345
      this.trackCategory((errorInfo as Record<string, unknown>).category);
      // @ts-expect-error strict migration — TS2345
      this.trackSeverity((errorInfo as Record<string, unknown>).severity);
    },

    // Obtém métricas
    getMetrics() {
      return { ..._metrics };
    },

    // Reseta métricas
    reset() {
      _metrics = {
        total: 0,
        handled: 0,
        unhandled: 0,
        recovered: 0,
        byCategory: {},
        bySeverity: {}
      };
    }
  };
}

export default { createMetricsTracker };
