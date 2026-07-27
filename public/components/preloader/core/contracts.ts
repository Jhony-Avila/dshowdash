// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.5.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: components.preloader.core.contracts
// PURPOSE: Preloader Contracts - Formal contracts for boot subsystem
// ───────────────────────────────────────────────────────────────
// @contract MODULE_ID - module constant identifier
// @contract VERSION - module constant version
// @contract INJECT_PORTS - injectPorts() for dependency injection
// @contract GET_PORTS - getPorts() returns ports snapshot
// @contract BOOT_RESULTS - boot result constants
// @contract EXIT_CODES - exit code constants
// @contract LOCAL_BOOT_EVENTS - boot event constants
// @contract CREATE_BOOT_OUTPUT - createBootOutput() creates boot output
// @contract VALIDATE_BOOT_OUTPUT - validateBootOutput() validates output
// @contract HEALTH - healthCheck() returns health status
// @contract INFO - info() returns module information
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createCorePorts from /core/runtime/ports-profiles.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   injectPorts() — exported function
//   getPorts() — exported function
//   BOOT_RESULTS — frozen constant object
//   EXIT_CODES — frozen constant object
//   LOCAL_BOOT_EVENTS — frozen constant object
//   PRELOADER_BOOT_EVENTS — alias for LOCAL_BOOT_EVENTS
//   createBootOutput() — exported function
//   validateBootOutput() — exported function
//   healthCheck() — exported function
//   info() — exported function
//
// RECEIVES (via init/options): data object for createBootOutput
// EMITS (eventos): (none)
// LISTENS (eventos): (none)
// WINDOW ACCESS: (none)
// ───────────────────────────────────────────────────────────────
// @changelog v1.5.0-P2-ENTERPRISE: Standardized DEPENDENCY CONTRACT header
// @changelog v1.4.0-ENTERPRISE: ES6 conversion
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createCorePorts } from '/core/runtime/ports-profiles.js';

export const VERSION = '1.5.0-P2-ENTERPRISE';
export const MODULE_ID = 'preloader.core.contracts';

const hasWindow = typeof window !== 'undefined';

const Ports = createCorePorts({ moduleId: MODULE_ID });
const _initPorts = () => Ports.init();
const _getPort = (name: string) => Ports.get(name);
export const injectPorts = (p: Record<string, unknown>) => Ports.inject(p);
export const getPorts = () => Ports.snapshot();

const log = {
  info: (msg: string, ctx?: Record<string, unknown>) => { const logger = _getPort('logger'); if (logger && logger.info) logger.info(msg, Object.assign({ component: MODULE_ID }, ctx || {})); },
  warn: (msg: string, ctx?: Record<string, unknown>) => { const logger = _getPort('logger'); if (logger && logger.warn) logger.warn(msg, Object.assign({ component: MODULE_ID }, ctx || {})); },
  error: (msg: string, ctx?: Record<string, unknown>) => { const logger = _getPort('logger'); if (logger && logger.error) logger.error(msg, Object.assign({ component: MODULE_ID }, ctx || {})); }
};

export const BOOT_RESULTS = Object.freeze({ SUCCESS: 'success', DEGRADED: 'degraded', TIMEOUT: 'timeout', FAILED: 'failed', CANCELLED: 'cancelled' });

export const EXIT_CODES = Object.freeze({ BOOT_COMPLETE: 'boot:complete', BOOT_COMPLETE_NO_VIDEO: 'boot:complete:no-video', BOOT_COMPLETE_FAST: 'boot:complete:fast', BOOT_DEGRADED_AUTH: 'boot:degraded:auth-timeout', BOOT_DEGRADED_COMPONENTS: 'boot:degraded:components-timeout', BOOT_DEGRADED_VIDEO: 'boot:degraded:video-failed', BOOT_DEGRADED_NETWORK: 'boot:degraded:network', BOOT_TIMEOUT_GLOBAL: 'boot:timeout:global', BOOT_TIMEOUT_AUTH: 'boot:timeout:auth', BOOT_TIMEOUT_COMPONENTS: 'boot:timeout:components', BOOT_FAILED_AUTH: 'boot:failed:auth-rejected', BOOT_FAILED_CRITICAL: 'boot:failed:critical-error', BOOT_FAILED_NO_CONTAINER: 'boot:failed:no-container', BOOT_CANCELLED_USER: 'boot:cancelled:user', BOOT_CANCELLED_NAVIGATION: 'boot:cancelled:navigation' });

export const LOCAL_BOOT_EVENTS = Object.freeze({ BOOT_START: 'preloader:boot:start', BOOT_PROGRESS: 'preloader:boot:progress', BOOT_PHASE_CHANGE: 'preloader:boot:phase', BOOT_COMPLETE: 'preloader:boot:complete', BOOT_DEGRADED: 'preloader:boot:degraded', BOOT_FAILED: 'preloader:boot:failed', BOOT_TIMEOUT: 'preloader:boot:timeout', BOOT_CANCELLED: 'preloader:boot:cancelled', UI_SHOW: 'preloader:ui:show', UI_HIDE: 'preloader:ui:hide', UI_DESTROY: 'preloader:ui:destroy' });

export const PRELOADER_BOOT_EVENTS = LOCAL_BOOT_EVENTS;

export const createBootOutput = (result: string, exitCode: string, data?: Record<string, any>) => {
  if (!data) data = {};
  const output = { subsystem: 'preloader', version: VERSION, result, exitCode, success: result === BOOT_RESULTS.SUCCESS || result === BOOT_RESULTS.DEGRADED, bootId: data.bootId || null, startTime: data.startTime || null, endTime: Date.now(), duration: data.startTime ? Date.now() - data.startTime : null, phase: data.phase || null, progress: data.progress !== undefined ? data.progress : 100, auth: { checked: data.authChecked !== undefined ? data.authChecked : false, authenticated: data.authenticated !== undefined ? data.authenticated : null, source: data.authSource || null }, components: { ready: data.componentsReady !== undefined ? data.componentsReady : false, count: data.componentCount !== undefined ? data.componentCount : 0, degraded: data.degradedComponents || [] }, video: { loaded: data.videoLoaded !== undefined ? data.videoLoaded : false, error: data.videoError || null }, metadata: { forceMode: data.forceMode !== undefined ? data.forceMode : false, retries: data.retries !== undefined ? data.retries : 0, errors: data.errors || [], trace: data.trace || [] }, timestamp: Date.now(), isoTime: new Date().toISOString() };
  log.info('Boot output created', { result, exitCode, duration: output.duration });
  return Object.freeze(output);
};

export const validateBootOutput = (output: Record<string, any>) => {
  const errors = [];
  if (!output) return { valid: false, errors: ['Output is null or undefined'] };
  const validResults = Object.keys(BOOT_RESULTS).map(k => BOOT_RESULTS[k as keyof typeof BOOT_RESULTS]);
  const validExitCodes = Object.keys(EXIT_CODES).map(k => EXIT_CODES[k as keyof typeof EXIT_CODES]);
  if (validResults.indexOf(output.result) === -1) errors.push(`Invalid result: ${output.result}`);
  if (validExitCodes.indexOf(output.exitCode) === -1) errors.push(`Invalid exitCode: ${output.exitCode}`);
  if (typeof output.success !== 'boolean') errors.push('Missing or invalid success flag');
  if (!output.timestamp) errors.push('Missing timestamp');
  return { valid: errors.length === 0, errors };
};

export const healthCheck = () => {
  const logger = _getPort('logger');
  const checks = { bootResultsDefined: Object.keys(BOOT_RESULTS).length > 0, exitCodesDefined: Object.keys(EXIT_CODES).length > 0, eventsDefined: Object.keys(LOCAL_BOOT_EVENTS).length > 0, loggerAvailable: !!logger, portsInitialized: Ports.isInitialized() };
  const checkKeys = Object.keys(checks);
  let passed = 0;
  for (let i = 0; i < checkKeys.length; i++) { if (checks[checkKeys[i] as keyof typeof checks]) passed++; }
  return { status: passed === checkKeys.length ? 'HEALTHY' : 'DEGRADED', score: `${passed}/${checkKeys.length}`, moduleId: MODULE_ID, version: VERSION, checks, contracts: { bootResults: Object.keys(BOOT_RESULTS).length, exitCodes: Object.keys(EXIT_CODES).length, events: Object.keys(LOCAL_BOOT_EVENTS).length }, portsInitialized: Ports.isInitialized(), timestamp: Date.now() };
};

export const info = () => ({ version: VERSION, moduleId: MODULE_ID, description: 'Formal contracts for Preloader Boot Subsystem', bootResults: Object.keys(BOOT_RESULTS), exitCodes: Object.keys(EXIT_CODES), events: Object.keys(LOCAL_BOOT_EVENTS), portsInitialized: Ports.isInitialized(), timestamp: Date.now() });

export default { VERSION, MODULE_ID, BOOT_RESULTS, EXIT_CODES, LOCAL_BOOT_EVENTS, PRELOADER_BOOT_EVENTS, createBootOutput, validateBootOutput, healthCheck, info, injectPorts, getPorts };
