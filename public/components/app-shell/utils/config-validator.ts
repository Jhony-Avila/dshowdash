/**
 * @file Config Validator
 * @version 1.0.0
 * @module app-shell/utils/config-validator
 * 
 * ============================================================================
 * DEPENDENCY CONTRACT
 * ============================================================================
 * @requires none (standalone validator)
 * 
 * @provides VERSION, MODULE_ID
 * @provides validate, validateAndNormalize, validateInitOptions
 * @provides INIT_OPTIONS_SCHEMA, formatErrors
 * @provides getMetrics, healthCheck, info
 * 
 * @description
 * Configuration validation with schema support. Validates types, ranges,
 * enums, and nested objects. Provides normalization with defaults.
 * 
 * @example
 * import { validate, validateInitOptions } from './config-validator.js';
 * const result = validateInitOptions({ force: true, debug: 'invalid' });
 * if (!result.valid) console.log(result.errors);
 * ============================================================================
 */
'use strict';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export const VERSION = '1.0.0-P2-ENTERPRISE';
export const MODULE_ID = 'app-shell-config-validator';

const _metrics = { validations: 0, passed: 0, failed: 0, warnings: 0 };
let _lastValidation: DynObj = null;

export const INIT_OPTIONS_SCHEMA = {
  force: { type: 'boolean', default: false },
  adapters: {
    type: 'object',
    properties: {
      globalState: { type: 'boolean', default: true },
      auth: { type: 'boolean', default: true },
      layout: { type: 'boolean', default: true },
      theme: { type: 'boolean', default: true },
      notification: { type: 'boolean', default: true },
      router: { type: 'boolean', default: true },
      ticker: { type: 'boolean', default: true },
      responsive: { type: 'boolean', default: true }
    }
  },
  logger: {
    type: 'object',
    properties: {
      level: { type: 'string', enum: ['debug', 'info', 'warn', 'error', 'silent'], default: 'info' },
      colorize: { type: 'boolean', default: true }
    }
  },
  healthCheck: {
    type: 'object',
    properties: {
      autoEnabled: { type: 'boolean', default: true },
      interval: { type: 'number', min: 1000, max: 300000, default: 30000 }
    }
  },
  responsive: {
    type: 'object',
    properties: {
      enabled: { type: 'boolean', default: true },
      autoApply: { type: 'boolean', default: true }
    }
  },
  keyboard: {
    type: 'object',
    properties: {
      enabled: { type: 'boolean', default: true }
    }
  },
  theme: {
    type: 'object',
    properties: {
      initial: { type: 'string', enum: ['light', 'dark', 'system'], default: 'system' }
    }
  },
  debug: { type: 'boolean', default: false }
};

function _validateValue(value: DynObj, schema: DynObj, path: DynObj) {
  const errors: DynObj[] = [], warnings: DynObj[] = [];
  if (value === undefined) {
    if (schema.required) errors.push({ path, message: 'Required field missing', code: 'REQUIRED' });
    return { valid: errors.length === 0, errors, warnings };
  }
  const actualType = Array.isArray(value) ? 'array' : typeof value;
  if (schema.type && actualType !== schema.type) {
    errors.push({ path, message: `Expected ${schema.type}, got ${actualType}`, code: 'TYPE_MISMATCH' });
    return { valid: false, errors, warnings };
  }
  if (schema.enum && schema.enum.indexOf(value) < 0) {
    errors.push({ path, message: `Value must be one of: ${schema.enum.join(', ')}`, code: 'INVALID_ENUM' });
  }
  if (schema.min !== undefined && value < schema.min) {
    errors.push({ path, message: `Value must be >= ${schema.min}`, code: 'MIN_VALUE' });
  }
  if (schema.max !== undefined && value > schema.max) {
    errors.push({ path, message: `Value must be <= ${schema.max}`, code: 'MAX_VALUE' });
  }
  if (schema.type === 'object' && schema.properties) {
    const propNames = Object.keys(schema.properties);
    for (let i = 0; i < propNames.length; i++) {
      const propName = propNames[i];
      const propResult = _validateValue(value[propName], schema.properties[propName], `${path}.${propName}`);
      errors.push.apply(errors, propResult.errors);
      warnings.push.apply(warnings, propResult.warnings);
    }
    const valueKeys = Object.keys(value);
    for (let j = 0; j < valueKeys.length; j++) {
      if (!schema.properties[valueKeys[j]]) {
        warnings.push({ path: `${path}.${valueKeys[j]}`, message: 'Unknown property', code: 'UNKNOWN_PROP' });
      }
    }
  }
  return { valid: errors.length === 0, errors, warnings };
}

export function validate(options: DynObj, schema: DynObj) {
  _metrics.validations++;
  const result = _validateValue(options, { type: 'object', properties: schema }, 'options');
  if (result.valid) _metrics.passed++;
  else _metrics.failed++;
  _metrics.warnings += result.warnings.length;
  _lastValidation = { options, schema, result, timestamp: Date.now() };
  return result;
}

export function validateAndNormalize(options: DynObj, schema: DynObj) {
  options = options || {};
  const result = validate(options, schema);
  if (!result.valid) return { valid: false, errors: result.errors, warnings: result.warnings, normalized: null as DynObj };
  const normalized = _applyDefaults(options, schema);
  return { valid: true, errors: [], warnings: result.warnings, normalized };
}

function _applyDefaults(options: DynObj, schema: DynObj) {
  const result = {};
  const propNames = Object.keys(schema);
  for (let i = 0; i < propNames.length; i++) {
    const propName = propNames[i];
    const propSchema = schema[propName];
    if (options[propName] !== undefined) {
      if (propSchema.type === 'object' && propSchema.properties) {
        (result as DynObj)[propName] = _applyDefaults(options[propName], propSchema.properties);
      } else {
        (result as DynObj)[propName] = options[propName];
      }
    } else if (propSchema.default !== undefined) {
      (result as DynObj)[propName] = propSchema.default;
    } else if (propSchema.type === 'object' && propSchema.properties) {
      (result as DynObj)[propName] = _applyDefaults({}, propSchema.properties);
    }
  }
  return result;
}

export function validateInitOptions(options: DynObj) {
  return validateAndNormalize(options, INIT_OPTIONS_SCHEMA);
}

export function createSchema(properties: DynObj) {
  return Object.freeze(Object.assign({}, properties));
}

export function getLastValidation() {
  return _lastValidation ? Object.assign({}, _lastValidation) : null;
}

export function getInitSchema() {
  return Object.assign({}, INIT_OPTIONS_SCHEMA);
}

export function formatErrors(errors: DynObj) {
  return errors.map((e: DynObj) => `[${e.code}] ${e.path}: ${e.message}`).join('\n');
}

export function getMetrics() { return Object.assign({}, _metrics, { successRate: _metrics.validations > 0 ? Math.round((_metrics.passed / _metrics.validations) * 100) : 100 }); }

export function healthCheck() {
  const checks = { operational: true, lowFailureRate: _metrics.validations === 0 || (_metrics.failed / _metrics.validations) < 0.5, fewWarnings: _metrics.warnings < 100 };
  const passed = Object.values(checks).filter(Boolean).length;
  return { status: passed === 3 ? 'HEALTHY' : 'DEGRADED', score: `${passed}/3`, checks, metrics: getMetrics(), version: VERSION, moduleId: MODULE_ID, timestamp: Date.now() };
}

export function info() {
  return { moduleId: MODULE_ID, version: VERSION, schemaProperties: Object.keys(INIT_OPTIONS_SCHEMA), metrics: getMetrics(), timestamp: Date.now() };
}

export default { VERSION, MODULE_ID, validate, validateAndNormalize, validateInitOptions, INIT_OPTIONS_SCHEMA, createSchema, getLastValidation, getInitSchema, formatErrors, getMetrics, healthCheck, info };
