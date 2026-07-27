// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (2.1.1-P17WI)
// ═══════════════════════════════════════════════════════════════
// MODULE: components.router.security.schema
// PURPOSE: Router Security - Route Schema Validation
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createCorePorts from /core/runtime/ports-profiles.js
//
// PROVIDES:
//   injectPorts() — exported function
//   getPorts() — exported function
//   MODULE_ID — module constant
//   VERSION — module constant
//   init() — exported function
//   cleanup() — exported function
//   registerSchema() — exported function
//   unregisterSchema() — exported function
//   getSchema() — exported function
//   validate() — exported function
//   healthCheck() — exported function
//   info() — exported function
//
// RECEIVES (via init/options): (see init function)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createCorePorts } from '/core/runtime/ports-profiles.js';

const MODULE_ID = 'components.router.security.schema';
const VERSION = '2.1.1-P17WI';

const Ports = createCorePorts({ moduleId: MODULE_ID });

function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
export function injectPorts(p: Record<string, unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

const _state: { initialized: boolean; schemas: Record<string, Record<string, Record<string, unknown>>> } = { initialized: false, schemas: {} };
const _metrics = { validated: 0, passed: 0, failed: 0 };

function registerSchema(routePattern: string, schema: Record<string, Record<string, unknown>>) { _state.schemas[routePattern] = schema; return { ok: true, pattern: routePattern }; }
function unregisterSchema(routePattern: string) { if (_state.schemas[routePattern]) { delete _state.schemas[routePattern]; return { ok: true }; } return { ok: false, reason: 'Not found' }; }
function getSchema(routePattern: string) { return _state.schemas[routePattern] || null; }

function validate(routePattern: string, params: Record<string, string>) { _metrics.validated++; const schema = _state.schemas[routePattern]; if (!schema) return { valid: true, noSchema: true }; const errors = []; for (const key in schema) { if (schema.hasOwnProperty(key)) { const rule = schema[key]; const value = params[key]; if (rule.required && (value === undefined || value === null || value === '')) errors.push({ field: key, error: 'required' }); if (value !== undefined && value !== null) { if (rule.type === 'number' && isNaN(Number(value))) errors.push({ field: key, error: 'invalid type, expected number' }); if (rule.type === 'integer' && !Number.isInteger(Number(value))) errors.push({ field: key, error: 'invalid type, expected integer' }); if (rule.pattern && !new RegExp(rule.pattern as string).test(String(value))) errors.push({ field: key, error: 'pattern mismatch' }); if (rule.minLength && String(value).length < (rule.minLength as number)) errors.push({ field: key, error: 'too short' }); if (rule.maxLength && String(value).length > (rule.maxLength as number)) errors.push({ field: key, error: 'too long' }); if (rule.enum && (rule.enum as unknown[]).indexOf(value) < 0) errors.push({ field: key, error: 'invalid value' }); } } } if (errors.length > 0) { _metrics.failed++; return { valid: false, errors }; } _metrics.passed++; return { valid: true }; }

function init(ctx: Record<string, unknown>) { if (_state.initialized) return { ok: true, alreadyInitialized: true }; _initPorts(); if (ctx && ctx.ports) injectPorts(ctx.ports as Record<string, unknown>); if (ctx && ctx.schemas) Object.assign(_state.schemas, ctx.schemas as Record<string, Record<string, Record<string, unknown>>>); _state.initialized = true; return { ok: true, version: VERSION }; }
function cleanup() { _state.schemas = {}; _state.initialized = false; return { ok: true }; }
function healthCheck() { return { status: Ports.isInitialized() ? 'HEALTHY' : 'DEGRADED', score: 100, moduleId: MODULE_ID, version: VERSION, checks: { initialized: { ok: _state.initialized, severity: 'info' }, portsInitialized: { ok: Ports.isInitialized(), severity: 'info' } }, metrics: _metrics }; }
function info() { return { moduleId: MODULE_ID, version: VERSION, initialized: _state.initialized, schemasCount: Object.keys(_state.schemas).length, metrics: _metrics, portsInitialized: Ports.isInitialized() }; }

export { MODULE_ID, VERSION, init, cleanup, registerSchema, unregisterSchema, getSchema, validate, healthCheck, info };
export default { MODULE_ID, VERSION, init, cleanup, registerSchema, unregisterSchema, getSchema, validate, healthCheck, info, injectPorts, getPorts };
