// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (7.4.0-P17WI)
// ═══════════════════════════════════════════════════════════════
// MODULE: footer.version-env
// PURPOSE: Footer Version/Environment Component
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createUiPorts from /core/runtime/ports-profiles.js
//
// PROVIDES:
//   FooterVersionEnv() — exported function
//   injectPorts() — exported function
//   getPorts() — exported function
//   VERSION — module constant
//   MODULE_ID — module constant
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
// @version 7.4.0-P17WI-ES6
// P17WI: Ports via PortsFactory/PortsProfiles

import { createUiPorts } from '/core/runtime/ports-profiles.js';

const VERSION = '7.4.0-P17WI';
const MODULE_ID = 'footer.version-env';

const Ports = createUiPorts({ moduleId: MODULE_ID });

function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }

function injectPorts(p: Record<string,unknown>) { return Ports.inject(p); }
function getPorts() { return Ports.snapshot(); }

const _debugEnabled = () => { const cfg = _getPort('config'); return (cfg && cfg.app && cfg.app.debug) ? true : false; };
const _log = function(level: string) { const args = Array.prototype.slice.call(arguments, 1); const logger = _getPort('logger'); if (!logger) return; if (level === 'error') { if (logger.error) logger.error(`[${MODULE_ID}]`, args.join(' ')); return; } if (_debugEnabled() && logger.debug) logger.debug(`[${MODULE_ID}]`, args.join(' ')); };

function FooterVersionEnv(this: any) { this.mounted = false; this.container = null; this.props = {}; }

// @ts-expect-error TS migration - TS2554
FooterVersionEnv.prototype.mount = function(container, props, integrations) { if (this.mounted) return; _initPorts(); this.container = container; this.props = props || {}; this.mounted = true; _log('info', 'Mounted (compatibility mode - merged with brand)'); };
FooterVersionEnv.prototype.update = function(partial: unknown) { Object.assign(this.props, partial || {}); };

// @ts-expect-error TS migration - TS2554
FooterVersionEnv.prototype.destroy = function() { this.mounted = false; _log('info', 'Destroyed'); };
FooterVersionEnv.getVersion = () => VERSION;
FooterVersionEnv.setDebug = (enabled: boolean) => { };
FooterVersionEnv.prototype.getVersion = () => VERSION;
FooterVersionEnv.prototype.setDebug = (enabled: boolean) => { };
FooterVersionEnv.prototype.getMetrics = function() { return { mountCount: this.mounted ? 1 : 0 }; };
FooterVersionEnv.prototype.healthCheck = function() { const portsSnapshot = Ports.snapshot(); return { status: portsSnapshot._initialized ? 'HEALTHY' : 'DEGRADED', score: 100, checks: { mounted: this.mounted, hasLogger: !!_getPort('logger'), portsInitialized: portsSnapshot._initialized }, version: VERSION, moduleId: MODULE_ID, portsInitialized: portsSnapshot._initialized, timestamp: new Date().toISOString() }; };
FooterVersionEnv.prototype.info = function() { const portsSnapshot = Ports.snapshot(); return { version: VERSION, moduleId: MODULE_ID, mounted: this.mounted, note: 'Merged with brand component', portsInitialized: portsSnapshot._initialized }; };
FooterVersionEnv.injectPorts = injectPorts;
FooterVersionEnv.getPorts = getPorts;

export default FooterVersionEnv;
export { FooterVersionEnv, injectPorts, getPorts, VERSION, MODULE_ID };
