import { HEADER_EVENTS } from "/core/runtime/events/catalog/header.events.js";
import { AUTH_EVENTS } from "/core/runtime/events/catalog/auth.events.js";
import { PERMISSIONS_EVENTS } from "/core/runtime/events/catalog/permissions.events.js";
import { MODULE_ID } from "../constants.js";
import { getPort } from "../ports.js";
import { log } from "../helpers/logger.js";
import { safeOn } from "../helpers/event-bus.js";
import { getUserMenu, updateUserMenu } from "../user-menu/updater.js";
const VERSION = "1.1.0-ES6";
function handleLoginSuccess(header, data) {
  try {
    const user = data && data.user ? data.user : null;
    updateUserMenu(header, user);
    if (header && header.eventBus && typeof header.eventBus.emit === "function") {
      header.eventBus.emit(HEADER_EVENTS.AUTH_LOGIN_UPDATED, {
        authenticated: !!user,
        user,
        timestamp: Date.now(),
        source: MODULE_ID
      });
    }
  } catch (e) {
    log("error", "_handleLoginSuccess error", e.message);
  }
}
function handleSessionStarted(header, metrics, data) {
  try {
    if (!data || !data.authenticated || !data.user) {
      log("debug", "SESSION_STARTED sem usu\xE1rio v\xE1lido - mantendo estado atual");
      return;
    }
    updateUserMenu(header, data.user);
    log("info", "User-menu atualizado via SESSION_STARTED", data.user.email);
    if (header && header.eventBus && typeof header.eventBus.emit === "function") {
      header.eventBus.emit(HEADER_EVENTS.AUTH_LOGIN_UPDATED, {
        authenticated: true,
        user: data.user,
        source: "session_started",
        timestamp: Date.now(),
        moduleId: MODULE_ID
      });
    }
  } catch (e) {
    log("error", "_handleSessionStarted error", e.message);
  }
}
function handleLogout(header, data) {
  try {
    const userMenu = getUserMenu(header);
    if (userMenu) {
      if (typeof userMenu.clearUser === "function") {
        userMenu.clearUser();
      } else {
        updateUserMenu(header, null);
      }
      log("debug", "User-menu limpo via AUTH_EVENTS");
    }
    if (header && header.eventBus && typeof header.eventBus.emit === "function") {
      header.eventBus.emit(HEADER_EVENTS.AUTH_LOGOUT_UPDATED, {
        authenticated: false,
        user: null,
        timestamp: Date.now(),
        source: MODULE_ID
      });
    }
  } catch (e) {
    log("error", "_handleLogout error", e.message);
  }
}
function handleAuthStateChange(header, data) {
  try {
    const state = data ? data.state || data.newState : "unknown";
    const headerEl = document.querySelector(".main-header");
    if (headerEl) {
      headerEl.setAttribute("data-auth-state", state);
    }
  } catch (e) {
    log("error", "_handleAuthStateChange error", e.message);
  }
}
function handleSessionExpired(header, data) {
  try {
    updateUserMenu(header, null);
    if (header && header.announceManager && typeof header.announceManager.announce === "function") {
      header.announceManager.announce("Sess\xE3o expirada. Por favor, fa\xE7a login novamente.");
    }
    if (header && typeof header.showFallback === "function") {
      header.showFallback("auth", "Sess\xE3o expirada");
    }
  } catch (e) {
    log("error", "_handleSessionExpired error", e.message);
  }
}
function handlePermissionsReady(header, data) {
  try {
    const model = data && data.model ? data.model : null;
    if (!model || !model.resolved) {
      log("debug", "PERMISSIONS_EVENTS.READY sem modelo v\xE1lido");
      return;
    }
    const headerEl = document.querySelector(".main-header");
    if (headerEl) {
      const authState = model.auth.isAuthenticated ? "authenticated" : "unauthenticated";
      headerEl.setAttribute("data-auth-state", authState);
      if (model.access.level !== void 0) {
        headerEl.setAttribute("data-user-level", String(model.access.level));
      }
    }
    if (model.auth.isAuthenticated && model.auth.username) {
      const user = {
        // @ts-expect-error TS migration - TS2339
        id: model.auth.userId,
        // @ts-expect-error TS migration - TS2339
        username: model.auth.username,
        // @ts-expect-error TS migration - TS2339
        email: model.auth.email,
        // @ts-expect-error TS migration - TS2339
        level: model.access.level,
        // @ts-expect-error TS migration - TS2339
        roles: model.access.roles
      };
      updateUserMenu(header, user);
      log("info", "UARPS Soberano: Header sincronizado via PERMISSIONS_EVENTS.READY", {
        // @ts-expect-error TS migration - TS2339
        username: model.auth.username,
        // @ts-expect-error TS migration - TS2339
        level: model.access.level
      });
    }
    if (header && header.eventBus && typeof header.eventBus.emit === "function") {
      header.eventBus.emit(HEADER_EVENTS.AUTH_LOGIN_UPDATED, {
        // @ts-expect-error TS migration - TS2339
        authenticated: model.auth.isAuthenticated,
        // @ts-expect-error TS migration - TS2339
        user: model.auth.isAuthenticated ? {
          // @ts-expect-error TS migration - TS2339
          id: model.auth.userId,
          // @ts-expect-error TS migration - TS2339
          username: model.auth.username,
          // @ts-expect-error TS migration - TS2339
          email: model.auth.email
        } : null,
        source: "permission-resolver",
        timestamp: Date.now(),
        moduleId: MODULE_ID
      });
    }
  } catch (e) {
    log("error", "_handlePermissionsReady error", e.message);
  }
}
function setupAuthEventHandlers(headerEvents) {
  const eb = getPort("eventBus");
  if (!eb) {
    log("warn", "EventBus global n\xE3o dispon\xEDvel - AUTH_EVENTS n\xE3o configurados");
    return;
  }
  const header = headerEvents.header;
  const metrics = headerEvents._metrics;
  const cleanups = headerEvents._authCleanups;
  const onLoginSuccess = (data) => {
    metrics.authEventCount++;
    metrics.lastEventAt = Date.now();
    const userEmail = data && data.user && data.user.email ? data.user.email : "user";
    log("info", "AUTH: Login success recebido", userEmail);
    handleLoginSuccess(header, data);
  };
  const onSessionStarted = (data) => {
    metrics.authEventCount++;
    metrics.sessionStartedCount++;
    metrics.lastEventAt = Date.now();
    log("info", "AUTH: Session started recebido");
    handleSessionStarted(header, metrics, data);
  };
  const onLogout = (data) => {
    metrics.authEventCount++;
    metrics.lastEventAt = Date.now();
    log("info", "AUTH: Logout recebido");
    handleLogout(header, data);
  };
  const onAuthStateChange = (data) => {
    metrics.authEventCount++;
    metrics.lastEventAt = Date.now();
    const state = data ? data.state || data.newState : null;
    log("debug", "AUTH: State change", state);
    handleAuthStateChange(header, data);
  };
  const onSessionExpired = (data) => {
    metrics.authEventCount++;
    metrics.lastEventAt = Date.now();
    log("warn", "AUTH: Session expired");
    handleSessionExpired(header, data);
  };
  const cleanup1 = safeOn(eb, AUTH_EVENTS.LOGIN_SUCCESS, onLoginSuccess);
  const cleanup2 = safeOn(eb, AUTH_EVENTS.SESSION_STARTED, onSessionStarted);
  const cleanup3 = safeOn(eb, AUTH_EVENTS.LOGOUT, onLogout);
  const cleanup4 = safeOn(eb, AUTH_EVENTS.STATE_CHANGED, onAuthStateChange);
  const cleanup5 = safeOn(eb, AUTH_EVENTS.SESSION_EXPIRED, onSessionExpired);
  if (cleanup1) cleanups.push(typeof cleanup1 === "function" ? cleanup1 : () => {
    const bus = getPort("eventBus");
    if (bus && bus.off) bus.off(AUTH_EVENTS.LOGIN_SUCCESS, onLoginSuccess);
  });
  if (cleanup2) cleanups.push(typeof cleanup2 === "function" ? cleanup2 : () => {
    const bus = getPort("eventBus");
    if (bus && bus.off) bus.off(AUTH_EVENTS.SESSION_STARTED, onSessionStarted);
  });
  if (cleanup3) cleanups.push(typeof cleanup3 === "function" ? cleanup3 : () => {
    const bus = getPort("eventBus");
    if (bus && bus.off) bus.off(AUTH_EVENTS.LOGOUT, onLogout);
  });
  if (cleanup4) cleanups.push(typeof cleanup4 === "function" ? cleanup4 : () => {
    const bus = getPort("eventBus");
    if (bus && bus.off) bus.off(AUTH_EVENTS.STATE_CHANGED, onAuthStateChange);
  });
  if (cleanup5) cleanups.push(typeof cleanup5 === "function" ? cleanup5 : () => {
    const bus = getPort("eventBus");
    if (bus && bus.off) bus.off(AUTH_EVENTS.SESSION_EXPIRED, onSessionExpired);
  });
  const onPermissionsReady = (data) => {
    metrics.authEventCount++;
    metrics.lastEventAt = Date.now();
    log("info", "UARPS: PERMISSIONS_EVENTS.READY recebido");
    handlePermissionsReady(header, data);
  };
  const cleanup6 = safeOn(eb, PERMISSIONS_EVENTS.READY, onPermissionsReady);
  if (cleanup6) cleanups.push(typeof cleanup6 === "function" ? cleanup6 : () => {
    const bus = getPort("eventBus");
    if (bus && bus.off) bus.off(PERMISSIONS_EVENTS.READY, onPermissionsReady);
  });
  log("info", `AUTH_EVENTS + PERMISSIONS_EVENTS configurados (${cleanups.length} listeners) - UARPS Soberano Phase P0`);
}
function cleanupAuthEvents(headerEvents) {
  headerEvents._authCleanups.forEach((cleanup) => {
    try {
      if (typeof cleanup === "function") cleanup();
    } catch (e) {
    }
  });
  headerEvents._authCleanups = [];
  log("debug", "AUTH_EVENTS + PERMISSIONS_EVENTS cleanup conclu\xEDdo");
}
export {
  VERSION,
  cleanupAuthEvents,
  handleAuthStateChange,
  handleLoginSuccess,
  handleLogout,
  handlePermissionsReady,
  handleSessionExpired,
  handleSessionStarted,
  setupAuthEventHandlers
};
