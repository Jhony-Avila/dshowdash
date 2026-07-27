// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.2.0-P17WI-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: orchestrator-selectors
// PURPOSE: Orchestrator Selectors
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   SCHEDULER_MODES, HEALTH_STATES from ../bus/events-map.js
//   orchestratorStore from ./store.js
//
// PROVIDES:
//   info() — exported function
//   healthCheck() — exported function
//   VERSION — module constant
//   MODULE_ID — module constant
//   getVersion() — exported function
//   getStatus() — exported function
//   getCurrentPreset() — exported function
//   getActivePanels() — exported function
//   getActivePanelIds() — exported function
//   getRegisteredModules() — exported function
//   getRegisteredModuleIds() — exported function
//   getModuleById() — exported function
//   getSchedulerMode() — exported function
//   isSchedulerActive() — exported function
//   isSchedulerDegraded() — exported function
//   ... and 12 more exports
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

import orchestratorStore from './store.js';
import { SCHEDULER_MODES, HEALTH_STATES } from '../bus/events-map.js';

declare const _state: { _initialized?: boolean } | null;
const VERSION = '9.3.0-P2-ENTERPRISE';
const MODULE_ID = 'orchestrator-selectors';

function getVersion() { return VERSION; }
function getStatus() { return orchestratorStore.get('status'); }
function getCurrentPreset() { return orchestratorStore.get('currentPreset'); }
function getActivePanels() { return orchestratorStore.get('activePanels') || []; }
function getActivePanelIds() { const panels = getActivePanels(); return panels.map((p: Record<string, unknown>) => p.panelId || p); }

function getRegisteredModules() {
  const modules = orchestratorStore.get('registeredModules');
  return Array.from(modules.entries());
}

function getRegisteredModuleIds() {
  const modules = orchestratorStore.get('registeredModules');
  return Array.from(modules.keys());
}

function getModuleById(id: string) {
  const modules = orchestratorStore.get('registeredModules');
  return modules.get(id) || null;
}

function getSchedulerMode() { return orchestratorStore.get('schedulerMode'); }
function isSchedulerActive() { return getSchedulerMode() === SCHEDULER_MODES.ACTIVE; }
function isSchedulerDegraded() { return getSchedulerMode() === SCHEDULER_MODES.DEGRADED; }
function getErrorCount() { return orchestratorStore.get('errorCount'); }
function getWarningCount() { return orchestratorStore.get('warningCount'); }

function getHealthyModules() {
  const health = orchestratorStore.get('moduleHealth');
  const healthy: string[] = [];
  health.forEach((data: { state: string }, id: string) => { if (data.state === HEALTH_STATES.OK) healthy.push(id); });
  return healthy;
}

function getDegradedModules() {
  const health = orchestratorStore.get('moduleHealth');
  const degraded: string[] = [];
  health.forEach((data: { state: string }, id: string) => { if (data.state === HEALTH_STATES.DEGRADED || data.state === HEALTH_STATES.ERROR) degraded.push(id); });
  return degraded;
}

function getUptime() { const startTime = orchestratorStore.get('startTime'); return Date.now() - startTime; }
function getMetrics() { return orchestratorStore.getMetrics(); }
function getLastLayoutChange() { return orchestratorStore.get('lastLayoutChange'); }
function getConfig() { return orchestratorStore.get('config'); }
function isReady() { return getStatus() === 'READY' || getStatus() === 'RUNNING'; }
function isInitializing() { return getStatus() === 'INITIALIZING'; }
function hasErrors() { return getErrorCount() > 0; }

function getSnapshot() {
  return { version: VERSION, status: getStatus(), preset: getCurrentPreset(), activePanels: getActivePanelIds(), schedulerMode: getSchedulerMode(), errors: getErrorCount(), warnings: getWarningCount(), uptime: getUptime(), metrics: getMetrics() };
}

export { VERSION, MODULE_ID, getVersion, getStatus, getCurrentPreset, getActivePanels, getActivePanelIds, getRegisteredModules, getRegisteredModuleIds, getModuleById, getSchedulerMode, isSchedulerActive, isSchedulerDegraded, getErrorCount, getWarningCount, getHealthyModules, getDegradedModules, getUptime, getMetrics, getLastLayoutChange, getConfig, isReady, isInitializing, hasErrors, getSnapshot };

export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: (_state?._initialized !== false) ? 'HEALTHY' : 'DEGRADED', moduleId: MODULE_ID, version: VERSION, checks: { selectorsReady: true } }; }
