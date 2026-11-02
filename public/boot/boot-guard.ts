// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.2.0-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: boot-guard
// PURPOSE: Boot Guard
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   from ./error/index.js
//
// PROVIDES:
//   MODULE_ID
//   VERSION
//   guardedBoot
//   getAttempts
//   info
//   healthCheck
//   default export
// ═══════════════════════════════════════════════════════════════
'use strict';

import { mount as mountBootError } from './error/index.js';

var MODULE_ID = 'boot-guard';
var VERSION = '1.2.0-ENTERPRISE';

function _log(level: 'error' | 'warn' | 'info' | 'debug', ...args: any[]) {

  // @ts-expect-error TS migration - TS2339
  var logger = typeof window !== 'undefined' ? window.Logger : null;

  var args = Array.prototype.slice.call(arguments, 1);
  var prefix = '[' + MODULE_ID + ']';
  if (logger && typeof logger[level] === 'function') {
    logger[level].apply(logger, [prefix].concat(args));
  } else if (level === 'error' || level === 'warn') {
    var fn = level === 'error' ? console.error : console.warn;
    fn.apply(console, [prefix].concat(args));
  }
}

var _bootAttempts = 0;
var MAX_BOOT_ATTEMPTS = 2;

function guardedBoot(bootFn: () => Promise<unknown>) {
  _bootAttempts++;

  return Promise.resolve().then(function() {
    return bootFn();
  }).then(function(result) {
    if (result && !(result as Record<string, unknown>).success) {
      var r = result as Record<string, unknown>;
      var errorMsg = (r.error as string) || (Array.isArray(r.errors) && r.errors[0]) || 'Boot returned failure';
      _log('error', 'Boot failed with result:', {
        success: r.success,
        error: r.error,
        errors: r.errors,
        phases: Array.isArray(r.phases) ? r.phases.map(function(p: { phaseId: string; success: boolean; error: unknown }) { return { id: p.phaseId, success: p.success, error: p.error }; }) : null,
        state: r.state
      });
      var error = new Error(errorMsg as string);
      (error as Error & { bootResult: unknown }).bootResult = result;
      throw error;
    }
    return result;
  }).catch(function(error) {
    _log('error', 'Critical boot failure (attempt ' + _bootAttempts + '):', {
      message: error.message,
      bootResult: error.bootResult || null,
      stack: error.stack
    });

    if (_bootAttempts >= MAX_BOOT_ATTEMPTS) {
      mountBootError(error);
      return { success: false, guarded: true, error: error.message };
    }

    mountBootError(error);
    return { success: false, guarded: true, error: error.message };
  });
}

function getAttempts() {
  return _bootAttempts;
}

function info() {
  return { moduleId: MODULE_ID, version: VERSION, attempts: _bootAttempts };
}

function healthCheck() {
  return { status: _bootAttempts < MAX_BOOT_ATTEMPTS ? 'HEALTHY' : 'DEGRADED', moduleId: MODULE_ID, version: VERSION, checks: { attempts: _bootAttempts, maxAttempts: MAX_BOOT_ATTEMPTS } };
}

export { MODULE_ID, VERSION, guardedBoot, getAttempts, info, healthCheck };
export default { guardedBoot: guardedBoot, getAttempts: getAttempts, info: info, healthCheck: healthCheck, MODULE_ID: MODULE_ID, VERSION: VERSION };
