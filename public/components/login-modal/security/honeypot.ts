// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.4.0-P17WI)
// ═══════════════════════════════════════════════════════════════
// MODULE: login-modal-honeypot
// PURPOSE: Login Modal - Honeypot Anti-Bot
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createUiPorts from /core/runtime/ports-profiles.js
//
// PROVIDES:
//   injectPorts() — exported function
//   getPorts() — exported function
//   HoneypotValidator() — exported function
//   getHoneypotFieldHTML() — exported function
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

import { createUiPorts } from '/core/runtime/ports-profiles.js';

const VERSION = '1.4.0-P17WI';
const MODULE_ID = 'login-modal-honeypot';
const HONEYPOT_FIELD_NAME = 'website_url';
const HONEYPOT_FIELD_ID = 'login-website';

const Ports = createUiPorts({ moduleId: MODULE_ID });

function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }

export function injectPorts(p: Record<string, unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

const _debugEnabled = () => { const cfg = _getPort('config'); return (cfg && cfg.app && cfg.app.debug) ? true : false; };
const _log = function(level: string) { const logger = _getPort('logger'); if (!logger) return; const args = Array.prototype.slice.call(arguments, 1); if (level === 'error') { if (logger.error) logger.error(...['[honeypot]'].concat(args)); return; } if (level === 'warn') { if (logger.warn) logger.warn(...['[honeypot]'].concat(args)); return; } if (_debugEnabled() && logger.debug) logger.debug(...['[honeypot]'].concat(args)); };

export function HoneypotValidator(this: any, config: Record<string, any>) { if (!config) config = {}; const hp = config.honeypot || {}; this.fieldName = hp.fieldName || HONEYPOT_FIELD_NAME; this.fieldId = hp.fieldId || HONEYPOT_FIELD_ID; this.enabled = hp.enabled !== false; this._metrics = { checks: 0, botsDetected: 0, passed: 0 }; _initPorts(); }

// v1.4.0: Adicionado inert ao container para prevenir foco e aviso de acessibilidade
HoneypotValidator.prototype.getFieldHTML = function() { if (!this.enabled) return ''; return `<div class="lm-honeypot" aria-hidden="true" inert style="position:absolute;left:-9999px;top:-9999px;opacity:0;pointer-events:none;height:0;width:0;overflow:hidden;"><label for="${this.fieldId}">Website (deixe em branco)</label><input type="text" id="${this.fieldId}" name="${this.fieldName}" tabindex="-1" autocomplete="off" data-honeypot="true"></div>`; };


// @ts-expect-error TS migration - TS2554
HoneypotValidator.prototype.validate = function(form: HTMLFormElement | null) { this._metrics.checks++; if (!this.enabled) { this._metrics.passed++; return { valid: true, isBot: false }; } let honeypotField = null; if (form && form.querySelector) { honeypotField = form.querySelector('[data-honeypot="true"]') || form.querySelector(`#${this.fieldId}`) || form.querySelector(`[name="${this.fieldName}"]`); } if (!honeypotField) { _log('warn', 'Campo honeypot nao encontrado no form'); this._metrics.passed++; return { valid: true, isBot: false, reason: 'field_not_found' }; } const value = (honeypotField.value || '').trim(); if (value.length > 0) { this._metrics.botsDetected++; _log('warn', 'BOT DETECTADO - Honeypot preenchido', { fieldValue: value.substring(0, 20) }); return { valid: false, isBot: true, reason: 'honeypot_filled', fieldValue: value }; } this._metrics.passed++; _log('info', 'Honeypot check passed'); return { valid: true, isBot: false }; };

HoneypotValidator.prototype.reset = (form: HTMLFormElement | null) => { if (!form || !form.querySelector) return; const honeypotField = form.querySelector('[data-honeypot="true"]') as HTMLInputElement | null; if (honeypotField) honeypotField.value = ''; };

HoneypotValidator.prototype.info = function() { return { moduleId: MODULE_ID, version: VERSION, enabled: this.enabled, fieldName: this.fieldName, portsInitialized: Ports.isInitialized(), metrics: Object.assign({}, this._metrics), timestamp: Date.now() }; };

HoneypotValidator.prototype.healthCheck = function() { const logger = _getPort('logger'); const checks = { enabled: this.enabled, lowBotRate: this._metrics.checks === 0 || (this._metrics.botsDetected / this._metrics.checks) < 0.5, loggerAvailable: !!logger, portsInitialized: Ports.isInitialized() }; const passed = Object.values(checks).filter(Boolean).length; return { status: passed === 4 ? 'HEALTHY' : 'DEGRADED', score: `${passed}/4`, checks, version: VERSION, moduleId: MODULE_ID, portsInitialized: Ports.isInitialized(), timestamp: Date.now() }; };

export function getHoneypotFieldHTML(config: Record<string, any>) { const validator = new (HoneypotValidator as any)(config); return validator.getFieldHTML(); }

export { VERSION, MODULE_ID };
export default HoneypotValidator;
