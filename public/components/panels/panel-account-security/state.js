const MODULE_ID = "panel-account-security.state";
const VERSION = "9.3.0-P2-ENTERPRISE";
const state = {
  loading: false,
  error: null,
  securityLevel: null,
  twoFactorEnabled: false,
  lastPasswordChange: null,
  activeSessions: [],
  loginHistory: []
};
function getState() {
  return { ...state };
}
function setState(updates) {
  Object.assign(state, updates);
}
function setLoading(loading) {
  state.loading = loading;
}
function setError(error) {
  state.error = error;
}
function updateSecurity(data) {
  if (data.securityLevel) state.securityLevel = data.securityLevel;
  if (data.twoFactorEnabled !== void 0) state.twoFactorEnabled = data.twoFactorEnabled;
  if (data.lastPasswordChange) state.lastPasswordChange = data.lastPasswordChange;
}
var state_default = { getState, setState, setLoading, setError, updateSecurity };
function getMockSessions() {
  return state.activeSessions;
}
function getMockActivity() {
  return state.loginHistory;
}
function createInitialState() {
  return {
    loading: false,
    error: null,
    securityLevel: null,
    twoFactorEnabled: false,
    lastPasswordChange: null,
    activeSessions: [],
    loginHistory: []
  };
}
function createInitialMetrics() {
  return {
    passwordStrength: 0,
    sessionCount: 0,
    loginAttempts: 0,
    lastActivity: null
  };
}
export {
  MODULE_ID,
  VERSION,
  createInitialMetrics,
  createInitialState,
  state_default as default,
  getMockActivity,
  getMockSessions,
  getState,
  setError,
  setLoading,
  setState,
  updateSecurity
};
