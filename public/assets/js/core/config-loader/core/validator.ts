// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (2.2.0-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: config-loader-validator
// PURPOSE: Config Loader - Configuration Validator v2.2.0-ENTERPRISE
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   track, trackError from ../telemetry/tracker.js
//   getSafeDefaults from ./merger.js
//   deepMerge from ../utils/deepmerge.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   getVersion() — exported function
//   validateConfig() — exported function
//   validateMinimalStructure() — exported function
//   getRequiredFields() — exported function
//   info() — exported function
//   healthCheck() — exported function
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

import { track, trackError } from '../telemetry/tracker.js';
import { getSafeDefaults } from './merger.js';
import { deepMerge } from '../utils/deepmerge.js';

export var VERSION = '2.2.0-ENTERPRISE';
export var MODULE_ID = 'config-loader-validator';

export function getVersion() { return VERSION; }

var REQUIRED_FIELDS = ['app', 'app.name', 'app.version', 'app.apiUrl'];

export function validateConfig(config: Record<string, unknown>) {
  track('validator:start', { moduleId: MODULE_ID });
  var errors = [];
  var isValid = true;

  if (!config || typeof config !== 'object') { errors.push('Config deve ser um objeto válido'); isValid = false; }

  if (isValid) {
    for (var i = 0; i < REQUIRED_FIELDS.length; i++) {
      var field = REQUIRED_FIELDS[i];
      var value = getNestedValue(config, field);
      if (value === undefined || value === null) { errors.push('Campo obrigatório ausente: ' + field); isValid = false; }
    }
  }

  if (isValid && config.app) {
    var app = config.app as Record<string, unknown>;
    if (app.version && !/^\d+\.\d+\.\d+/.test(app.version as string)) { errors.push('app.version deve seguir padrão semântico (X.Y.Z)'); }
    if (app.apiUrl && (app.apiUrl as string).indexOf('/') !== 0) { errors.push('app.apiUrl deve começar com /'); }
  }

  if (isValid && config.timeouts) {
    var timeoutFields = ['readyTimeoutMs', 'componentTimeoutMs', 'apiDefaultMs'];
    for (var t = 0; t < timeoutFields.length; t++) {
      var tf = timeoutFields[t];
      // @ts-expect-error strict migration — TS7053
      if (config.timeouts[tf] !== undefined) {
        // @ts-expect-error strict migration — TS7053
        var val = config.timeouts[tf];
        if (typeof val !== 'number' || val < 1000 || val > 120000) { errors.push('timeouts.' + tf + ' deve ser número entre 1000 e 120000'); }
      }
    }
  }

  if (isValid && config.refresh) {
    var refresh = config.refresh as Record<string, unknown>;
    if (refresh.global !== undefined) {
      var gv = refresh.global;
      if (typeof gv !== 'number' || gv < 10000 || gv > 300000) { errors.push('refresh.global deve ser número entre 10000 e 300000'); }
    }
  }

  if (isValid && errors.length === 0) {
    track('validator:success', { fieldsValidated: REQUIRED_FIELDS.length, moduleId: MODULE_ID });
    return { ok: true, config: config, errors: [] };
  } else {
    track('validator:failure', { errorCount: errors.length, errors: errors, moduleId: MODULE_ID });
    var safeConfig = deepMerge(getSafeDefaults(), config || {});

    trackError('validator', new Error('Validação falhou: ' + errors.join(', ')));
    return { ok: false, config: safeConfig as Record<string, unknown>, errors: errors };
  }
}

function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  var keys = path.split('.');
  var current: unknown = obj;
  for (var i = 0; i < keys.length; i++) {
    if (current === null || current === undefined || typeof current !== 'object') return undefined;
    current = (current as Record<string, unknown>)[keys[i]];
  }
  return current;
}

export function validateMinimalStructure(config: Record<string, unknown>) {
  if (!config || typeof config !== 'object') return false;
  return config.app && typeof config.app === 'object';
}

export function getRequiredFields() { var arr = []; for (var i = 0; i < REQUIRED_FIELDS.length; i++) arr.push(REQUIRED_FIELDS[i]); return arr; }

export function info() { return { moduleId: MODULE_ID, version: VERSION, requiredFieldsCount: REQUIRED_FIELDS.length }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION, checks: { validateConfigReady: typeof validateConfig === 'function', requiredFieldsReady: REQUIRED_FIELDS.length > 0 } }; }
