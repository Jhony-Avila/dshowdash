// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.2.0-P17WI)
// ═══════════════════════════════════════════════════════════════
// MODULE: preloader-modules-aaa
// PURPOSE: Preloader Modules AAA Index
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createCorePorts from /core/runtime/ports-profiles.js
//   PreloaderPolicy from ./core/policy.js
//   createModeManager from ./core/modes.js
//   createDOMManager from ./core/dom-manager.js
//   getTemplateForProfile from ./template-aaa.js
//   createBootExecutor from ./core/boot-executor.js
//   quickDestroy, verifyDestruction from ./core/destroyer.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   PreloaderAAA — exported class
//   createPreloaderAAA() — exported function
//   getModuleList() — exported function
//   healthCheck() — exported function
//   info() — exported function
//   injectPorts() — exported function
//   getPorts() — exported function
//   (re-exports from contracts, policy, dom-manager, template-aaa, modes, boot-executor, destroyer)
//
// RECEIVES (via init/options): (none)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';
import { createCorePorts } from '/core/runtime/ports-profiles.js';
export const VERSION = '1.2.0-P17WI';
export const MODULE_ID = 'preloader-modules-aaa';
export { BOOT_RESULTS, EXIT_CODES, PRELOADER_BOOT_EVENTS, createBootOutput, validateBootOutput } from './core/contracts.js';
export { PreloaderPolicy, POLICY_PROFILES, shouldLoadVideo, shouldDegradeOnAuthTimeout, shouldDegradeOnComponentsTimeout, shouldForceFinalizeOnTimeout, shouldRetry, getRetryBackoff } from './core/policy.js';
export { PreloaderDOMManager, SELECTORS, createDOMManager } from './core/dom-manager.js';
export { getPreloaderTemplate, getMinimalTemplate, getFastTemplate, getCorporateTemplate, getKioskTemplate, getRecoveryTemplate, getTemplateForProfile } from './template-aaa.js';

// @ts-expect-error TS migration - TS2614
export { MODES, STATES, MODE_CONFIGS, PreloaderModeManager, createModeManager } from './core/modes.js';
export { BootExecutor, createBootExecutor } from './core/boot-executor.js';
export { destroy, quickDestroy, verifyDestruction, resetRegistry, registerTimer, registerInterval, registerObserver, registerListener, registerAnimation, registerPromise } from './core/destroyer.js';
import { PreloaderPolicy } from './core/policy.js';
import { createModeManager } from './core/modes.js';
import { createDOMManager } from './core/dom-manager.js';
import { getTemplateForProfile } from './template-aaa.js';
import { createBootExecutor } from './core/boot-executor.js';
import { quickDestroy, verifyDestruction } from './core/destroyer.js';
const Ports = createCorePorts({ moduleId: MODULE_ID });
function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
function injectPorts(p: Record<string, unknown>) { return Ports.inject(p); }
function getPorts() { return Ports.snapshot(); }
export const PreloaderAAA = function(this: Record<string, any>, config?: Record<string, any>) { if (config === undefined) config = {}; this.version = VERSION; this.instanceId = `preloader_aaa_${Date.now()}`; if (config.profile) PreloaderPolicy.applyProfile(config.profile); this.modeManager = createModeManager(); this.domManager = createDOMManager({ container: config.container || null, useShadowDOM: config.useShadowDOM || false }); this.bootExecutor = null; if (config.eventBus) Ports.inject({ eventBus: config.eventBus }); else _initPorts(); this.eventBus = _getPort('eventBus'); this._mounted = false; this._booted = false; this._destroyed = false; };
PreloaderAAA.prototype.mount = function(options?: Record<string, any>) { if (options === undefined) options = {}; if (this._mounted) return false; const profile = options.profile || 'standard'; const templateFn = getTemplateForProfile(profile, options); this.domManager.mount(templateFn); this._mounted = true; return true; };
PreloaderAAA.prototype.boot = function() { const self = this; if (!self._mounted) self.mount(); if (self._booted) return Promise.resolve(null); self.bootExecutor = createBootExecutor({ domManager: self.domManager, modeManager: self.modeManager, eventBus: self.eventBus }); return self.bootExecutor.execute().then((result: Record<string, any>) => { self._booted = true; return result; }); };
PreloaderAAA.prototype.hide = function(duration?: number) { const self = this; if (duration === undefined) duration = 300; if (!self._mounted) return Promise.resolve(); return self.domManager.fadeOut(duration).then(() => { self.domManager.setVisible(false); }); };
PreloaderAAA.prototype.destroy = function() { if (this._destroyed) return; if (this.bootExecutor) this.bootExecutor.destroy(); this.domManager.unmount(); quickDestroy(); this._destroyed = true; this._mounted = false; this._booted = false; return verifyDestruction(); };
PreloaderAAA.prototype.isMounted = function() { return this._mounted; };
PreloaderAAA.prototype.isBooted = function() { return this._booted; };
PreloaderAAA.prototype.isDestroyed = function() { return this._destroyed; };
PreloaderAAA.prototype.getStatus = function() { const ps = Ports.snapshot(); return { version: VERSION, instanceId: this.instanceId, mounted: this._mounted, booted: this._booted, destroyed: this._destroyed, mode: this.modeManager ? this.modeManager.getStatus() : null, dom: this.domManager ? this.domManager.getStatus() : null, boot: this.bootExecutor ? this.bootExecutor.getStatus() : null, policy: PreloaderPolicy.getStatus(), portsInitialized: ps._initialized }; };
PreloaderAAA.prototype.healthCheck = function() { const ps = Ports.snapshot(); const checks = { modeManager: this.modeManager ? this.modeManager.healthCheck().status === 'HEALTHY' : false, domManager: !this._mounted || (this.domManager ? this.domManager.healthCheck().status === 'HEALTHY' : false), notDestroyed: !this._destroyed, portsInitialized: ps._initialized }; const passed = Object.values(checks).filter(Boolean).length; return { status: passed === 4 ? 'HEALTHY' : 'DEGRADED', moduleId: MODULE_ID, version: VERSION, instanceId: this.instanceId, checks, portsInitialized: ps._initialized, timestamp: Date.now() }; };
PreloaderAAA.prototype.info = function() { return { version: VERSION, moduleId: MODULE_ID, architecture: 'AAA', principles: ['Preloader prepara, não governa', 'Policy-driven, não decision-heavy', 'Destruição 100% completa', 'DOM isolado com data-attributes', 'Modos declarativos'], status: this.getStatus(), healthCheck: this.healthCheck() }; };
PreloaderAAA.prototype.injectPorts = function(ports: Record<string, unknown>) { Ports.inject(ports); this.eventBus = _getPort('eventBus'); };
PreloaderAAA.prototype.getPorts = () => getPorts();
export function createPreloaderAAA(config?: Record<string, any>): Record<string, any> { if (config === undefined) config = {}; return new (PreloaderAAA as unknown as { new(c?: Record<string, any>): Record<string, any> })(config); }
export function getModuleList() { return [ { name: 'contracts', path: './core/contracts.js', category: 'core' }, { name: 'policy', path: './core/policy.js', category: 'core' }, { name: 'dom-manager', path: './core/dom-manager.js', category: 'ui' }, { name: 'template-aaa', path: './template-aaa.js', category: 'ui' }, { name: 'modes', path: './core/modes.js', category: 'state' }, { name: 'boot-executor', path: './core/boot-executor.js', category: 'execution' }, { name: 'destroyer', path: './core/destroyer.js', category: 'execution' } ]; }
export function healthCheck() { const ps = Ports.snapshot(); return { status: ps._initialized ? 'HEALTHY' : 'DEGRADED', moduleId: MODULE_ID, version: VERSION, modules: getModuleList().length, portsInitialized: ps._initialized, timestamp: Date.now() }; }
export function info() { return { version: VERSION, moduleId: MODULE_ID, modules: getModuleList(), exports: ['BOOT_RESULTS', 'EXIT_CODES', 'PRELOADER_BOOT_EVENTS', 'PreloaderPolicy', 'POLICY_PROFILES', 'PreloaderDOMManager', 'SELECTORS', 'MODES', 'STATES', 'PreloaderModeManager', 'BootExecutor', 'destroy', 'quickDestroy', 'PreloaderAAA', 'createPreloaderAAA'] }; }
export { injectPorts, getPorts };
export default { VERSION, MODULE_ID, PreloaderAAA, createPreloaderAAA, getModuleList, healthCheck, info, injectPorts, getPorts };
