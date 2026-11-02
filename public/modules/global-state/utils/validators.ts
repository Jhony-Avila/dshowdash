// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (4.1.0-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: global-state-validators
// PURPOSE: Global State Manager
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   from ../api/contracts.js
//
// PROVIDES:
//   default export
//   MODULE_ID
//   VERSION
// ═══════════════════════════════════════════════════════════════
'use strict';

import GlobalStateContracts, { ALLOWED_FIELDS, VALID_VALUES, SENSITIVE_FIELDS, getUnknownFields, isValidTheme, isValidLanguage, isValidNavigationMode } from '../api/contracts.js';

const MODULE_ID = 'global-state-validators';
const VERSION = '4.1.0-ENTERPRISE';

const _metrics = { validationsRun: 0, validationsPassed: 0, validationsFailed: 0, sanitizationsRun: 0 };

const StateValidators = {
  MODULE_ID,
  VERSION,

  validateUserId(userId: unknown) {
    _metrics.validationsRun++;
    if (userId === null || userId === undefined) { _metrics.validationsPassed++; return { valid: true, error: null }; }
    if (typeof userId !== 'string' && typeof userId !== 'number') { _metrics.validationsFailed++; return { valid: false, error: 'userId must be string or number' }; }
    if (typeof userId === 'string') {
      if (userId.trim() === '') { _metrics.validationsFailed++; return { valid: false, error: 'userId cannot be empty string' }; }
      if (userId.length > 100) { _metrics.validationsFailed++; return { valid: false, error: 'userId max length is 100 chars' }; }
      if (/[<>"'&]/.test(userId)) { _metrics.validationsFailed++; return { valid: false, error: 'userId contains invalid characters' }; }
    }
    _metrics.validationsPassed++;
    return { valid: true, error: null };
  },

  validateSession(session: unknown) {
    _metrics.validationsRun++;
    if (!session || typeof session !== 'object') { _metrics.validationsFailed++; return { valid: false, error: 'Session must be an object' }; }
    const s: any = session;
    if (s.isAuthenticated !== undefined && typeof s.isAuthenticated !== 'boolean') { _metrics.validationsFailed++; return { valid: false, error: 'isAuthenticated must be boolean' }; }
    if (s.userId !== undefined) { const userIdValidation = this.validateUserId(s.userId); if (!userIdValidation.valid) return userIdValidation; }
    if (s.user !== undefined && s.user !== null) {
      if (typeof s.user !== 'object') { _metrics.validationsFailed++; return { valid: false, error: 'user must be object or null' }; }
      if (s.user.id !== undefined && s.userId !== undefined) {
        if (String(s.userId) !== String(s.user.id)) { _metrics.validationsFailed++; return { valid: false, error: 'userId and user.id must match' }; }
      }
    }
    if (s.token !== undefined && s.token !== null && typeof s.token !== 'string') { _metrics.validationsFailed++; return { valid: false, error: 'token must be string or null' }; }
    const unknownFields = getUnknownFields('session', session as Record<string, unknown>);
    if (unknownFields.length > 0) { _metrics.validationsFailed++; return { valid: false, error: `Unknown session fields: ${unknownFields.join(', ')}` }; }
    _metrics.validationsPassed++;
    return { valid: true, error: null };
  },

  validatePreferences(prefs: unknown) {
    _metrics.validationsRun++;
    if (!prefs || typeof prefs !== 'object') { _metrics.validationsFailed++; return { valid: false, error: 'Preferences must be an object' }; }
    const p: any = prefs;
    const unknownFields = getUnknownFields('preferences', prefs as Record<string, unknown>);
    if (unknownFields.length > 0) { _metrics.validationsFailed++; return { valid: false, error: `Unknown preference fields: ${unknownFields.join(', ')}` }; }
    if (p.theme !== undefined && !isValidTheme(p.theme)) { _metrics.validationsFailed++; return { valid: false, error: `Invalid theme: ${p.theme}. Valid: ${VALID_VALUES.themes.join(', ')}` }; }
    if (p.language !== undefined && !isValidLanguage(p.language)) { _metrics.validationsFailed++; return { valid: false, error: `Invalid language: ${p.language}. Valid: ${VALID_VALUES.languages.join(', ')}` }; }
    if (p.compactMode !== undefined && typeof p.compactMode !== 'boolean') { _metrics.validationsFailed++; return { valid: false, error: 'compactMode must be boolean' }; }
    if (p.animations !== undefined && typeof p.animations !== 'boolean') { _metrics.validationsFailed++; return { valid: false, error: 'animations must be boolean' }; }
    _metrics.validationsPassed++;
    return { valid: true, error: null };
  },

  validateNavigation(nav: unknown) {
    _metrics.validationsRun++;
    if (!nav || typeof nav !== 'object') { _metrics.validationsFailed++; return { valid: false, error: 'Navigation must be an object' }; }
    const n: any = nav;
    const unknownFields = getUnknownFields('navigation', nav as Record<string, unknown>);
    if (unknownFields.length > 0) { _metrics.validationsFailed++; return { valid: false, error: `Unknown navigation fields: ${unknownFields.join(', ')}` }; }
    if (n.currentRoute !== undefined) {
      if (typeof n.currentRoute !== 'string') { _metrics.validationsFailed++; return { valid: false, error: 'currentRoute must be string' }; }
      if (n.currentRoute.indexOf('/') !== 0) { _metrics.validationsFailed++; return { valid: false, error: 'currentRoute must start with /' }; }
    }
    if (n.previousRoute !== undefined && n.previousRoute !== null && typeof n.previousRoute !== 'string') { _metrics.validationsFailed++; return { valid: false, error: 'previousRoute must be string or null' }; }
    if (n.sidebarOpen !== undefined && typeof n.sidebarOpen !== 'boolean') { _metrics.validationsFailed++; return { valid: false, error: 'sidebarOpen must be boolean' }; }
    if (n.activePanel !== undefined && n.activePanel !== null && typeof n.activePanel !== 'string') { _metrics.validationsFailed++; return { valid: false, error: 'activePanel must be string or null' }; }
    if (n.mode !== undefined && !isValidNavigationMode(n.mode)) { _metrics.validationsFailed++; return { valid: false, error: `Invalid navigation mode: ${n.mode}. Valid: ${VALID_VALUES.navigationModes.join(', ')}` }; }
    if (n.page !== undefined && (typeof n.page !== 'number' || n.page < 1)) { _metrics.validationsFailed++; return { valid: false, error: 'page must be a positive number' }; }
    _metrics.validationsPassed++;
    return { valid: true, error: null };
  },

  validateState(state: unknown) {
    _metrics.validationsRun++;
    if (!state || typeof state !== 'object') { _metrics.validationsFailed++; return { valid: false, error: 'State must be an object' }; }
    const st: any = state;
    const requiredKeys = ['session', 'preferences', 'app', 'navigation', 'flags'];
    const missingKeys = [];
    for (let i = 0; i < requiredKeys.length; i++) { if (!(requiredKeys[i] in state)) missingKeys.push(requiredKeys[i]); }
    if (missingKeys.length > 0) { _metrics.validationsFailed++; return { valid: false, error: `Missing keys: ${missingKeys.join(', ')}` }; }
    const sessionValidation = this.validateSession(st.session);
    if (!sessionValidation.valid) return { valid: false, error: `session: ${sessionValidation.error}` };
    const prefsValidation = this.validatePreferences(st.preferences);
    if (!prefsValidation.valid) return { valid: false, error: `preferences: ${prefsValidation.error}` };
    const navValidation = this.validateNavigation(st.navigation);
    if (!navValidation.valid) return { valid: false, error: `navigation: ${navValidation.error}` };
    _metrics.validationsPassed++;
    return { valid: true, error: null };
  },

  validateAction(action: unknown) {
    _metrics.validationsRun++;
    if (!action || typeof action !== 'object') { _metrics.validationsFailed++; return { valid: false, error: 'Action must be an object' }; }
    const a: any = action;
    if (!a.type || typeof a.type !== 'string') { _metrics.validationsFailed++; return { valid: false, error: 'Action must have a type string' }; }
    _metrics.validationsPassed++;
    return { valid: true, error: null };
  },

  validatePartialUpdate(path: unknown, value: unknown) {
    _metrics.validationsRun++;
    if (!path || typeof path !== 'string') { _metrics.validationsFailed++; return { valid: false, error: 'Path must be a string' }; }
    if (value === undefined) { _metrics.validationsFailed++; return { valid: false, error: 'Value cannot be undefined' }; }
    _metrics.validationsPassed++;
    return { valid: true, error: null };
  },

  sanitizeUser(user: unknown) {
    _metrics.sanitizationsRun++;
    if (!user || typeof user !== 'object') return null;
    const sanitized: Record<string, unknown> = Object.assign({}, user as Record<string, unknown>);
    for (let i = 0; i < SENSITIVE_FIELDS.length; i++) { delete sanitized[SENSITIVE_FIELDS[i]]; }
    return sanitized;
  },

  filterAllowedFields(obj: unknown, section: string) {
    if (!obj || typeof obj !== 'object') return {};
    const allowedFields = (ALLOWED_FIELDS as Record<string, readonly string[]>)[section];
    if (!allowedFields) return {};
    const result: Record<string, unknown> = {};
    const objRecord = obj as Record<string, unknown>;
    const keys = Object.keys(objRecord);
    for (let i = 0; i < keys.length; i++) { const key = keys[i]; if (allowedFields.indexOf(key) !== -1) result[key] = objRecord[key]; }
    return result;
  },

  info() { return { moduleId: MODULE_ID, version: VERSION, metrics: Object.assign({}, _metrics), successRate: _metrics.validationsRun > 0 ? `${((_metrics.validationsPassed / _metrics.validationsRun) * 100).toFixed(2)}%` : 'N/A', contractsSource: 'api/contracts.js', timestamp: Date.now() }; },

  healthCheck() {
    const checks = { contractsImported: !!GlobalStateContracts, hasAllowedFields: Object.keys(ALLOWED_FIELDS).length > 0, hasValidValues: Object.keys(VALID_VALUES).length > 0, hasSensitiveFields: SENSITIVE_FIELDS.length > 0, lowFailureRate: _metrics.validationsRun === 0 || (_metrics.validationsFailed / _metrics.validationsRun) < 0.5 };
    let passed = 0; let total = 0; const keys = Object.keys(checks); for (let i = 0; i < keys.length; i++) { total++; if ((checks as Record<string, boolean>)[keys[i]]) passed++; }
    return { status: passed === total ? 'HEALTHY' : 'DEGRADED', score: `${passed}/${total}`, healthy: passed === total, checks, metrics: Object.assign({}, _metrics), moduleId: MODULE_ID, version: VERSION, timestamp: Date.now() };
  },

  resetMetrics() { _metrics.validationsRun = 0; _metrics.validationsPassed = 0; _metrics.validationsFailed = 0; _metrics.sanitizationsRun = 0; }
};

export default StateValidators;
export { MODULE_ID, VERSION };
