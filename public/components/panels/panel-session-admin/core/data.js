import { LOCAL_EVENTS } from "./contracts.js";
import * as BackendAPI from "../adapters/backend-api.js";
import * as Store from "../state/store.js";
import * as Renderer from "../ui/renderer.js";
import tracker from "../telemetry/tracker.js";
import { emit, showToast, log } from "./helpers.js";
import { localState } from "./state.js";
async function refresh() {
  if (Store.isRefreshInProgress()) return { ok: false, warning: "already_in_progress" };
  const authResult = Store.ensureAuth();
  if (!authResult.ok) {
    Renderer.renderAuthRequired(localState.container, localState.config);
    return { ok: false, error: "AUTH_REQUIRED" };
  }
  emit(LOCAL_EVENTS.REFRESH_START);
  Store.dispatch({ type: "SET_LOADING", payload: true });
  Store.dispatch({ type: "SET_REFRESH_IN_PROGRESS", payload: true });
  tracker.refreshStart();
  const startTime = Date.now();
  try {
    const mySessions = await BackendAPI.loadMySessions();
    Store.dispatch({ type: "SET_MY_SESSIONS", payload: mySessions });
    if (authResult.context.isAdmin) {
      const allSessions = await BackendAPI.loadAllSessions();
      Store.dispatch({ type: "SET_SESSIONS", payload: allSessions });
    }
    Store.dispatch({ type: "SET_ERROR", payload: null });
    Store.dispatch({ type: "SET_LOADING", payload: false });
    Store.dispatch({ type: "SET_REFRESH_IN_PROGRESS", payload: false });
    Store.dispatch({ type: "SET_LAST_REFRESH", payload: Date.now() });
    const duration = Date.now() - startTime;
    const sessions = Store.getSessions();
    tracker.refreshSuccess(duration, sessions.length, sessions.filter((s) => s.is_active).length);
    return { ok: true, duration };
  } catch (error) {
    Store.dispatch({ type: "SET_ERROR", payload: error.message });
    Store.dispatch({ type: "SET_LOADING", payload: false });
    Store.dispatch({ type: "SET_REFRESH_IN_PROGRESS", payload: false });
    tracker.refreshError(error, Date.now() - startTime);
    return { ok: false, error: error.message };
  }
}
async function terminateSession(sessionToken) {
  if (!sessionToken) return { ok: false, error: "SESSION_TOKEN_REQUIRED" };
  try {
    await BackendAPI.terminateSession(sessionToken);
    Store.dispatch({ type: "INCREMENT_TERMINATE" });
    tracker.terminateOne(sessionToken);
    showToast("Sess\xE3o encerrada com sucesso");
    localState.expandedIds.delete(sessionToken);
    await refresh();
    return { ok: true };
  } catch (error) {
    tracker.terminateError(error, "single");
    showToast("Erro ao encerrar sess\xE3o", "error");
    return { ok: false, error: error.message };
  }
}
async function terminateAllOthers() {
  try {
    await BackendAPI.terminateAllOthers();
    Store.dispatch({ type: "INCREMENT_TERMINATE" });
    tracker.terminateAllOthers();
    showToast("Outras sess\xF5es encerradas");
    localState.expandedIds.clear();
    await refresh();
    return { ok: true };
  } catch (error) {
    tracker.terminateError(error, "all-others");
    showToast("Erro ao encerrar sess\xF5es", "error");
    return { ok: false, error: error.message };
  }
}
async function terminateSelected() {
  if (localState.selectedIds.size === 0) return { ok: false, error: "NO_SELECTION" };
  const tokens = Array.from(localState.selectedIds);
  let successCount = 0;
  for (const token of tokens) {
    try {
      await BackendAPI.terminateSession(token);
      successCount++;
      localState.expandedIds.delete(token);
    } catch (e) {
      log("warn", `Failed to terminate ${token}:`, e);
    }
  }
  localState.selectedIds.clear();
  Store.dispatch({ type: "INCREMENT_TERMINATE" });
  tracker.terminateSelected(successCount);
  showToast(`${successCount} sess\xE3o(\xF5es) encerrada(s)`);
  await refresh();
  return { ok: true, count: successCount };
}
async function retry() {
  Store.dispatch({ type: "SET_ERROR", payload: null });
  return refresh();
}
const MODULE_ID = "panels-panel-session-admin-core-data";
const VERSION = "9.3.0-P2-ENTERPRISE";
const info = () => ({ moduleId: MODULE_ID, version: VERSION });
const healthCheck = () => ({ status: "HEALTHY", moduleId: MODULE_ID, version: VERSION, checks: { dataReady: true } });
var data_default = { refresh, terminateSession, terminateAllOthers, terminateSelected, retry, MODULE_ID, VERSION, info, healthCheck };
export {
  MODULE_ID,
  VERSION,
  data_default as default,
  healthCheck,
  info,
  refresh,
  retry,
  terminateAllOthers,
  terminateSelected,
  terminateSession
};
