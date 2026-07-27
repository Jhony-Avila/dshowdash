const VERSION = "1.0.0-MODULAR";
const MODULE_ID = "container-main:capability-manager:constants";
const CAPABILITY_STATUS = Object.freeze({
  GRANTED: "granted",
  DENIED: "denied",
  PENDING: "pending",
  REVOKED: "revoked",
  NOT_REQUESTED: "not-requested"
});
const DENIAL_REASONS = Object.freeze({
  NOT_AVAILABLE: "not-available",
  RESOURCE_LIMIT: "resource-limit",
  SECURITY: "security",
  CONFLICT: "conflict",
  POLICY: "policy",
  MANUAL: "manual"
});
const CAPABILITY_POLICIES = Object.freeze({
  ALLOW_ALL: "allow-all",
  DENY_ALL: "deny-all",
  WHITELIST: "whitelist",
  BLACKLIST: "blacklist",
  ON_DEMAND: "on-demand"
});
function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    statuses: Object.keys(CAPABILITY_STATUS),
    reasons: Object.keys(DENIAL_REASONS),
    policies: Object.keys(CAPABILITY_POLICIES)
  };
}
var constants_default = {
  VERSION,
  MODULE_ID,
  CAPABILITY_STATUS,
  DENIAL_REASONS,
  CAPABILITY_POLICIES,
  info
};
export {
  CAPABILITY_POLICIES,
  CAPABILITY_STATUS,
  DENIAL_REASONS,
  MODULE_ID,
  VERSION,
  constants_default as default,
  info
};
