// EnterpriseLoader - Component Loader
// DEPENDENCY CONTRACT — Core js module
// @version 8.2.0-ENTERPRISE
// @changelog v8.2.0-ENTERPRISE - ES6 modernization (const/let, arrow functions, template literals)
'use strict';

import { _log } from './constants.js';
import { trackLoaderEvent } from './telemetry-helper.js';
import { state, metrics } from './state.js';
import type { StageResult } from './state.js';

export const MODULE_ID = 'enterprise-loader-component-loader';
export const VERSION = '8.2.0-P2-ENTERPRISE';

export interface ComponentDescriptor {
  name: string;
  path: string;
  critical: boolean;
  initOptions?: Record<string, unknown>;
}

interface ComponentInstance {
  init?: (options: Record<string, unknown>) => Promise<void> | void;
  [key: string]: unknown;
}

interface ComponentLoadResult {
  success: boolean;
  name: string;
  error?: string;
}

export const loadComponent = async (component: ComponentDescriptor): Promise<ComponentLoadResult> => {
  try {
    const module: Record<string, unknown> = await import(component.path);
    const instance = (module.default || module[component.name]) as ComponentInstance | undefined;
    if (instance) {
      state.components[component.name] = instance;
      (window as unknown as Record<string, unknown>)[component.name] = instance;
      state.loadedComponents.push(component.name);
      trackLoaderEvent('component:loaded', { name: component.name, critical: component.critical });
      return { success: true, name: component.name };
    }
    return { success: false, name: component.name, error: 'No instance exported' };
  } catch (error) {
    metrics.componentLoadErrors++;
    state.failedComponents.push({ name: component.name, error: (error as Error).message, critical: component.critical, stage: 'load' });
    trackLoaderEvent('component:load-error', { name: component.name, error: (error as Error).message, critical: component.critical });
    return { success: false, name: component.name, error: (error as Error).message };
  }
};

export const initComponent = async (component: ComponentDescriptor): Promise<ComponentLoadResult> => {
  const instance = state.components[component.name] as ComponentInstance | undefined;
  if (!instance) return { success: false, name: component.name, error: 'Not loaded' };
  try {
    if (typeof instance.init === 'function') await instance.init(component.initOptions || {});
    state.initializedComponents.push(component.name);
    trackLoaderEvent('component:initialized', { name: component.name });
    return { success: true, name: component.name };
  } catch (error) {
    metrics.componentInitErrors++;
    state.failedComponents.push({ name: component.name, error: (error as Error).message, critical: component.critical, stage: 'init' });
    trackLoaderEvent('component:init-error', { name: component.name, error: (error as Error).message, critical: component.critical });
    return { success: false, name: component.name, error: (error as Error).message };
  }
};

export const safeStage = async (stageName: string, fn: () => Promise<{ success?: boolean; issues?: string[] } | unknown>): Promise<StageResult> => {
  const stageResult: StageResult = { success: false, issues: [], error: null, raw: null, duration: 0 };
  const startTime: number = performance.now();
  try {
    const raw = await fn() as { success?: boolean; issues?: string[] } | null;
    stageResult.raw = raw;
    stageResult.success = raw?.success !== false;
    if (raw?.issues) stageResult.issues = raw.issues;
  } catch (err) {
    stageResult.success = false;
    stageResult.error = (err as Error)?.message || String(err) || 'Unknown error';
    stageResult.issues.push(`${stageName}-error`);
    trackLoaderEvent(`stage:${stageName}:error`, { error: stageResult.error });
    _log('error', `Stage ${stageName} failed:`, stageResult.error);
  }
  stageResult.duration = Math.round(performance.now() - startTime);
  state.stageResults[stageName] = stageResult;
  return stageResult;
};

export const info = (): { moduleId: string; version: string } => ({ moduleId: MODULE_ID, version: VERSION });
export const healthCheck = (): { status: string; moduleId: string; version: string } => ({ status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION });

export default { MODULE_ID, VERSION, loadComponent, initComponent, safeStage, info, healthCheck };
