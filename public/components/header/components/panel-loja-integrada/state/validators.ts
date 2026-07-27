// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v8.1.0-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: header/components/panel-loja-integrada/state/validators
// PURPOSE: Data validation functions for state integrity
// ───────────────────────────────────────────────────────────────
// PROVIDES:
//   isRequired(value) — check non-null/non-empty
//   isString/isNumber/isBoolean/isArray/isObject(value) — type checks
//   minLength/maxLength(value, limit) — length validators
//   inRange(value, min, max) — numeric range check
//   matches(value, regex) — regex validation
//   isEmail/isUrl(value) — format validators
//   validate(value, rules) — run validation rule set
//   healthCheck() — module health status
// ═══════════════════════════════════════════════════════════════
// panel-loja-integrada - State Validators (Enterprise)
// @version 8.1.0-ENTERPRISE
'use strict';

import { VERSION } from '/core/version.js'; export { VERSION };
export const MODULE_ID = 'header/components/panel-loja-integrada/state/validators';

const _metrics = { validations: 0, passes: 0, failures: 0 };

export function isRequired(value: unknown) { _metrics.validations++; const pass = value != null && value !== ''; pass ? _metrics.passes++ : _metrics.failures++; return pass; }
export function isString(value: unknown) { _metrics.validations++; const pass = typeof value === 'string'; pass ? _metrics.passes++ : _metrics.failures++; return pass; }
export function isNumber(value: unknown) { _metrics.validations++; const pass = typeof value === 'number' && !isNaN(value); pass ? _metrics.passes++ : _metrics.failures++; return pass; }
export function isBoolean(value: unknown) { _metrics.validations++; const pass = typeof value === 'boolean'; pass ? _metrics.passes++ : _metrics.failures++; return pass; }
export function isArray(value: unknown) { _metrics.validations++; const pass = Array.isArray(value); pass ? _metrics.passes++ : _metrics.failures++; return pass; }
export function isObject(value: unknown) { _metrics.validations++; const pass = value !== null && typeof value === 'object' && !Array.isArray(value); pass ? _metrics.passes++ : _metrics.failures++; return pass; }
// @ts-expect-error TS migration - TS2339
export function minLength(value: unknown, min: number) { _metrics.validations++; const pass = value && value.length >= min; pass ? _metrics.passes++ : _metrics.failures++; return pass; }
// @ts-expect-error TS migration - TS2339
export function maxLength(value: unknown, max: number) { _metrics.validations++; const pass = value && value.length <= max; pass ? _metrics.passes++ : _metrics.failures++; return pass; }
// @ts-expect-error TS migration - TS2365
export function inRange(value: unknown, min: number, max: number) { _metrics.validations++; const pass = value >= min && value <= max; pass ? _metrics.passes++ : _metrics.failures++; return pass; }
// @ts-expect-error TS migration - TS2339
export function matches(value: unknown, regex: unknown) { _metrics.validations++; const pass = regex.test(value); pass ? _metrics.passes++ : _metrics.failures++; return pass; }
export function isEmail(value: unknown) { return matches(value, /^[^\s@]+@[^\s@]+\.[^\s@]+$/); }
// @ts-expect-error TS migration - TS2345
export function isUrl(value: unknown) { try { new URL(value); _metrics.validations++; _metrics.passes++; return true; } catch { _metrics.validations++; _metrics.failures++; return false; } }

export function validate(value: unknown, rules = []) {
  // @ts-expect-error strict migration — TS7034
  const errors = [];
  // @ts-expect-error strict migration — TS2339
  rules.forEach(rule => { if (!rule.validator(value)) errors.push(rule.message || 'Validation failed'); });
  // @ts-expect-error strict migration — TS7005
  return { valid: errors.length === 0, errors };
}

export function getMetrics() { return { ..._metrics }; }
export function resetMetrics() { _metrics.validations = 0; _metrics.passes = 0; _metrics.failures = 0; }
export function healthCheck() { return { status: 'HEALTHY', version: VERSION, moduleId: MODULE_ID, checks: { ready: true }, metrics: getMetrics() }; }
export function info() { return { version: VERSION, moduleId: MODULE_ID, metrics: getMetrics() }; }
export default { isRequired, isString, isNumber, isBoolean, isArray, isObject, minLength, maxLength, inRange, matches, isEmail, isUrl, validate };
