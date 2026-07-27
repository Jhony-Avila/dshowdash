
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v1.1.0-ES6)
// ═══════════════════════════════════════════════════════════════
// MODULE: header/core/config-validator
// PURPOSE: Validacao de configuracao do Header contra schema definido
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createCorePorts from /core/runtime/ports-profiles.js
//   ConfigError from ./errors/ConfigError.js
// PROVIDES:
//   validate(config) — valida config completa contra schema
//   validateAndApply(config) — valida e retorna config com defaults
//   validateFieldByPath(path, value) — valida campo individual
//   getDefaultConfig() — retorna config com todos os defaults
//   getSchema() — retorna copia do schema de validacao
//   CONFIG_SCHEMA — schema de validacao (frozen)
//   healthCheck() — status de saude do modulo
//   info() — informacoes completas do modulo
//   injectPorts(p) / getPorts() — gestao de ports
// ═══════════════════════════════════════════════════════════════
// Header - Config Validator
// @version 1.1.0-ES6
// @changelog v1.1.0-ES6 - Task 10.1 B13: var → const/let
// @changelog v1.0.1-FIX - Corrigido duplicate identifier validateField
'use strict';

import { createCorePorts } from '/core/runtime/ports-profiles.js';
import { ConfigError } from './errors/ConfigError.js';

export const VERSION = '1.1.0-ES6';
export const MODULE_ID = 'header/core/config-validator';

const Ports = createCorePorts({ moduleId: MODULE_ID });
function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
export function injectPorts(p: Record<string,unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

const _debugEnabled = () => { const cfg = _getPort('config'); return (cfg && cfg.app && cfg.app.debug) ? true : false; };
const _log = function(level: string, ...rest: any[]) { const args = Array.prototype.slice.call(arguments, 1); const logger = _getPort('logger'); if (!logger) return; const prefix = `[${MODULE_ID}]`; if (level === 'error') { if (logger.error) logger.error(prefix, args.join(' ')); return; } if (level === 'warn') { if (logger.warn) logger.warn(prefix, args.join(' ')); return; } if (level === 'info') { if (logger.info) logger.info(prefix, args.join(' ')); return; } if (_debugEnabled() && logger.debug) logger.debug(prefix, args.join(' ')); };

const CONFIG_SCHEMA = {
  id: { type: 'string', required: true },
  version: { type: 'string', required: true },
  name: { type: 'string', required: false, default: 'Header System' },
  description: { type: 'string', required: false, default: '' },
  features: {
    type: 'object',
    required: false,
    default: {},
    properties: {
      routerIntegration: { type: 'boolean', default: true },
      globalStateIntegration: { type: 'boolean', default: true },
      eventBusIntegration: { type: 'boolean', default: true },
      appShellIntegration: { type: 'boolean', default: true },
      telemetryEnabled: { type: 'boolean', default: true },
      circuitBreakerEnabled: { type: 'boolean', default: true },
      pollingEnabled: { type: 'boolean', default: true },
      accessibilityEnabled: { type: 'boolean', default: true }
    }
  },
  api: {
    type: 'object',
    required: false,
    default: {},
    properties: {
      healthEndpoint: { type: 'string', default: '/api/health/status.php' },
      healthWithCredentials: { type: 'boolean', default: false },
      alertsEndpoint: { type: 'string', default: '/api/alerts/header-alerts.php' },
      timeout: { type: 'number', default: 6000, min: 1000, max: 30000 },
      retries: { type: 'number', default: 1, min: 0, max: 5 }
    }
  },
  polling: {
    type: 'object',
    required: false,
    default: {},
    properties: {
      healthInterval: { type: 'number', default: 1800000, min: 5000, max: 3600000 },
      alertsInterval: { type: 'number', default: 2000000, min: 5000, max: 3600000 },
      networkQualityInterval: { type: 'number', default: 2000000, min: 5000, max: 3600000 },
      syncDebounceInterval: { type: 'number', default: 2000000, min: 100, max: 10000 },
      backoffSequence: { type: 'array', default: [5000, 10000, 20000, 40000, 60000] }
    }
  },
  network: {
    type: 'object',
    required: false,
    default: {},
    properties: {
      rttSamples: { type: 'number', default: 3, min: 1, max: 20 },
      rttThresholds: {
        type: 'object',
        default: { online: 120, degraded: 350 },
        properties: {
          online: { type: 'number', default: 120, min: 10, max: 1000 },
          degraded: { type: 'number', default: 350, min: 50, max: 2000 }
        }
      },
      debounce: { type: 'number', default: 200, min: 50, max: 1000 }
    }
  },
  fallback: {
    type: 'object',
    required: false,
    default: {},
    properties: {
      debounce: { type: 'number', default: 300, min: 100, max: 2000 },
      autoHide: { type: 'boolean', default: true },
      autoHideDuration: { type: 'number', default: 8000, min: 1000, max: 30000 }
    }
  },
  refresh: {
    type: 'object',
    required: false,
    default: {},
    properties: {
      throttle: { type: 'number', default: 5000, min: 1000, max: 30000 },
      fallbackTimeout: { type: 'number', default: 1200, min: 500, max: 10000 }
    }
  },
  ui: {
    type: 'object',
    required: false,
    default: {},
    properties: {
      tooltipDelayShow: { type: 'number', default: 250, min: 0, max: 2000 },
      tooltipDelayHide: { type: 'number', default: 150, min: 0, max: 2000 },
      scrollThreshold: { type: 'number', default: 50, min: 0, max: 500 }
    }
  },
  accessibility: {
    type: 'object',
    required: false,
    default: {},
    properties: {
      announceDebounce: { type: 'number', default: 800, min: 100, max: 5000 },
      announceExpire: { type: 'number', default: 300000, min: 10000, max: 600000 },
      rovingTabindexEnabled: { type: 'boolean', default: true },
      keyboardShortcutsEnabled: { type: 'boolean', default: true }
    }
  },
  telemetry: {
    type: 'object',
    required: false,
    default: {},
    properties: {
      enabled: { type: 'boolean', default: true },
      sampleRate: { type: 'number', default: 0.1, min: 0, max: 1 }
    }
  },
  defaults: {
    type: 'object',
    required: false,
    default: {},
    properties: {
      locale: { type: 'string', default: 'pt-BR' },
      environment: { type: 'string', default: 'production', enum: ['development', 'staging', 'production'] },
      debug: { type: 'boolean', default: false },
      containerSelector: { type: 'string', default: '#header-container' }
    }
  }
};

function validateType(value: unknown, expectedType: string) {
  if (expectedType === 'array') return Array.isArray(value);
  return typeof value === expectedType;
}

function validateRange(value: unknown, min: number, max: number) {
  if (typeof value !== 'number') return true;
  if (min !== undefined && value < min) return false;
  if (max !== undefined && value > max) return false;
  return true;
}

function validateEnum(value: unknown, allowedValues: unknown) {
  if (!allowedValues || !Array.isArray(allowedValues)) return true;
  return allowedValues.indexOf(value) !== -1;
}

function _validateField(value: unknown, schema: Record<string,unknown>, path: string) {
  // @ts-expect-error strict migration — TS7034
  let errors = [];
  // @ts-expect-error strict migration — TS7034
  let warnings = [];
  if (value === undefined || value === null) {
    if (schema.required) errors.push(ConfigError.missingField(path));
    // @ts-expect-error strict migration — TS7005
    return { errors, warnings, value: schema.default };
  }
  // @ts-expect-error TS migration - TS2345
  if (!validateType(value, schema.type)) {
    // @ts-expect-error TS migration - TS2345
    errors.push(ConfigError.invalidType(path, schema.type, value));
    // @ts-expect-error strict migration — TS7005
    return { errors, warnings, value: schema.default };
  }
  // @ts-expect-error TS migration - TS2345
  if (schema.type === 'number' && !validateRange(value, schema.min, schema.max)) {
    warnings.push({ field: path, message: 'Valor fora do range recomendado', value, min: schema.min, max: schema.max });
  }
  if (schema.enum && !validateEnum(value, schema.enum)) {
    errors.push(ConfigError.invalidValue(path, value, schema.enum));
    return { errors, warnings, value: schema.default };
  }
  if (schema.type === 'object' && schema.properties) {
    const validatedObject = {};
    Object.keys(schema.properties).forEach(key => {
      const propSchema = (schema.properties as Record<string,unknown>)[key];
      const propValue = (value as Record<string,unknown>)[key];
      const propPath = `${path}.${key}`;
      // @ts-expect-error TS migration - TS2345
      const result = _validateField(propValue, propSchema, propPath);
      // @ts-expect-error strict migration — TS7005
      errors = errors.concat(result.errors);
      // @ts-expect-error strict migration — TS7005
      warnings = warnings.concat(result.warnings);
      // @ts-expect-error TS migration - TS2339
      (validatedObject as Record<string,unknown>)[key] = result.value !== undefined ? result.value : propSchema.default;
    });
    // @ts-expect-error strict migration — TS7005
    return { errors, warnings, value: validatedObject };
  }
  // @ts-expect-error strict migration — TS7005
  return { errors, warnings, value };
}

function validate(config: Record<string,unknown>) {
  _initPorts();
  // @ts-expect-error strict migration — TS7034
  let errors = [];
  // @ts-expect-error strict migration — TS7034
  let warnings = [];
  const validatedConfig = {};
  if (!config || typeof config !== 'object') {
    errors.push(ConfigError.invalidType('config', 'object', config));
    // @ts-expect-error strict migration — TS7005
    return { valid: false, errors, warnings, config: _getDefaultConfig() };
  }
  Object.keys(CONFIG_SCHEMA).forEach(key => {
    const schema = (CONFIG_SCHEMA as Record<string,unknown>)[key];
    const value = config[key];
    // @ts-expect-error TS migration - TS2345
    const result = _validateField(value, schema, key);
    // @ts-expect-error strict migration — TS7005
    errors = errors.concat(result.errors);
    // @ts-expect-error strict migration — TS7005
    warnings = warnings.concat(result.warnings);
    // @ts-expect-error TS migration - TS2339
    (validatedConfig as Record<string,unknown>)[key] = result.value !== undefined ? result.value : schema.default;
  });
  Object.keys(config).forEach(key => {
    if (!(CONFIG_SCHEMA as Record<string,unknown>)[key]) {
      (validatedConfig as Record<string,unknown>)[key] = config[key];
      warnings.push({ field: key, message: 'Campo desconhecido no schema', value: typeof config[key] });
    }
  });
  const valid = errors.length === 0;
  if (errors.length > 0) {
    _log('error', 'Config validation falhou:', errors.length, 'erros');
    // @ts-expect-error strict migration — TS7005
    errors.forEach(e => { _log('error', '-', e.message || e); });
  }
  if (warnings.length > 0) {
    _log('warn', 'Config validation warnings:', warnings.length);
    // @ts-expect-error strict migration — TS7005
    warnings.forEach(w => { _log('warn', '-', `${w.field}:`, w.message); });
  }
  // @ts-expect-error strict migration — TS7005
  return { valid, errors, warnings, config: validatedConfig };
}

function _getDefaultConfig() {
  const defaultConfig = {};
  Object.keys(CONFIG_SCHEMA).forEach(key => {
    const schema = (CONFIG_SCHEMA as Record<string,unknown>)[key];
    // @ts-expect-error TS migration - TS2339
    if (schema.type === 'object' && (schema as any).properties) {
      (defaultConfig as Record<string,unknown>)[key] = {};
      Object.keys((schema as any).properties).forEach(propKey => {
        // @ts-expect-error strict migration — TS2571
        (defaultConfig as Record<string,unknown>)[key][propKey] = (schema as any).properties[propKey].default;
      });
    } else {
      // @ts-expect-error TS migration - TS2339
      (defaultConfig as Record<string,unknown>)[key] = schema.default;
    }
  });
  return defaultConfig;
}

function validateAndApply(config: Record<string,unknown>) {
  const result = validate(config);
  if (!result.valid) _log('warn', 'Usando config com valores default para campos inválidos');
  return result.config;
}

function getDefaultConfig() {
  return _getDefaultConfig();
}

function getSchema() {
  return JSON.parse(JSON.stringify(CONFIG_SCHEMA));
}

function validateFieldByPath(fieldPath: string, value: unknown) {
  const parts = fieldPath.split('.');
  let schema: Record<string, unknown> = CONFIG_SCHEMA;
  for (let i = 0; i < parts.length; i++) {
    if (schema[parts[i]]) {
      schema = schema[parts[i]] as Record<string, unknown>;
      if (schema.properties && i < parts.length - 1) schema = schema.properties as Record<string, unknown>;
    } else {
      return { valid: false, error: `Campo não encontrado no schema: ${fieldPath}` };
    }
  }
  const result = _validateField(value, schema, fieldPath);
  return { valid: result.errors.length === 0, errors: result.errors, warnings: result.warnings, value: result.value };
}

function healthCheck() {
  const checks = { schemaAvailable: Object.keys(CONFIG_SCHEMA).length > 0, portsInitialized: Ports.isInitialized() };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  return {
    status: passed === total ? 'HEALTHY' : 'DEGRADED',
    score: passed,
    maxScore: total,
    scoreDisplay: `${passed}/${total}`,
    checks,
    schemaFields: Object.keys(CONFIG_SCHEMA).length,
    version: VERSION,
    moduleId: MODULE_ID,
    timestamp: new Date().toISOString()
  };
}

function info() {
  return {
    version: VERSION,
    moduleId: MODULE_ID,
    schemaFields: Object.keys(CONFIG_SCHEMA),
    portsInitialized: Ports.isInitialized(),
    healthCheck: healthCheck()
  };
}

export {
  validate,
  validateAndApply,
  validateFieldByPath,
  getDefaultConfig,
  getSchema,
  healthCheck,
  info,
  CONFIG_SCHEMA
};

export default {
  VERSION,
  MODULE_ID,
  validate,
  validateAndApply,
  validateFieldByPath,
  getDefaultConfig,
  getSchema,
  healthCheck,
  info
};
