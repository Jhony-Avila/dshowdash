// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (9.6.0-P17WI)
// ═══════════════════════════════════════════════════════════════
// MODULE: footer.status-orchestrator
// PURPOSE: Footer Status Orchestrator - Enterprise AAA
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createCorePorts from /core/runtime/ports-profiles.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   injectPorts() — exported function
//   getPorts() — exported function
//
// RECEIVES (via init/options): (none)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   event
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createCorePorts } from '/core/runtime/ports-profiles.js';

export const VERSION = '9.6.0-P17WI';
export const MODULE_ID = 'footer.status-orchestrator';

const Ports = createCorePorts({ moduleId: MODULE_ID });
function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
export function injectPorts(p: Record<string,unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

const _debugEnabled = () => { const cfg = _getPort('config'); return (cfg && cfg.app && cfg.app.debug) ? true : false; };
const _log = function(level: string) { const args = Array.prototype.slice.call(arguments, 1); const logger = _getPort('logger'); if (!logger) return; const prefix = `[${MODULE_ID}]`; if (level === 'error') { if (logger.error) logger.error(prefix, args.join(' ')); return; } if (level === 'warn') { if (logger.warn) logger.warn(prefix, args.join(' ')); return; } if (_debugEnabled() && logger.debug) logger.debug(prefix, args.join(' ')); };
const _metrics = { mountCount: 0, presetChanges: 0, healthChanges: 0, errors: 0 };

function FooterStatusOrchestrator(this: any) { this.mounted = false; this.container = null; this.element = null; this.dotEl = null; this.telemetry = null; this.eventBus = null; this.props = {}; this._cleanups = []; this._state = { preset: 'default', status: 'unknown' }; }


// @ts-expect-error TS migration - TS2554
FooterStatusOrchestrator.prototype.mount = function(container, props, integrations) { const self = this; props = props || {}; integrations = integrations || {}; if (this.mounted) return; this.container = container; this.props = props; this.telemetry = integrations.telemetry || null; this.eventBus = integrations.eventBus || _getPort('eventBus'); this._state.preset = props.preset || 'default'; this._state.status = props.status || 'unknown'; try { this._render(); this._setupEventBusIntegration(); this._syncOrchestratorState(); this._updateDisplay(); this.mounted = true; _metrics.mountCount++; _log('info', 'Mounted', JSON.stringify(this._state)); } catch (error) { _metrics.errors++; _log('error', 'Mount failed:', error.message); throw error; } };

FooterStatusOrchestrator.prototype._render = function() { this.element = document.createElement('div'); this.element.className = 'dsd-chip dsd-chip--sm'; this.element.title = 'Orchestrator'; this.element.innerHTML = '<span class="dsd-status-dot dsd-status-dot--neutral"></span><span class="chip-label">Orch</span>'; this.dotEl = this.element.querySelector('.dsd-status-dot'); if (this.container) this.container.appendChild(this.element); };

FooterStatusOrchestrator.prototype._setupEventBusIntegration = function() { const self = this; if (!this.eventBus || !this.eventBus.on) return; const handlers = { 'orchestrator:preset:applied': function(data: Record<string,unknown>) { self._state.preset = (data && data.presetId) ? data.presetId : 'unknown'; self._state.status = 'HEALTHY'; self._updateDisplay(); _metrics.presetChanges++; }, 'orchestrator:health:healthy': function() { self._state.status = 'HEALTHY'; self._updateDisplay(); _metrics.healthChanges++; }, 'orchestrator:health:degraded': function() { self._state.status = 'DEGRADED'; self._updateDisplay(); _metrics.healthChanges++; }, 'orchestrator:module:failed': function() { self._state.status = 'error'; self._updateDisplay(); _metrics.healthChanges++; }, 'main:orchestrator:initialized': function() { self._state.status = 'HEALTHY'; self._updateDisplay(); self._syncOrchestratorState(); } }; const events = Object.keys(handlers); for (let i = 0; i < events.length; i++) { (event => { self.eventBus.on(event, (handlers as Record<string,unknown>)[event]); self._cleanups.push(() => { self.eventBus.off(event, (handlers as Record<string,unknown>)[event]); }); })(events[i]); } };


// @ts-expect-error TS migration - TS2554
FooterStatusOrchestrator.prototype._syncOrchestratorState = function() { try { const orchestrator = _getPort('orchestrator'); if (orchestrator && orchestrator.getSnapshot) { const snapshot = orchestrator.getSnapshot(); if (snapshot) { this._state.preset = snapshot.currentPreset || 'default'; this._state.status = 'HEALTHY'; this._updateDisplay(); return; } } const main = _getPort('main'); if (main && main.getOrchestratorStatus) { const status = main.getOrchestratorStatus(); if (status) { this._state.preset = status.currentPreset || 'default'; this._state.status = (status.health && status.health.status) ? status.health.status : 'unknown'; this._updateDisplay(); } } } catch (error) { _log('warn', 'Sync failed:', error.message); } };

FooterStatusOrchestrator.prototype._updateDisplay = function() { if (!this.dotEl) return; const statusClass = this._state.status === 'HEALTHY' ? 'online' : this._state.status === 'DEGRADED' ? 'warning' : this._state.status === 'error' ? 'offline' : 'neutral'; this.dotEl.className = `dsd-status-dot dsd-status-dot--${statusClass}`; };

// @ts-expect-error TS migration - TS2339
FooterStatusOrchestrator.prototype.update = function(partial: unknown) { partial = partial || {}; if (partial.preset !== undefined) this._state.preset = partial.preset; if (partial.status !== undefined) this._state.status = partial.status; this._updateDisplay(); };
FooterStatusOrchestrator.prototype.getState = function() { return { preset: this._state.preset, status: this._state.status }; };


// @ts-expect-error TS migration - TS2554
FooterStatusOrchestrator.prototype.destroy = function() { for (let i = 0; i < this._cleanups.length; i++) { try { this._cleanups[i](); } catch (e) {} } this._cleanups = []; if (this.element) { this.element.remove(); this.element = null; } this.dotEl = null; this.mounted = false; _log('info', 'Destroyed'); };

FooterStatusOrchestrator.getVersion = () => VERSION;
FooterStatusOrchestrator.prototype.getVersion = () => VERSION;
FooterStatusOrchestrator.prototype.getMetrics = () => Object.assign({}, _metrics);

FooterStatusOrchestrator.prototype.healthCheck = function() { const checks = { mounted: this.mounted, hasElement: !!this.element, hasDot: !!this.dotEl, statusKnown: this._state.status !== 'unknown', noErrors: _metrics.errors === 0, hasLogger: !!_getPort('logger'), portsInitialized: Ports.isInitialized() }; const passed = Object.values(checks).filter(Boolean).length; const total = Object.keys(checks).length; return { status: passed >= 6 ? 'HEALTHY' : 'DEGRADED', score: passed, maxScore: total, scoreDisplay: `${passed}/${total}`, checks, portsInitialized: Ports.isInitialized(), orchestratorState: this.getState(), metrics: _metrics, version: VERSION, moduleId: MODULE_ID, timestamp: Date.now() }; };

FooterStatusOrchestrator.prototype.info = function() { return { version: VERSION, moduleId: MODULE_ID, portsInitialized: Ports.isInitialized(), mounted: this.mounted, state: this.getState(), metrics: this.getMetrics(), healthCheck: this.healthCheck() }; };

export default FooterStatusOrchestrator;
