// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.4.0-P17WI-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: orchestrator-ui-events
// PURPOSE: Orchestrator UI Events
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   logger from ../utils/logger.js
//
// PROVIDES:
//   info() — exported function
//   healthCheck() — exported function
//   OrchestratorUIEvents() — exported function
//   orchestratorUIEvents — exported value
//   VERSION — module constant
//   MODULE_ID — module constant
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   'click'
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import logger from '../utils/logger.js';

const VERSION = '9.3.0-P2-ENTERPRISE';
const MODULE_ID = 'orchestrator-ui-events';

function OrchestratorUIEvents(this: any) {
  this.container = null;
  this.handlers = new Map();
  this.abortController = null;
  this.initialized = false;
  this.destroyed = false;
}

OrchestratorUIEvents.prototype.getVersion = () => VERSION;
OrchestratorUIEvents.prototype.isInitialized = function() { return this.initialized && !this.destroyed; };

OrchestratorUIEvents.prototype.init = function(container: HTMLElement) {
  if (this.initialized) return this;
  this.container = container;
  this.abortController = new AbortController();
  this._bindEvents();
  this.initialized = true;
  this.destroyed = false;
  logger.info(`UI Events inicializados (${VERSION})`);
  return this;
};

OrchestratorUIEvents.prototype._bindEvents = function() {
  const self = this;
  if (!this.container) return;
  const signal = this.abortController.signal;
  const applyBtn = this.container.querySelector('#orchestrator-apply-preset');
  if (applyBtn) applyBtn.addEventListener('click', () => { self._onApplyPreset(); }, { signal });
  const refreshAllBtn = this.container.querySelector('#orchestrator-refresh-all');
  if (refreshAllBtn) refreshAllBtn.addEventListener('click', () => { self._onRefreshAll(); }, { signal });
  const resetBtn = this.container.querySelector('#orchestrator-reset-layout');
  if (resetBtn) resetBtn.addEventListener('click', () => { self._onResetLayout(); }, { signal });
  const pauseBtn = this.container.querySelector('#orchestrator-pause');
  if (pauseBtn) pauseBtn.addEventListener('click', () => { self._onTogglePause(); }, { signal });
  this.container.addEventListener('click', (e: Event) => { self._onDelegatedClick(e); }, { signal });
};

OrchestratorUIEvents.prototype._onApplyPreset = function() {
  const selector = this.container?.querySelector('#orchestrator-preset-select');
  const presetId = selector?.value || 'default';
  const handler = this.handlers.get('applyPreset');
  if (handler) handler(presetId);
};

OrchestratorUIEvents.prototype._onRefreshAll = function() { const handler = this.handlers.get('refreshAll'); if (handler) handler(); };
OrchestratorUIEvents.prototype._onResetLayout = function() { const handler = this.handlers.get('resetLayout'); if (handler) handler(); };
OrchestratorUIEvents.prototype._onTogglePause = function() { const handler = this.handlers.get('togglePause'); if (handler) handler(); };

OrchestratorUIEvents.prototype._onDelegatedClick = function(e: Event) {
  const toggleBtn = (e.target as HTMLElement).closest('[data-action="toggle-panel"]');
  if (toggleBtn) {
    const panelId = (toggleBtn as HTMLElement).dataset.panelId;
    const handler = this.handlers.get('togglePanel');
    if (handler && panelId) handler(panelId);
  }
};

OrchestratorUIEvents.prototype.onApplyPreset = function(handler: (...args: unknown[]) => unknown) { this.handlers.set('applyPreset', handler); return this; };
OrchestratorUIEvents.prototype.onRefreshAll = function(handler: (...args: unknown[]) => unknown) { this.handlers.set('refreshAll', handler); return this; };
OrchestratorUIEvents.prototype.onResetLayout = function(handler: (...args: unknown[]) => unknown) { this.handlers.set('resetLayout', handler); return this; };
OrchestratorUIEvents.prototype.onTogglePause = function(handler: (...args: unknown[]) => unknown) { this.handlers.set('togglePause', handler); return this; };
OrchestratorUIEvents.prototype.onTogglePanel = function(handler: (...args: unknown[]) => unknown) { this.handlers.set('togglePanel', handler); return this; };
OrchestratorUIEvents.prototype.off = function(eventName: string) { this.handlers.delete(eventName); return this; };

OrchestratorUIEvents.prototype.getStats = function() {
  return { version: VERSION, moduleId: MODULE_ID, initialized: this.initialized, destroyed: this.destroyed, hasContainer: !!this.container, handlerCount: this.handlers.size, handlers: Array.from(this.handlers.keys()) };
};

OrchestratorUIEvents.prototype.reset = function() { this.handlers.clear(); this.destroyed = false; };

OrchestratorUIEvents.prototype.destroy = function() {
  if (this.abortController) { this.abortController.abort(); this.abortController = null; }
  this.handlers.clear();
  this.container = null;
  this.initialized = false;
  this.destroyed = true;
  logger.info('UI Events destruídos');
};

// @ts-expect-error strict migration — TS7009
const orchestratorUIEvents = new OrchestratorUIEvents();

export default orchestratorUIEvents;
export { OrchestratorUIEvents, orchestratorUIEvents, VERSION, MODULE_ID };

export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION, checks: { eventsReady: true } }; }
