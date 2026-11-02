// EnterpriseLoader - State Management
// DEPENDENCY CONTRACT — Core js module
// @version 8.2.0-ENTERPRISE
// @changelog v8.2.0-ENTERPRISE - ES6 modernization (const/let, arrow functions)
'use strict';

export const MODULE_ID = 'enterprise-loader-state';
export const VERSION = '8.2.0-P2-ENTERPRISE';

export interface FailedComponent {
  name: string;
  error: string;
  critical: boolean;
  stage: string;
}

export interface StageResult {
  success: boolean;
  issues: string[];
  error: string | null;
  raw: unknown;
  duration: number;
}

export interface EnterpriseLoaderState {
  initialized: boolean;
  initTimestamp: number | null;
  loadStartTime: number | null;
  components: Record<string, unknown>;
  loadedComponents: string[];
  initializedComponents: string[];
  failedComponents: FailedComponent[];
  stageResults: Record<string, StageResult>;
}

export interface EnterpriseLoaderMetrics {
  loadAttempts: number;
  initAttempts: number;
  componentLoadErrors: number;
  componentInitErrors: number;
  totalLoadTime: number;
  totalInitTime: number;
  lastLoadAt: number | null;
  lastInitAt: number | null;
}

export const state: EnterpriseLoaderState = { initialized: false, initTimestamp: null, loadStartTime: null, components: {}, loadedComponents: [], initializedComponents: [], failedComponents: [], stageResults: {} };

export const metrics: EnterpriseLoaderMetrics = { loadAttempts: 0, initAttempts: 0, componentLoadErrors: 0, componentInitErrors: 0, totalLoadTime: 0, totalInitTime: 0, lastLoadAt: null, lastInitAt: null };

export const resetState = (): void => { state.initialized = false; state.initTimestamp = null; state.loadStartTime = null; state.components = {}; state.loadedComponents = []; state.initializedComponents = []; state.failedComponents = []; state.stageResults = {}; };

export const resetMetrics = (): void => { metrics.loadAttempts = 0; metrics.initAttempts = 0; metrics.componentLoadErrors = 0; metrics.componentInitErrors = 0; metrics.totalLoadTime = 0; metrics.totalInitTime = 0; metrics.lastLoadAt = null; metrics.lastInitAt = null; };

export const resetAll = (): void => { resetState(); resetMetrics(); };

export const info = (): { moduleId: string; version: string } => ({ moduleId: MODULE_ID, version: VERSION });
export const healthCheck = (): { status: string; moduleId: string; version: string; initialized: boolean } => ({ status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION, initialized: state.initialized });

export default { MODULE_ID, VERSION, state, metrics, resetState, resetMetrics, resetAll, info, healthCheck };
