import { createCorePorts } from "/core/runtime/ports-profiles.js";
import { log, getPort as _initPortsBase } from "../ports.js";
import { CookiePort } from "../ports/cookie-port.js";
import { sessionStore } from "../state/store.js";
import { SessionAPIClient } from "../api/client.js";
import { TokenManager } from "./token.js";
import { AUTH_EVENTS } from "/core/runtime/events/catalog/auth.events.js";
import { sanitizeUser, calculateExpiresAt, generateSessionId } from "../utils/helpers.js";
const VERSION = "5.3.0-P18EC";
const MODULE_ID = "session-auth";
const Ports = createCorePorts({ moduleId: MODULE_ID });
function _initPorts() {
  Ports.init();
  _initPortsBase();
}
function _getPort(name) {
  const p = Ports.get(name);
  if (p) return p;
  return getPort(name);
}
function injectPorts(p) {
  return Ports.inject(p);
}
function getPorts() {
  return Ports.snapshot();
}
const SESSION_COOKIE_NAME = "DSHOWSESS";
const _metrics = { loginAttempts: 0, loginSuccess: 0, loginFailures: 0, logouts: 0, sessionChecks: 0, refreshes: 0, eventsEmitted: 0, errors: 0, invalidCookiesCleared: 0 };
function hasSessionCookie() {
  return CookiePort.has(SESSION_COOKIE_NAME);
}
function clearInvalidSessionCookie() {
  if (!hasSessionCookie()) return false;
  CookiePort.remove(SESSION_COOKIE_NAME, { path: "/" });
  CookiePort.remove(SESSION_COOKIE_NAME, { path: "/", domain: "dshowdash.com.br" });
  CookiePort.remove(SESSION_COOKIE_NAME, { path: "/", domain: ".dshowdash.com.br" });
  _metrics.invalidCookiesCleared++;
  log.info("Cookie de sess\xE3o inv\xE1lido removido", { cookie: SESSION_COOKIE_NAME });
  return !hasSessionCookie();
}
function emitAuthEvent(eventName, data) {
  if (!data) data = {};
  _metrics.eventsEmitted++;
  _initPorts();
  const eventBus = _getPort("eventBus");
  if (eventBus && eventBus.emit) {
    try {
      eventBus.emit(eventName, Object.assign({}, data, { source: "session-manager", timestamp: Date.now() }));
    } catch (e) {
      _metrics.errors++;
      log.warn(`Failed to emit event: ${eventName} - ${e.message}`);
    }
  }
}
function login(username, password, options) {
  if (!options) options = {};
  _metrics.loginAttempts++;
  emitAuthEvent(AUTH_EVENTS.LOGIN_ATTEMPT, { username });
  return SessionAPIClient.login(username, password, options).then((result) => {
    if (!result.ok) {
      _metrics.loginFailures++;
      emitAuthEvent(AUTH_EVENTS.LOGIN_FAILURE, { error: result.error });
      return { ok: false, error: result.error };
    }
    _metrics.loginSuccess++;
    const user = sanitizeUser(result.user);
    const expiresAt = calculateExpiresAt(result.expiresIn || 604800);
    const sessionId = generateSessionId();
    sessionStore.update({ authenticated: true, user, userId: user ? user.id : null, roles: user ? user.roles : [], level: user ? user.level : null, sessionId, expiresAt, loginAt: Date.now(), lastActivity: Date.now() });
    if (result.token) {
      TokenManager.setToken(result.token);
      sessionStore.setToken(result.token);
    }
    if (result.csrf) TokenManager.setCsrf(result.csrf);
    emitAuthEvent(AUTH_EVENTS.LOGIN_SUCCESS, { user, sessionId });
    return { ok: true, user, sessionId };
  });
}
function logout(options) {
  if (!options) options = {};
  _metrics.logouts++;
  const wasAuthenticated = sessionStore.isAuthenticated();
  const sessionId = sessionStore.getSessionId();
  return SessionAPIClient.logout(options).then(() => {
    sessionStore.clear();
    TokenManager.clearAll();
    clearInvalidSessionCookie();
    if (wasAuthenticated) emitAuthEvent(AUTH_EVENTS.LOGOUT_SUCCESS, { sessionId });
    return { ok: true };
  });
}
function checkSession(options) {
  if (!options) options = {};
  _metrics.sessionChecks++;
  return SessionAPIClient.checkSession(options).then((result) => {
    if (!result.ok) {
      emitAuthEvent(AUTH_EVENTS.SESSION_CHECKED, { authenticated: false, error: result.error });
      return { ok: false, error: result.error };
    }
    if (result.authenticated && result.user) {
      const user = sanitizeUser(result.user);
      const expiresAt = calculateExpiresAt(result.expiresIn || 604800);
      sessionStore.update({ authenticated: true, user, userId: user ? user.id : null, roles: user ? user.roles : [], level: user ? user.level : null, expiresAt, lastActivity: Date.now() });
      if (result.token) {
        TokenManager.setToken(result.token);
        sessionStore.setToken(result.token);
      }
      if (result.csrf) TokenManager.setCsrf(result.csrf);
      emitAuthEvent(AUTH_EVENTS.SESSION_CHECKED, { authenticated: true, user });
      return { ok: true, authenticated: true, user };
    } else {
      sessionStore.clear();
      TokenManager.clearAll();
      if (hasSessionCookie()) {
        log.warn("Sess\xE3o inv\xE1lida detectada - cookie existe mas servidor retornou n\xE3o autenticado");
        clearInvalidSessionCookie();
      }
      emitAuthEvent(AUTH_EVENTS.SESSION_CHECKED, { authenticated: false });
      return { ok: true, authenticated: false, user: null };
    }
  });
}
function refresh(options) {
  if (!options) options = {};
  _metrics.refreshes++;
  return SessionAPIClient.refresh(options).then((result) => {
    if (!result.ok) return { ok: false, error: result.error };
    if (result.token) {
      TokenManager.setToken(result.token);
      sessionStore.setToken(result.token);
    }
    if (result.csrf) TokenManager.setCsrf(result.csrf);
    if (result.expiresIn) sessionStore.update({ expiresAt: calculateExpiresAt(result.expiresIn) });
    sessionStore.updateActivity();
    emitAuthEvent(AUTH_EVENTS.SESSION_REFRESH, {});
    return { ok: true };
  });
}
function isAuthenticated() {
  return sessionStore.isAuthenticated();
}
function getUser() {
  return sessionStore.getUser();
}
function getAuthContext() {
  const state = sessionStore.getState();
  return { isAuthenticated: state.authenticated, userId: state.userId, user: state.user, roles: state.roles || [], level: state.level, sessionId: state.sessionId, lastActivity: state.lastActivity };
}
function getVersion() {
  return VERSION;
}
function info() {
  const ps = Ports.snapshot();
  return { moduleId: MODULE_ID, version: VERSION, authenticated: sessionStore.isAuthenticated(), userId: sessionStore.getUserId(), hasUser: !!sessionStore.getUser(), hasSessionCookie: hasSessionCookie(), cookieAdapter: CookiePort.getAdapterType(), portsInitialized: ps._initialized, metrics: Object.assign({}, _metrics), successRate: _metrics.loginAttempts > 0 ? `${(_metrics.loginSuccess / _metrics.loginAttempts * 100).toFixed(1)}%` : "N/A", timestamp: Date.now() };
}
function healthCheck() {
  const ps = Ports.snapshot();
  const cookieHealth = CookiePort.healthCheck();
  _initPorts();
  const eventBus = _getPort("eventBus");
  const checks = { storeAvailable: !!sessionStore, apiClientAvailable: !!SessionAPIClient, tokenManagerAvailable: !!TokenManager, cookiePortHealthy: cookieHealth.status === "HEALTHY" || cookieHealth.status === "DEGRADED", eventBusAvailable: !!eventBus, lowErrorRate: _metrics.eventsEmitted === 0 || _metrics.errors / _metrics.eventsEmitted < 0.1, portsInitialized: ps._initialized };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  return { status: passed >= 6 ? "HEALTHY" : "DEGRADED", score: `${passed}/${total}`, healthy: passed >= 6, checks, authenticated: sessionStore.isAuthenticated(), hasSessionCookie: hasSessionCookie(), cookieAdapter: CookiePort.getAdapterType(), version: VERSION, moduleId: MODULE_ID, portsInitialized: ps._initialized, timestamp: Date.now() };
}
const AuthManager = { login, logout, checkSession, refresh, isAuthenticated, getUser, getAuthContext, getVersion, info, healthCheck, hasSessionCookie, clearInvalidSessionCookie };
var auth_default = AuthManager;
export {
  AuthManager,
  MODULE_ID,
  VERSION,
  auth_default as default,
  getPorts,
  injectPorts
};
