const VERSION = "7.5.0-P2-ENTERPRISE";
const MODULE_ID = "app-shell.adapters.responsive-adapter.state";
const currentBreakpoint = { value: null };
const previousBreakpoint = { value: null };
const initialized = { value: false };
const enabled = { value: true };
const autoApplyPolicies = { value: true };
const resizeTimeout = { value: null };
const mediaQueries = {};
const listeners = [];
const userOverrides = {};
const metrics = {
  breakpointChanges: 0,
  policyApplications: 0,
  resizeEvents: 0,
  errors: 0,
  lastChangeAt: null
};
export {
  MODULE_ID,
  VERSION,
  autoApplyPolicies,
  currentBreakpoint,
  enabled,
  initialized,
  listeners,
  mediaQueries,
  metrics,
  previousBreakpoint,
  resizeTimeout,
  userOverrides
};
