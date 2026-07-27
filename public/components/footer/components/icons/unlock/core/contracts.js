const MODULE_ID = "footer-icon-unlock-contracts";
const VERSION = "1.1.0-ENTERPRISE";
const CONTRACTS = {
  EVENTS: { MOUNTED: "footer.icon.unlock:mounted", UNMOUNTED: "footer.icon.unlock:unmounted", RENDERED: "footer.icon.unlock:rendered", CLICKED: "footer.icon.unlock:clicked", ERROR: "footer.icon.unlock:error" },
  PROPS: { size: { type: "string", values: ["xs", "sm", "md", "lg", "xl"], default: "md" }, variant: { type: "string", values: ["primary", "secondary", "brand", "success", "warning", "danger", "muted"], default: "primary" }, state: { type: "string", values: ["default", "active", "disabled", "loading"], default: "default" }, decorative: { type: "boolean", default: false }, ariaLabel: { type: "string", default: "unlock" }, clickable: { type: "boolean", default: false } },
  SIZES: { xs: 12, sm: 14, md: 16, lg: 20, xl: 24 },
  CSS_CLASSES: { wrapper: "dsd-icon dsd-icon--unlock", svg: "dsd-icon__svg" }
};
let _metrics = { validations: 0, validationErrors: 0 };
const validateProps = (props = {}) => {
  _metrics.validations++;
  const errors = [];
  const validated = {};
  Object.entries(CONTRACTS.PROPS).forEach(([key, schema]) => {
    const value = props[key] ?? schema.default;
    if (schema.values && !schema.values.includes(value)) {
      errors.push(`Invalid ${key}: "${value}"`);
      validated[key] = schema.default;
    } else {
      validated[key] = value;
    }
  });
  if (errors.length > 0) _metrics.validationErrors++;
  return { valid: errors.length === 0, errors, props: validated };
};
function getMetrics() {
  return { ..._metrics };
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, events: Object.keys(CONTRACTS.EVENTS), props: Object.keys(CONTRACTS.PROPS), metrics: getMetrics() };
}
function healthCheck() {
  return { status: "HEALTHY", version: VERSION, moduleId: MODULE_ID, checks: { contractsLoaded: true }, metrics: getMetrics() };
}
var contracts_default = { CONTRACTS, validateProps, getMetrics, info, healthCheck, MODULE_ID, VERSION };
export {
  CONTRACTS,
  MODULE_ID,
  VERSION,
  contracts_default as default,
  getMetrics,
  healthCheck,
  info,
  validateProps
};
