// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.2.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: orchestrator-normalization
// PURPOSE: Orchestrator Normalization
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   getVersion() — exported function
//   normalizeModuleConfig() — exported function
//   normalizePanelList() — exported function
//   normalizeHealthState() — exported function
//   normalizeApiResponse() — exported function
//   normalizeEventPayload() — exported function
//   normalizeError() — exported function
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

export const VERSION = '9.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'orchestrator-normalization';

export function getVersion() { return VERSION; }

export function normalizeModuleConfig(config: Record<string, unknown>) {
  return {
    id: config.id || 'unknown',
    name: config.name || config.id || 'Unknown Module',
    version: config.version || '0.0.0',
    type: config.type || 'panel',
    critical: config.critical === true,
    dependencies: Array.isArray(config.dependencies) ? config.dependencies : [],
    refreshInterval: typeof config.refreshInterval === 'number' ? config.refreshInterval : 60000,
    permissions: Array.isArray(config.permissions) ? config.permissions : [],
    featureFlags: Array.isArray(config.featureFlags) ? config.featureFlags : [],
    events: Array.isArray(config.events) ? config.events : [],
    metadata: config.metadata || {}
  };
}

export function normalizePanelList(panels: unknown[]) {
  if (!Array.isArray(panels)) return [];
  return panels.map((panel, index) => {
    if (typeof panel === 'string') {
      return { panelId: panel, title: panel, order: (index + 1) * 10, visible: true, container: 'grid-1' };
    }
    const p = panel as Record<string, unknown>;
    return {
      panelId: p.panelId || p.id || 'unknown',
      title: p.title || p.name || p.panelId,
      order: p.order || (index + 1) * 10,
      visible: p.visible !== false,
      container: p.container || 'grid-1',
      config: p.config || {}
    };
  });
}

export function normalizeHealthState(state: unknown) {
  const validStates = ['OK', 'WARN', 'ERROR', 'DEGRADED', 'UNKNOWN'];
  const upperState = String(state).toUpperCase();
  if (validStates.indexOf(upperState) !== -1) return upperState;
  return 'UNKNOWN';
}

export function normalizeApiResponse(response: Record<string, unknown>) {
  return {
    success: response.success === true || response.ok === true,
    data: response.data || response.result || response.body || null,
    error: response.error || response.message || null,
    status: response.status || (response.success ? 200 : 500),
    timestamp: response.timestamp || Date.now(),
    meta: response.meta || {}
  };
}

export function normalizeEventPayload(payload: Record<string, unknown>, source: string = 'orchestrator') {
  return Object.assign({}, payload, { _source: source, _moduleId: MODULE_ID, _timestamp: Date.now(), _version: VERSION });
}

export function normalizeError(error: unknown) {
  if (error instanceof Error) {
    return { name: error.name, message: error.message, stack: error.stack, timestamp: Date.now() };
  }
  return { name: 'Error', message: String(error), stack: null, timestamp: Date.now() };
}

export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION, checks: { normalizationReady: true } }; }

export default { VERSION, MODULE_ID, getVersion, normalizeModuleConfig, normalizePanelList, normalizeHealthState, normalizeApiResponse, normalizeEventPayload, normalizeError, info, healthCheck };
