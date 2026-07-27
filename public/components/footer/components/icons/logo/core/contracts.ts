// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.1.0-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: footer-icon-logo-contracts
// PURPOSE: logo Icon - Contracts
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

const MODULE_ID = 'footer-icon-logo-contracts';
const VERSION = '1.1.0-ENTERPRISE';

export const CONTRACTS = {
  EVENTS: {
    MOUNTED: 'footer.icon.logo:mounted',
    UNMOUNTED: 'footer.icon.logo:unmounted',
    RENDERED: 'footer.icon.logo:rendered',
    CLICKED: 'footer.icon.logo:clicked',
    ERROR: 'footer.icon.logo:error'
  },
  PROPS: {
    size: { type: 'string', values: ['xs', 'sm', 'md', 'lg', 'xl'], default: 'md' },
    variant: { type: 'string', values: ['primary', 'secondary', 'brand', 'success', 'warning', 'danger', 'muted'], default: 'primary' },
    state: { type: 'string', values: ['default', 'active', 'disabled', 'loading'], default: 'default' },
    decorative: { type: 'boolean', default: false },
    ariaLabel: { type: 'string', default: 'logo' },
    clickable: { type: 'boolean', default: false }
  },
  SIZES: { xs: 12, sm: 14, md: 16, lg: 20, xl: 24 },
  CSS_CLASSES: { wrapper: 'dsd-icon dsd-icon--logo', svg: 'dsd-icon__svg' }
};

let _metrics = { validations: 0, validationErrors: 0 };

export const validateProps = (props = {}) => {
  _metrics.validations++;
  // @ts-expect-error strict migration — TS7034
  const errors = [];
  const validated = {};
  Object.entries(CONTRACTS.PROPS).forEach(([key, schema]) => {
    const value = (props as Record<string,unknown>)[key] ?? schema.default;

    // @ts-expect-error TS migration - TS2339
    if (schema.values && !schema.values.includes(value)) {
      errors.push(`Invalid ${key}: "${value}"`);
      (validated as Record<string,unknown>)[key] = schema.default;
    } else { (validated as Record<string,unknown>)[key] = value; }
  });
  if (errors.length > 0) _metrics.validationErrors++;
  // @ts-expect-error strict migration — TS7005
  return { valid: errors.length === 0, errors, props: validated };
};

export function getMetrics() { return { ..._metrics }; }
export function info() { return { moduleId: MODULE_ID, version: VERSION, events: Object.keys(CONTRACTS.EVENTS), props: Object.keys(CONTRACTS.PROPS), metrics: getMetrics() }; }
export function healthCheck() {
  return { status: 'HEALTHY', version: VERSION, moduleId: MODULE_ID, checks: { contractsLoaded: true }, metrics: getMetrics() };
}

export { MODULE_ID, VERSION };
export default { CONTRACTS, validateProps, getMetrics, info, healthCheck, MODULE_ID, VERSION };
