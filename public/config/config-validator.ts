// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.4.0-PORTSFACTORY)
// ═══════════════════════════════════════════════════════════════
// MODULE: config-validator
// PURPOSE: Config Validator - Validador de AppConfig usando JSON Schema
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createCorePorts from /core/runtime/ports-profiles.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   injectPorts() — exported function
//   getPorts() — exported function
//   validateAppConfig() — exported function
//   validateAndReport() — exported function
//   createValidatedConfig() — exported function
//   healthCheck() — exported function
//   info() — exported function
//
// RECEIVES (via init/options): (none)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   window.Logger
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createCorePorts } from '/core/runtime/ports-profiles.js';

export var VERSION = '1.4.0-PORTSFACTORY';
export var MODULE_ID = 'config-validator';

var _Ports = createCorePorts({ moduleId: MODULE_ID });
function _getPort(name: string) { return _Ports.get(name); }
export function injectPorts(p: Record<string, any>) { return _Ports.inject(p); }
export function getPorts() { return _Ports.snapshot(); }

var _log = function(level: 'error' | 'warn' | 'info', ...rest: any[]) { var logger = _getPort('logger'); if (!logger) return; var args = rest; var prefix = '[' + MODULE_ID + ']'; if (level === 'error') { if (logger.error) logger.error.apply(logger, [prefix].concat(args)); return; } if (level === 'warn') { if (logger.warn) logger.warn.apply(logger, [prefix].concat(args)); return; } if (level === 'info') { if (logger.info) logger.info.apply(logger, [prefix].concat(args)); return; } };

function SimpleValidator(this: { schema: Record<string, any>; errors: string[] }, schema: Record<string, any>) { this.schema = schema; this.errors = []; }
SimpleValidator.prototype.validate = function(data: unknown) { this.errors = []; this._validateObject(data, this.schema, ''); return { valid: this.errors.length === 0, errors: this.errors }; };
SimpleValidator.prototype._validateObject = function(data: unknown, schema: Record<string, any>, path: string) { var self = this; if (schema.type && typeof data !== schema.type && schema.type !== 'integer') { self.errors.push((path || 'root') + ': esperado tipo "' + schema.type + '", recebido "' + (typeof data) + '"'); return; } if (schema.type === 'integer' && !Number.isInteger(data)) { self.errors.push((path || 'root') + ': esperado integer, recebido "' + (typeof data) + '"'); return; } if (schema.required && Array.isArray(schema.required)) { schema.required.forEach(function(prop: string) { if (!(prop in (data as object))) { self.errors.push(path + '.' + prop + ': propriedade obrigatoria ausente'); } }); } if (schema.properties) { Object.keys(schema.properties).forEach(function(prop: string) { if (prop in (data as Record<string, unknown>)) { var propSchema = schema.properties[prop]; var propPath = path ? path + '.' + prop : prop; if (propSchema.type === 'object' && typeof (data as Record<string, unknown>)[prop] === 'object') { self._validateObject((data as Record<string, unknown>)[prop], propSchema, propPath); } else if (propSchema.type === 'array' && Array.isArray((data as Record<string, unknown>)[prop])) { self._validateArray((data as Record<string, unknown>)[prop], propSchema, propPath); } else { self._validatePrimitive((data as Record<string, unknown>)[prop], propSchema, propPath); } } }); } if (schema.additionalProperties === false && schema.properties) { var allowedProps = Object.keys(schema.properties); var extraProps = Object.keys(data as object).filter(function(k) { return allowedProps.indexOf(k) === -1; }); if (extraProps.length > 0) { extraProps.forEach(function(prop: string) { self.errors.push(path + '.' + prop + ': propriedade nao permitida'); }); } } if (schema.type === 'integer' || typeof data === 'number') { if (schema.minimum !== undefined && (data as number) < schema.minimum) { self.errors.push(path + ': valor ' + data + ' menor que minimo ' + schema.minimum); } if (schema.maximum !== undefined && (data as number) > schema.maximum) { self.errors.push(path + ': valor ' + data + ' maior que maximo ' + schema.maximum); } } if (schema.type === 'string' && typeof data === 'string') { if (schema.minLength !== undefined && data.length < schema.minLength) { self.errors.push(path + ': string muito curta (minimo ' + schema.minLength + ')'); } } if (schema.pattern && typeof data === 'string') { var regex = new RegExp(schema.pattern); if (!regex.test(data)) { self.errors.push(path + ': string nao corresponde ao padrao "' + schema.pattern + '"'); } } };
SimpleValidator.prototype._validateArray = function(data: unknown[], schema: Record<string, any>, path: string) { var self = this; if (schema.minItems !== undefined && data.length < schema.minItems) { self.errors.push(path + ': array muito curto (minimo ' + schema.minItems + ')'); } if (schema.uniqueItems && new Set(data).size !== data.length) { self.errors.push(path + ': array deve ter itens unicos'); } if (schema.items) { data.forEach(function(item: unknown, index: number) { var itemPath = path + '[' + index + ']'; if (schema.items.type === 'object') { self._validateObject(item, schema.items, itemPath); } else { self._validatePrimitive(item, schema.items, itemPath); } }); } };
SimpleValidator.prototype._validatePrimitive = function(data: unknown, schema: Record<string, any>, path: string) { var self = this; if (schema.type) { var actualType = Array.isArray(data) ? 'array' : typeof data; var expectedType = schema.type === 'integer' ? 'number' : schema.type; if (actualType !== expectedType) { self.errors.push(path + ': esperado "' + schema.type + '", recebido "' + actualType + '"'); return; } } if (schema.type === 'integer' && !Number.isInteger(data)) { self.errors.push(path + ': esperado integer'); } if (schema.pattern && typeof data === 'string') { var regex = new RegExp(schema.pattern); if (!regex.test(data)) { self.errors.push(path + ': nao corresponde ao padrao'); } } if (typeof data === 'number') { if (schema.minimum !== undefined && data < schema.minimum) { self.errors.push(path + ': menor que minimo ' + schema.minimum); } if (schema.maximum !== undefined && data > schema.maximum) { self.errors.push(path + ': maior que maximo ' + schema.maximum); } } if (typeof data === 'string' && schema.minLength !== undefined) { if (data.length < schema.minLength) { self.errors.push(path + ': string muito curta'); } } };

export function validateAppConfig(config: Record<string, any>, schema?: Record<string, any>) { var warnings: string[] = []; if (!schema) { return fetch('/config/schemas/app-config.schema.json').then(function(response) { if (!response.ok) { throw new Error('HTTP ' + response.status); } return response.json(); }).then(function(loadedSchema) { return _doValidate(config, loadedSchema, warnings); }).catch(function(error) { _log('warn', 'Nao foi possivel carregar schema', { error: error.message }); return { valid: true, errors: [] as string[], warnings: ['Schema nao disponivel, validacao completa desabilitada'] }; }); } return Promise.resolve(_doValidate(config, schema, warnings)); }
function _doValidate(config: Record<string, any>, schema: Record<string, any>, warnings: string[]) { var validator = new (SimpleValidator as any)(schema); var result = validator.validate(config); if (result.valid) { if (config.timeouts && config.timeouts.componentTimeoutMs > config.timeouts.readyTimeoutMs) { warnings.push('componentTimeoutMs maior que readyTimeoutMs (pode causar race conditions)'); } if (config.refresh && config.refresh.global < 30000) { warnings.push('refresh.global muito baixo (<30s), pode sobrecarregar servidor'); } if (config.network && config.network.retryAttempts > 5) { warnings.push('network.retryAttempts muito alto (>5), pode atrasar feedback de erro'); } if (config.modules) { if (config.modules.cards && config.modules.cards.length === 0) { warnings.push('modules.cards vazio'); } if (config.modules.panels && config.modules.panels.length === 0) { warnings.push('modules.panels vazio'); } } if (config.app && config.app.debug && config.app.version && config.app.version.indexOf('prod') !== -1) { warnings.push('debug ativado em versao de producao'); } } return { valid: result.valid, errors: result.errors, warnings: warnings }; }
export function validateAndReport(config: Record<string, any>) { _log('info', 'Validando AppConfig'); return validateAppConfig(config).then(function(result: { valid: boolean; errors: string[]; warnings: string[] }) { if (!result.valid) { _log('error', 'Configuracao INVALIDA', { errors: result.errors }); return false; } if (result.warnings.length > 0) { _log('warn', 'Avisos na validacao', { warnings: result.warnings }); } _log('info', 'Configuracao valida'); return true; }); }
export function createValidatedConfig(config: Record<string, any>) { return validateAppConfig(config).then(function(result: { valid: boolean; errors: string[]; warnings: string[] }) { if (!result.valid) { var errorMsg = 'AppConfig invalido:\n' + result.errors.join('\n'); throw new Error(errorMsg); } return Object.freeze(JSON.parse(JSON.stringify(config))); }); }

export function healthCheck() { return { status: _Ports.isInitialized() ? 'HEALTHY' : 'DEGRADED', score: _Ports.isInitialized() ? 2 : 0, maxScore: 2, checks: { portsInitialized: _Ports.isInitialized(), hasLogger: !!_getPort('logger') }, moduleId: MODULE_ID, version: VERSION, portsInitialized: _Ports.isInitialized() }; }
export function info() { return { moduleId: MODULE_ID, version: VERSION, portsInitialized: _Ports.isInitialized(), healthCheck: healthCheck() }; }

export default { validateAppConfig: validateAppConfig, validateAndReport: validateAndReport, createValidatedConfig: createValidatedConfig, SimpleValidator: SimpleValidator, healthCheck: healthCheck, info: info };
