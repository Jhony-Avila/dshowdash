// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.3.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: components._shared.permissions.migration-bridge
// PURPOSE: Bridge between UARPS and legacy minLevel permission systems
// ───────────────────────────────────────────────────────────────
// @contract CAN_ACCESS_ROUTE - canAccessRoute(path, config) checks route permission
// @contract CAN_ACCESS_PANEL - canAccessPanel(id, config) checks panel permission
// @contract CAN_TRIGGER - canTrigger(id) checks trigger permission
// @contract CAN_ACCESS_REGION - canAccessRegion(id) checks region permission
// @contract SET_MODE - setMode(mode) sets permission mode
// @contract HEALTH - healthCheck() and info() for observability
// @contract PORTS - injectPorts()/getPorts() for dependency injection
// ───────────────────────────────────────────────────────────────
// IMPORTS: createCorePorts from /core/runtime/ports-profiles.js
// PROVIDES: canAccessRoute, canAccessPanel, canTrigger, canAccessRegion, setMode, getMode, setLogDecisions, healthCheck, info, injectPorts, getPorts, VERSION, MODULE_ID
// @changelog v1.3.0-P2-ENTERPRISE: Standardized DEPENDENCY CONTRACT header
// @changelog v1.3.0-P17WI: PortsFactory/PortsProfiles migration
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createCorePorts } from '/core/runtime/ports-profiles.js';

export const VERSION = '1.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'components._shared.permissions.migration-bridge';

const hasWindow = typeof window !== 'undefined';
const Ports = createCorePorts({ moduleId: MODULE_ID });

function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
export function injectPorts(p: Record<string, unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

const _log = (level: 'error' | 'warn' | 'info' | 'debug', msg: string, data?: unknown) => {
  const logger = _getPort('logger');
  if (!logger) return;
  const prefix = `[${MODULE_ID}]`;
  if (level === 'error') { if (logger.error) logger.error(prefix, msg, data || ''); }
  else if (level === 'warn') { if (logger.warn) logger.warn(prefix, msg, data || ''); }
  else if (level === 'debug') { if (logger.debug) logger.debug(prefix, msg, data || ''); }
  else { if (logger.info) logger.info(prefix, msg, data || ''); }
};

const _config = { mode: 'uarps-first', logDecisions: false, defaultAllow: true };

const ROUTE_TO_TRIGGER: Record<string, string> = {
  '/admin/usuarios': 'trigger:navrail:admin-users',
  '/admin/permissoes': 'trigger:navrail:admin-settings',
  '/admin/sessoes': 'trigger:navrail:admin-settings',
  '/admin/feature-flags': 'trigger:navrail:admin-settings',
  '/admin/auditoria': 'trigger:navrail:admin-settings',
  '/admin/navegacao': 'trigger:navrail:admin-settings',
  '/admin-users': 'trigger:navrail:admin-users',
  '/admin-settings': 'trigger:navrail:admin-settings',
  '/preferencias': 'trigger:navrail:home',
  '/profile': 'trigger:navrail:home',
  '/settings': 'trigger:navrail:home'
};

const PANEL_TO_TRIGGER: Record<string, string> = {
  'panel-user-management': 'trigger:navrail:admin-users',
  'panel-permissions-admin': 'trigger:navrail:admin-settings',
  'panel-session-admin': 'trigger:navrail:admin-settings',
  'panel-feature-flags-admin': 'trigger:navrail:admin-settings',
  'panel-audit-trail': 'trigger:navrail:admin-settings',
  'panel-nav-admin': 'trigger:navrail:admin-settings',
  'panel-enterprise': 'trigger:navrail:admin-settings',
  'panel-orchestrator': 'trigger:navrail:admin-settings',
  'panel-health-dashboard': 'trigger:navrail:admin-settings',
  'panel-15': 'trigger:navrail:analytics',
  'panel-16': 'trigger:navrail:database',
  'panel-17': 'trigger:navrail:analytics',
  'panel-18': 'trigger:navrail:analytics',
  'panel-19': 'trigger:navrail:admin-settings',
  'panel-cards': 'trigger:navrail:dashboard',
  'panel-dashboard': 'trigger:navrail:dashboard'
};

const PANEL_TO_REGION: Record<string, string> = {
  'panel-user-management': 'region:panel:user-management',
  'panel-permissions-admin': 'region:panel:permissions-admin',
  'panel-session-admin': 'region:panel:session-admin',
  'panel-feature-flags-admin': 'region:panel:feature-flags-admin',
  'panel-audit-trail': 'region:panel:audit-trail',
  'panel-nav-admin': 'region:panel:nav-admin',
  'panel-enterprise': 'region:panel:enterprise',
  'panel-orchestrator': 'region:panel:orchestrator',
  'panel-health-dashboard': 'region:panel:health-dashboard',
  'panel-cards': 'region:panel:cards',
  'panel-dashboard': 'region:panel:dashboard'
};

function _getPermissions(): any { return hasWindow ? (window as any).Permissions : null; }

function _checkUARPS(triggerId: string, regionId?: string) {
  const perms = _getPermissions();
  if (!perms) return null;
  if (triggerId) {
    const canTrigger = perms.canTrigger(triggerId);
    if (canTrigger === false) return false;
    if (canTrigger === true) return true;
  }
  if (regionId) {
    const canAccess = perms.canAccessRegion(regionId);
    if (canAccess === false) return false;
    if (canAccess === true) return true;
  }
  return null;
}

function _checkMinLevel(requiredLevel: number, userLevel: number) {
  if (!requiredLevel || requiredLevel === 0) return true;
  if (userLevel === undefined || userLevel === null) return false;
  return userLevel >= requiredLevel;
}

function _getUserLevel() {
  if (hasWindow && window.CoreAuthAdapter && window.CoreAuthAdapter.getLevel) {
    const level = window.CoreAuthAdapter.getLevel();
    return level !== null && level !== undefined ? level : 0;
  }
  const gs = _getPort('globalState');
  if (gs && gs.getState) {
    const state = gs.getState();
    if (state && state.auth && state.auth.user) return state.auth.user.level || 0;
    if (state && state.user) return state.user.level || 0;
  }
  return 0;
}

export function canAccessRoute(routePath: string, routeConfig: Record<string, unknown>) {
  if (!routeConfig) routeConfig = {};
  const triggerId = ROUTE_TO_TRIGGER[routePath] || null;
  const minLevel = (routeConfig.minLevel || 0) as number;
  const userLevel = _getUserLevel() as number;
  let decision = { allowed: true, source: 'default', details: {} };

  if (_config.mode === 'uarps-first' || _config.mode === 'uarps-only') {
    // @ts-expect-error strict migration — TS2345
    const uarpsResult = _checkUARPS(triggerId);
    if (uarpsResult !== null) {
      decision = { allowed: uarpsResult, source: 'uarps', details: { triggerId, uarpsResult } };
    } else if (_config.mode === 'uarps-first') {
      const minLevelResult = _checkMinLevel(minLevel, userLevel);
      decision = { allowed: minLevelResult, source: 'minlevel-fallback', details: { minLevel, userLevel } };
    } else {
      decision = { allowed: _config.defaultAllow, source: 'uarps-undefined', details: { triggerId } };
    }
  } else if (_config.mode === 'minlevel-first' || _config.mode === 'minlevel-only') {
    const minLevelResult2 = _checkMinLevel(minLevel as number, userLevel as number);
    if (_config.mode === 'minlevel-only') {
      decision = { allowed: minLevelResult2, source: 'minlevel', details: { minLevel, userLevel } };
    } else {
      if (minLevelResult2) {
        // @ts-expect-error strict migration — TS2345
        const uarpsResult2 = _checkUARPS(triggerId);
        if (uarpsResult2 === false) {
          decision = { allowed: false, source: 'uarps-override', details: { triggerId, minLevelPassed: true } };
        } else {
          decision = { allowed: true, source: 'minlevel+uarps', details: { minLevel, userLevel, triggerId } };
        }
      } else {
        decision = { allowed: false, source: 'minlevel', details: { minLevel, userLevel } };
      }
    }
  }

  if (_config.logDecisions) _log('debug', `Route access: ${routePath}`, decision);
  return decision;
}

export function canAccessPanel(panelId: string, panelConfig: Record<string, unknown>) {
  if (!panelConfig) panelConfig = {};
  const triggerId = PANEL_TO_TRIGGER[panelId] || null;
  const regionId = PANEL_TO_REGION[panelId] || (`region:panel:${panelId}`);
  const minLevel = (panelConfig.minLevel || 0) as number;
  const userLevel = _getUserLevel() as number;
  let decision = { allowed: true, source: 'default', details: {} };

  if (_config.mode === 'uarps-first' || _config.mode === 'uarps-only') {
    // @ts-expect-error strict migration — TS2345
    const uarpsResult = _checkUARPS(triggerId, regionId);
    if (uarpsResult !== null) {
      decision = { allowed: uarpsResult, source: 'uarps', details: { triggerId, regionId, uarpsResult } };
    } else if (_config.mode === 'uarps-first') {
      const minLevelResult = _checkMinLevel(minLevel, userLevel);
      decision = { allowed: minLevelResult, source: 'minlevel-fallback', details: { minLevel, userLevel } };
    } else {
      decision = { allowed: _config.defaultAllow, source: 'uarps-undefined', details: { triggerId, regionId } };
    }
  } else {
    const minLevelResult2 = _checkMinLevel(minLevel as number, userLevel as number);
    decision = { allowed: minLevelResult2, source: 'minlevel', details: { minLevel, userLevel } };
  }

  if (_config.logDecisions) _log('debug', `Panel access: ${panelId}`, decision);
  return decision;
}

export function canTrigger(triggerId: string) {
  const perms = _getPermissions();
  if (!perms) return true;
  return perms.canTrigger(triggerId);
}

export function canAccessRegion(regionId: string) {
  const perms = _getPermissions();
  if (!perms) return true;
  return perms.canAccessRegion(regionId);
}

export function setMode(mode: string) {
  if (['uarps-first', 'minlevel-first', 'uarps-only', 'minlevel-only'].indexOf(mode) >= 0) {
    _config.mode = mode;
    _log('info', `Mode changed to: ${mode}`);
  }
}

export function getMode() { return _config.mode; }
export function setLogDecisions(enabled: boolean) { _config.logDecisions = enabled; }

export function healthCheck() {
  const ps = Ports.snapshot();
  const perms = _getPermissions();
  const logger = _getPort('logger');
  return {
    status: perms ? 'HEALTHY' : 'DEGRADED',
    version: VERSION,
    moduleId: MODULE_ID,
    mode: _config.mode,
    uarpsAvailable: !!perms,
    loggerAvailable: !!logger,
    mappings: {
      routes: Object.keys(ROUTE_TO_TRIGGER).length,
      panels: Object.keys(PANEL_TO_TRIGGER).length,
      regions: Object.keys(PANEL_TO_REGION).length
    },
    portsInitialized: ps._initialized,
    timestamp: Date.now()
  };
}

export function info() {
  return {
    version: VERSION,
    moduleId: MODULE_ID,
    mode: _config.mode,
    logDecisions: _config.logDecisions,
    defaultAllow: _config.defaultAllow,
    mappings: { ROUTE_TO_TRIGGER, PANEL_TO_TRIGGER, PANEL_TO_REGION },
    timestamp: Date.now()
  };
}

export default {
  VERSION, MODULE_ID,
  canAccessRoute, canAccessPanel, canTrigger, canAccessRegion,
  setMode, getMode, setLogDecisions, healthCheck, info,
  injectPorts, getPorts
};
