// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.1.0-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: footer-icon-zap-contracts
// PURPOSE: zap Icon - Contracts
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   CONTRACTS — exported value
//   validateProps() — exported function
//   getMetrics() — exported function
//   info() — exported function
//   healthCheck() — exported function
//   MODULE_ID — module constant
//   VERSION — module constant
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
const MODULE_ID = 'footer-icon-zap-contracts';
const VERSION = '1.1.0-ENTERPRISE';
export const CONTRACTS = {
  EVENTS: { MOUNTED: 'footer.icon.zap:mounted', UNMOUNTED: 'footer.icon.zap:unmounted', RENDERED: 'footer.icon.zap:rendered', CLICKED: 'footer.icon.zap:clicked', ERROR: 'footer.icon.zap:error' },
  PROPS: { size: { type: 'string', values: ['xs', 'sm', 'md', 'lg', 'xl'], default: 'md' }, variant: { type: 'string', values: ['primary', 'secondary', 'brand', 'success', 'warning', 'danger', 'muted'], default: 'primary' }, state: { type: 'string', values: ['default', 'active', 'disabled', 'loading'], default: 'default' }, decorative: { type: 'boolean', default: false }, ariaLabel: { type: 'string', default: 'zap' }, clickable: { type: 'boolean', default: false } },
  SIZES: { xs: 12, sm: 14, md: 16, lg: 20, xl: 24 },
  CSS_CLASSES: { wrapper: 'dsd-icon dsd-icon--zap', svg: 'dsd-icon__svg' }
};
let _metrics = { validations: 0, validationErrors: 0 };

// @ts-expect-error TS migration - TS2339
export const validateProps = (props = {}) => { _metrics.validations++; const errors = []; const validated = {}; Object.entries(CONTRACTS.PROPS).forEach(([key, schema]) => { const value = props[key] ?? schema.default; if (schema.values && !schema.values.includes(value)) { errors.push(`Invalid ${key}: "${value}"`); validated[key] = schema.default; } else { validated[key] = value; } }); if (errors.length > 0) _metrics.validationErrors++; return { valid: errors.length === 0, errors, props: validated }; };
export function getMetrics() { return { ..._metrics }; }
export function info() { return { moduleId: MODULE_ID, version: VERSION, events: Object.keys(CONTRACTS.EVENTS), props: Object.keys(CONTRACTS.PROPS), metrics: getMetrics() }; }
export function healthCheck() { return { status: 'HEALTHY', version: VERSION, moduleId: MODULE_ID, checks: { contractsLoaded: true }, metrics: getMetrics() }; }
export { MODULE_ID, VERSION };
export default { CONTRACTS, validateProps, getMetrics, info, healthCheck, MODULE_ID, VERSION };
