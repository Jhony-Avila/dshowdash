// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.1.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-04/core/data-loader
// PURPOSE: Panel-04 DataLoader
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   MODULE_ID — module constant
//   VERSION — module constant
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

export const MODULE_ID = 'panel-04/core/data-loader';
export const VERSION = '9.3.0-P2-ENTERPRISE';

export class DataLoader {
  [key: string]: any;
  constructor(context: Record<string, unknown>) {
    this.context = context;
    this.currentRequestId = 0;
    this.activeLoadRequest = null;
    this.performanceMetrics = {
      avgLoadTime: 0,
      totalRequests: 0,
      failedRequests: 0,
      successRate: 100
    };
  }

  async loadData() {
    const requestId = ++this.currentRequestId;
    const startTime = performance.now();

    if (this.activeLoadRequest) {
      this.context.apiClient?.cancel?.();
    }

    this.activeLoadRequest = requestId;
    this.performanceMetrics.totalRequests++;

    try {
      this.context.store?.setLoading(true);

      const result = await this.context.apiClient?.fetchData({
        period: this.context.currentPeriod || '24h',
        signal: this.context.abortController?.signal
      });

      if (requestId !== this.currentRequestId) return;

      const loadTime = performance.now() - startTime;
      this.updatePerformanceMetrics(loadTime, true);

      if (result?.success) {
        this.context.consecutiveErrors = 0;
        this.context.circuitBreaker?.recordSuccess?.();
        this.context.store?.setData(result.payload);
        this.context.initialLoadDone = true;
        this.context.lastLoadTime = Date.now();
        this.context.loadCount++;
      } else {
        throw new Error(result?.error || 'LOAD_FAILED');
      }

    } catch (error: any) {
      if (requestId !== this.currentRequestId) return;

      const loadTime = performance.now() - startTime;
      this.updatePerformanceMetrics(loadTime, false);
      this.performanceMetrics.failedRequests++;

      this.context.consecutiveErrors++;
      this.context.circuitBreaker?.recordFailure?.(error);

      if (!this.context.initialLoadDone) {
        this.context.store?.setError(error.message || 'Erro ao carregar');
      }

      this.context._log?.('error', 'load.failed', { error: error.message });

    } finally {
      if (requestId === this.currentRequestId) {
        this.activeLoadRequest = null;
      }
    }
  }

  getRefreshInterval() {

    // @ts-expect-error TS migration - TS2339
    if (typeof navigator !== 'undefined' && navigator.connection) {
      const conn = (navigator as any).connection;
      if (conn.effectiveType === '2g' || conn.effectiveType === 'slow-2g') {
        return 120000;
      }
      if (conn.effectiveType === '3g') {
        return 90000;
      }
    }
    return 60000;
  }

  updatePerformanceMetrics(loadTime: number, success: boolean) {
    const total = this.performanceMetrics.totalRequests;
    if (total > 0) {
      this.performanceMetrics.avgLoadTime = 
        (this.performanceMetrics.avgLoadTime * (total - 1) + loadTime) / total;
    }
    if (total > 0) {
      const successful = total - this.performanceMetrics.failedRequests;
      this.performanceMetrics.successRate = (successful / total) * 100;
    }
  }

  getMetrics() {
    return { ...this.performanceMetrics };
  }

  reset() {
    this.currentRequestId = 0;
    this.activeLoadRequest = null;
    this.performanceMetrics = {
      avgLoadTime: 0,
      totalRequests: 0,
      failedRequests: 0,
      successRate: 100
    };
  }

  info() { return { moduleId: MODULE_ID, version: VERSION }; }
  healthCheck() { 
    return { 
      status: 'HEALTHY', 
      moduleId: MODULE_ID, 
      version: VERSION,
      metrics: this.getMetrics()
    }; 
  }
}

export default DataLoader;
