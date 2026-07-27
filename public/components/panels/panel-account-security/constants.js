const MODULE_ID = "panel-account-security.constants";
const VERSION = "9.3.0-P2-ENTERPRISE";
const SECURITY_LEVELS = {
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high",
  CRITICAL: "critical"
};
const AUTH_METHODS = {
  PASSWORD: "password",
  TWO_FACTOR: "2fa",
  BIOMETRIC: "biometric",
  SSO: "sso"
};
const SESSION_TIMEOUT = 30 * 60 * 1e3;
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1e3;
const API_ENDPOINTS = {
  SECURITY_STATUS: "/api/security/status",
  SESSIONS: "/api/security/sessions",
  ACTIVITY: "/api/security/activity",
  PASSWORD_CHANGE: "/api/security/password",
  TWO_FACTOR: "/api/security/2fa"
};
export {
  API_ENDPOINTS,
  AUTH_METHODS,
  LOCKOUT_DURATION,
  MAX_LOGIN_ATTEMPTS,
  MODULE_ID,
  SECURITY_LEVELS,
  SESSION_TIMEOUT,
  VERSION
};
