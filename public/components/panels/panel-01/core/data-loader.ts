// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.1.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-01/core/data-loader
// PURPOSE: Panel-01 Data Loader
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   apiClient from ../services/api.js
//   CircuitBreaker from ../utils/circuit-breaker.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   info() — exported function
//   healthCheck() — exported function
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

import { apiClient } from '../services/api.js';
import { CircuitBreaker } from '../utils/circuit-breaker.js';

export const VERSION = '9.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'panel-01/core/data-loader';

export class DataLoader {
  [key: string]: any;
  constructor(options: { failureThreshold?: number; resetTimeout?: number } = {}) {
    this.circuitBreaker = new CircuitBreaker({
      failureThreshold: options.failureThreshold || 3,
      resetTimeout: options.resetTimeout || 30000
    });
    this.abortController = null;
    this.lastParams = null;
  }

  async load(params: Record<string, unknown>) {
    this.abort();
    this.abortController = new AbortController();
    this.lastParams = params;

    return this.circuitBreaker.call(async () => {
      const result = await apiClient.fetchAllData(params, this.abortController.signal);
      if (!result.ok) throw new Error(result.error || 'Failed to load data');
      return result;
    });
  }

  async loadDetail(id: string | number) {
    return this.circuitBreaker.call(async () => {
      const result = await apiClient.fetchRequisicao360(id);
      if (!result.ok) throw new Error(result.error || 'Failed to load detail');
      return result;
    });
  }

  async reload() {
    if (this.lastParams) return this.load(this.lastParams);
    throw new Error('No previous params to reload');
  }

  abort() {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
  }

  getCircuitState() {
    return this.circuitBreaker.getState();
  }

  destroy() {
    this.abort();
    this.circuitBreaker.reset();
  }
}

export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION }; }
export default DataLoader;
