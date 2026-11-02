// Migrado para TypeScript: 2026-02-25
// Component Readiness Tracker
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.1.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// @version 1.0.0
// @description Rastreia quais componentes ja reagiram ao READY
// @melhoria #24 - Saber quais componentes estao prontos
'use strict';

export const MODULE_ID = 'readiness-tracker' as const;
export const VERSION = '1.0.0' as const;

interface ComponentState {
  ready: boolean;
  readyAt: number | null;
}

interface ReadinessStatus {
  total: number;
  ready: number;
  pending: number;
  allReady: boolean;
  components: Record<string, ComponentState>;
}

interface ReadinessTrackerInfo {
  moduleId: typeof MODULE_ID;
  version: typeof VERSION;
  status: ReadinessStatus;
}

let _components: Record<string, ComponentState> = {};
let _allReadyCallbacks: Array<(status: ReadinessStatus) => void> = [];
let _allReadyFired: boolean = false;

export function markReady(componentId: string): void {
  _components[componentId] = { ready: true, readyAt: Date.now() };
  _checkAllReady();
}

export function markNotReady(componentId: string): void {
  _components[componentId] = { ready: false, readyAt: null };
  _allReadyFired = false;
}

export function registerExpected(componentIds: string[]): void {
  for (let i = 0; i < componentIds.length; i++) {
    if (!_components[componentIds[i]]) {
      _components[componentIds[i]] = { ready: false, readyAt: null };
    }
  }
}

export function isReady(componentId: string): boolean {
  return _components[componentId] ? _components[componentId].ready : false;
}

export function allReady(): boolean {
  const ids = Object.keys(_components);
  for (let i = 0; i < ids.length; i++) {
    if (!_components[ids[i]].ready) return false;
  }
  return ids.length > 0;
}

function _checkAllReady(): void {
  if (!_allReadyFired && allReady()) {
    _allReadyFired = true;
    for (let i = 0; i < _allReadyCallbacks.length; i++) {
      try { _allReadyCallbacks[i](getStatus()); } catch (e: unknown) {}
    }
  }
}

export function onAllReady(callback: (status: ReadinessStatus) => void): void {
  if (_allReadyFired) {
    try { callback(getStatus()); } catch (e: unknown) {}
  } else {
    _allReadyCallbacks.push(callback);
  }
}

export function getStatus(): ReadinessStatus {
  const ids = Object.keys(_components);
  let readyCount: number = 0;
  for (let i = 0; i < ids.length; i++) {
    if (_components[ids[i]].ready) readyCount++;
  }
  return {
    total: ids.length,
    ready: readyCount,
    pending: ids.length - readyCount,
    allReady: readyCount === ids.length && ids.length > 0,
    components: Object.assign({}, _components)
  };
}

export function getPending(): string[] {
  const pending: string[] = [];
  const ids = Object.keys(_components);
  for (let i = 0; i < ids.length; i++) {
    if (!_components[ids[i]].ready) pending.push(ids[i]);
  }
  return pending;
}

export function reset(): void {
  _components = {};
  _allReadyCallbacks = [];
  _allReadyFired = false;
}

export function info(): ReadinessTrackerInfo {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    status: getStatus()
  };
}

export default {
  MODULE_ID,
  VERSION,
  markReady,
  markNotReady,
  registerExpected,
  isReady,
  allReady,
  onAllReady,
  getStatus,
  getPending,
  reset,
  info
};
