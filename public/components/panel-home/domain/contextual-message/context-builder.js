import { TIME_PERIODS, SYSTEM_STATES } from "../../core/constants.js";
import { CONFIG } from "../../core/config.js";
const VERSION = "1.1.0-P2-ENTERPRISE";
const MODULE_ID = "panel-home/domain/contextual-message/context-builder";
function _getGlobalState() {
  if (typeof window === "undefined") return null;
  if (window.Core && window.Core.windowAdapter && window.Core.windowAdapter.get) {
    const gs = window.Core.windowAdapter.get("GlobalState");
    if (gs) return gs;
  }
  return null;
}
function _getSessionManager() {
  if (typeof window === "undefined") return null;
  if (window.Core && window.Core.windowAdapter && window.Core.windowAdapter.get) {
    const sm = window.Core.windowAdapter.get("SessionManager");
    if (sm) return sm;
  }
  return null;
}
function getTimePeriod(hour) {
  const periods = CONFIG.timePeriods;
  if (hour >= periods.morning.start && hour < periods.morning.end) {
    return TIME_PERIODS.MORNING;
  }
  if (hour >= periods.afternoon.start && hour < periods.afternoon.end) {
    return TIME_PERIODS.AFTERNOON;
  }
  if (hour >= periods.evening.start && hour < periods.evening.end) {
    return TIME_PERIODS.EVENING;
  }
  return TIME_PERIODS.NIGHT;
}
function getDayOfWeek(date) {
  return date.getDay();
}
function isStartOfWeek(dayOfWeek) {
  return dayOfWeek === 0 || dayOfWeek === 1;
}
function isWeekend(dayOfWeek) {
  return dayOfWeek === 0 || dayOfWeek === 6;
}
function getUserInfo() {
  const user = { id: null, name: null, role: null };
  const globalState = _getGlobalState();
  if (globalState && globalState.get) {
    try {
      const userData = globalState.get("user");
      if (userData) {
        user.id = userData.id || userData.userId || null;
        user.name = userData.name || userData.nome || userData.firstName || null;
        user.role = userData.role || userData.cargo || null;
      }
    } catch (e) {
    }
  }
  if (!user.id) {
    const sessionManager = _getSessionManager();
    if (sessionManager && sessionManager.getUser) {
      try {
        const sessionUser = sessionManager.getUser();
        if (sessionUser) {
          user.id = sessionUser.id || null;
          user.name = sessionUser.name || sessionUser.nome || null;
          user.role = sessionUser.role || null;
        }
      } catch (e) {
      }
    }
  }
  return user;
}
function getSessionInfo() {
  const session = {
    isFirstAccess: false,
    isReturning: false,
    duration: 0,
    startTime: null
  };
  const sessionKey = "ph_session_start";
  const lastVisitKey = "ph_last_visit";
  if (typeof window === "undefined" || !window.sessionStorage) {
    return session;
  }
  const now = Date.now();
  const sessionStart = sessionStorage.getItem(sessionKey);
  const lastVisit = localStorage.getItem(lastVisitKey);
  if (!sessionStart) {
    sessionStorage.setItem(sessionKey, now.toString());
    session.isFirstAccess = true;
    session.startTime = now;
  } else {
    session.startTime = parseInt(sessionStart, 10);
    session.duration = Math.floor((now - session.startTime) / 1e3);
  }
  if (lastVisit) {
    const lastVisitTime = parseInt(lastVisit, 10);
    const hoursSinceLastVisit = (now - lastVisitTime) / (1e3 * 60 * 60);
    session.isReturning = hoursSinceLastVisit > 1 && hoursSinceLastVisit < 168;
  }
  localStorage.setItem(lastVisitKey, now.toString());
  return session;
}
function getSystemState() {
  if (typeof window !== "undefined" && window.BootstrapV2?.getState) {
    const state = window.BootstrapV2.getState();
    if (state === "ready" || state === "complete") return SYSTEM_STATES.READY;
    if (state === "loading" || state === "booting") return SYSTEM_STATES.LOADING;
    if (state === "error" || state === "failed") return SYSTEM_STATES.ERROR;
  }
  if (typeof document !== "undefined") {
    const bodyState = document.body?.dataset?.state;
    if (bodyState === "authenticated" || bodyState === "ready") return SYSTEM_STATES.READY;
    if (bodyState === "loading") return SYSTEM_STATES.LOADING;
    if (bodyState === "error") return SYSTEM_STATES.ERROR;
  }
  return SYSTEM_STATES.READY;
}
function getEnvironmentInfo() {
  const env = {
    theme: "dark",
    locale: "pt-BR"
  };
  if (typeof document !== "undefined") {
    env.theme = document.documentElement.dataset.theme || "dark";
  }
  if (typeof navigator !== "undefined") {
    env.locale = navigator.language || "pt-BR";
  }
  return env;
}
function buildContext() {
  const now = /* @__PURE__ */ new Date();
  const hour = now.getHours();
  const dayOfWeek = getDayOfWeek(now);
  return {
    user: getUserInfo(),
    time: {
      hour,
      dayOfWeek,
      period: getTimePeriod(hour),
      isStartOfWeek: isStartOfWeek(dayOfWeek),
      isWeekend: isWeekend(dayOfWeek),
      timestamp: now.toISOString()
    },
    session: getSessionInfo(),
    system: {
      state: getSystemState()
    },
    environment: getEnvironmentInfo()
  };
}
var context_builder_default = {
  buildContext,
  getTimePeriod,
  getUserInfo,
  getSessionInfo,
  getSystemState,
  getEnvironmentInfo
};
export {
  MODULE_ID,
  VERSION,
  buildContext,
  context_builder_default as default
};
