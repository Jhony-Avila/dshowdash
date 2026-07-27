// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (10.1.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-03/utils/url-state
// PURPOSE: Panel-03 URL State - Shim para RouteStateService
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   RouteStateService from /core/navigation/route-state-service.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   URLState() — exported function
//   info() — exported function
//   healthCheck() — exported function
//   getVersion() — exported function
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

import RouteStateService from '/core/navigation/route-state-service.js';

export const VERSION = '9.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'panel-03/utils/url-state';
const PANEL_ID = 'panel-03';
const ALLOWED_KEYS = ['type', 'status', 'rate', 'search', 'sort', 'order', 'page', 'pageSize'];

export function URLState(this: any, logger: Record<string, unknown>) { this.logger = logger; }

URLState.prototype.read = function() {
  const result = RouteStateService.getState(PANEL_ID);
  if (result && result.ok && result.data && Object.keys(result.data).length > 0) {
    if (this.logger && this.logger.debug) this.logger.debug('url-state.read', { hasFilters: true, source: 'RouteStateService' });
    return result.data;
  }
  return null;
};

URLState.prototype.write = function(filters: Record<string, unknown>, replace: boolean) {
  if (replace === undefined) replace = true;
  const clean: Record<string, unknown> = {};
  if (filters) {
    for (let i = 0; i < ALLOWED_KEYS.length; i++) {
      const k = ALLOWED_KEYS[i];
      if (filters[k] !== null && filters[k] !== '' && filters[k] !== undefined) clean[k] = filters[k];
    }
  }
  RouteStateService.setState(PANEL_ID, clean, { replace });
  if (this.logger && this.logger.debug) this.logger.debug('url-state.write', { filters: clean });
};

URLState.prototype.clear = function() {
  RouteStateService.clearState(PANEL_ID);
  if (this.logger && this.logger.debug) this.logger.debug('url-state.cleared');
};

URLState.prototype.sanitize = (value: unknown) => String(value).trim().slice(0, 100).replace(/[<>]/g, '');

URLState.prototype.getShareableURL = (filters: Record<string, unknown>) => RouteStateService.getShareableURL(PANEL_ID, filters, { allowedKeys: ALLOWED_KEYS });

URLState.prototype.subscribe = (callback: (...args: unknown[]) => void) => RouteStateService.subscribe(PANEL_ID, callback);

URLState.prototype.info = function() {
  const current = this.read();
  return { moduleId: MODULE_ID, version: VERSION, hasState: !!current, activeFilters: current ? Object.keys(current).length : 0 };
};

export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION }; }
export function getVersion() { return VERSION; }

export default URLState;
