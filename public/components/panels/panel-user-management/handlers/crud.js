import { createUiPorts } from "/core/runtime/ports-profiles.js";
import { AUTH_EVENTS } from "/core/runtime/events/catalog/auth.events.js";
import { api } from "../api/client.js";
import { state } from "../state/store.js";
import { ui } from "../ui/renderer.js";
import { tracker } from "../telemetry/tracker.js";
import { PERMISSION_ACTIONS } from "../core/contracts.js";
import { validateUser, validateFilters, removeSensitiveData } from "../utils/validators.js";
import { mapUserListToViewModel, mapRoleListToViewModel, mapSessionListToViewModel } from "../utils/mappers.js";
import { metrics, ensureAuth, checkAction, MODULE_ID } from "../core/lifecycle.js";
const VERSION = "9.3.0-P2-ENTERPRISE";
const CRUD_MODULE_ID = "panels-panel-user-management-handlers-crud";
const Ports = createUiPorts({ moduleId: CRUD_MODULE_ID });
function _initPorts() {
  Ports.init();
}
function _getPort(name) {
  return Ports.get(name);
}
function injectPorts(p) {
  return Ports.inject(p);
}
function getPorts() {
  return Ports.snapshot();
}
const _debug = () => {
  const cfg = _getPort("config");
  return cfg && cfg.app && cfg.app.debug ? true : false;
};
const _log = function(level, ...rest) {
  const args = rest;
  const logger = _getPort("logger");
  if (!logger) return;
  if (level === "error") {
    logger.error && logger.error(...[`[${MODULE_ID}]`].concat(args));
    return;
  }
  if (level === "warn") {
    logger.warn && logger.warn(...[`[${MODULE_ID}]`].concat(args));
    return;
  }
  if (_debug()) logger.debug && logger.debug(...[`[${MODULE_ID}]`].concat(args));
};
function _handleAuthError(error, action) {
  if (error && (error.status === 401 || error.message && error.message.indexOf("401") !== -1)) {
    metrics.authFailCount++;
    const eb = _getPort("eventBus");
    if (eb && eb.emit) eb.emit(AUTH_EVENTS.SESSION_EXPIRED, { source: MODULE_ID });
    state.setError("Sess\xE3o expirada. Fa\xE7a login novamente.");
  } else if (error && error.status === 403) {
    metrics.permissionDeniedCount++;
    state.setError("Sem permiss\xE3o de administrador.");
  } else {
    state.setError(error && error.message ? error.message : `Erro ao executar ${action}`);
  }
}
function loadData() {
  _initPorts();
  if (!ensureAuth("loadData")) {
    state.setLoading(false);
    return Promise.resolve(false);
  }
  if (!checkAction(PERMISSION_ACTIONS.VIEW)) {
    state.setError("Sem permiss\xE3o para visualizar usu\xE1rios");
    state.setLoading(false);
    return Promise.resolve(false);
  }
  state.setLoading(true);
  state.setError(null);
  tracker.trackLoadStart();
  metrics.loadCount++;
  metrics.lastActivity = Date.now();
  return Promise.all([api.getUsers(), api.getRoles()]).then((results) => {
    const usersRaw = results[0];
    const rolesRaw = results[1];
    const users = mapUserListToViewModel(usersRaw);
    const roles = mapRoleListToViewModel(rolesRaw);
    state.setUsers(users);
    state.setRoles(roles);
    tracker.trackLoadSuccess(users.length, roles.length);
    state.setLoading(false);
    return true;
  }).catch((error) => {
    metrics.errorCount++;
    tracker.trackLoadError(error);
    _handleAuthError(error, "loadData");
    state.setLoading(false);
    return false;
  });
}
function searchUsers(filters) {
  filters = filters || {};
  if (!ensureAuth("searchUsers")) return Promise.resolve();
  state.setLoading(true);
  const validated = validateFilters(filters);
  return api.searchUsers(validated.normalizedFilters).then((usersRaw) => {
    const users = mapUserListToViewModel(usersRaw);
    state.setUsers(users);
    state.setFilters(validated.normalizedFilters);
    tracker.trackSearch(validated.normalizedFilters, users.length);
    state.setLoading(false);
  }).catch((error) => {
    metrics.errorCount++;
    tracker.trackLoadError(error);
    _handleAuthError(error, "searchUsers");
    state.setLoading(false);
  });
}
function viewUser(userId) {
  if (!ensureAuth("viewUser")) return Promise.resolve();
  if (!checkAction(PERMISSION_ACTIONS.VIEW, userId)) {
    ui.showToast("Sem permiss\xE3o para ver este usu\xE1rio", "error");
    return Promise.resolve();
  }
  state.setLoading(true);
  const canViewSessions = checkAction(PERMISSION_ACTIONS.VIEW_SESSIONS, userId);
  return Promise.all([api.getUser(userId), canViewSessions ? api.getUserSessions(userId) : Promise.resolve([]), api.getUserPreferences(userId)]).then((results) => {
    const userRaw = results[0];
    const sessionsRaw = results[1];
    const preferences = results[2];
    const validated = validateUser(userRaw);
    if (!validated.valid) _log("warn", "Dados de usu\xE1rio inv\xE1lidos:", validated.errors);
    const user = validated.normalizedUser || userRaw;
    const sessions = mapSessionListToViewModel(sessionsRaw);
    state.setSelectedUser(Object.assign({}, user, { sessions, preferences: removeSensitiveData(preferences) }));
    ui.showUserDetails(state.getSelectedUser());
    tracker.trackUserSelected(userId, "action");
    state.setLoading(false);
  }).catch((error) => {
    metrics.errorCount++;
    state.setError(error && error.message ? error.message : "Erro");
    state.setLoading(false);
  });
}
function editUser(userId, data) {
  if (!ensureAuth("editUser")) return Promise.resolve(false);
  if (!checkAction(PERMISSION_ACTIONS.EDIT, userId)) {
    state.setError("Sem permiss\xE3o para editar usu\xE1rios");
    ui.showToast("Sem permiss\xE3o para editar", "error");
    return Promise.resolve(false);
  }
  state.setLoading(true);
  const cleanData = removeSensitiveData(data);
  return api.updateUser(userId, cleanData).then(() => {
    ui.hideUserDetails();
    state.setSelectedUser(null);
    return loadData();
  }).then(() => {
    const fieldsChanged = Object.keys(cleanData);
    tracker.trackUserUpdated(userId, fieldsChanged);
    ui.showToast("Usu\xE1rio atualizado com sucesso", "success");
    state.setLoading(false);
    return true;
  }).catch((error) => {
    metrics.errorCount++;
    state.setError(error && error.message ? error.message : "Erro");
    ui.showToast(error && error.message ? error.message : "Erro ao atualizar", "error");
    state.setLoading(false);
    return false;
  });
}
function createUser(userData) {
  if (!ensureAuth("createUser")) return Promise.resolve(false);
  if (!checkAction(PERMISSION_ACTIONS.CREATE)) {
    state.setError("Sem permiss\xE3o para criar usu\xE1rios");
    ui.showToast("Sem permiss\xE3o para criar", "error");
    return Promise.resolve(false);
  }
  state.setLoading(true);
  const cleanData = removeSensitiveData(userData);
  return api.createUser(cleanData).then((newUser) => loadData().then(() => {
    tracker.trackUserCreated ? tracker.trackUserCreated(newUser.id || "new") : null;
    ui.showToast("Usu\xE1rio criado com sucesso", "success");
    state.setLoading(false);
    return true;
  })).catch((error) => {
    metrics.errorCount++;
    _handleAuthError(error, "createUser");
    ui.showToast(error && error.message ? error.message : "Erro ao criar usu\xE1rio", "error");
    state.setLoading(false);
    return false;
  });
}
function deleteUser(userId) {
  if (!ensureAuth("deleteUser")) return Promise.resolve(false);
  if (!checkAction(PERMISSION_ACTIONS.DELETE, userId)) {
    state.setError("Sem permiss\xE3o para excluir usu\xE1rios");
    ui.showToast("Sem permiss\xE3o para excluir", "error");
    return Promise.resolve(false);
  }
  state.setLoading(true);
  return api.deleteUser(userId).then(() => {
    state.setSelectedUser(null);
    return loadData();
  }).then(() => {
    tracker.trackUserDeleted ? tracker.trackUserDeleted(userId) : null;
    ui.showToast("Usu\xE1rio exclu\xEDdo com sucesso", "success");
    state.setLoading(false);
    return true;
  }).catch((error) => {
    metrics.errorCount++;
    _handleAuthError(error, "deleteUser");
    ui.showToast(error && error.message ? error.message : "Erro ao excluir usu\xE1rio", "error");
    state.setLoading(false);
    return false;
  });
}
function exportUsers(format) {
  if (!ensureAuth("exportUsers")) return Promise.resolve(false);
  if (!checkAction(PERMISSION_ACTIONS.EXPORT)) {
    ui.showToast("Sem permiss\xE3o para exportar", "error");
    return Promise.resolve(false);
  }
  const currentFilters = state.getFilters();
  return api.exportUsers(currentFilters, format || "csv").then(() => {
    tracker.trackExport ? tracker.trackExport(format || "csv", state.getUsers().length) : null;
    ui.showToast("Exporta\xE7\xE3o conclu\xEDda", "success");
    return true;
  }).catch((error) => {
    metrics.errorCount++;
    ui.showToast(error && error.message ? error.message : "Erro ao exportar", "error");
    return false;
  });
}
function bulkUpdateStatus(userIds, newStatus) {
  if (!ensureAuth("bulkUpdateStatus")) return Promise.resolve(false);
  if (!checkAction(PERMISSION_ACTIONS.MANAGE_STATUS)) {
    ui.showToast("Sem permiss\xE3o para alterar status em massa", "error");
    return Promise.resolve(false);
  }
  if (!userIds || userIds.length === 0) {
    ui.showToast("Nenhum usu\xE1rio selecionado", "warning");
    return Promise.resolve(false);
  }
  state.setLoading(true);
  return api.bulkUpdateStatus(userIds, newStatus).then(() => loadData()).then(() => {
    tracker.trackBulkAction ? tracker.trackBulkAction("status-change", userIds.length, newStatus) : null;
    ui.showToast(`${userIds.length} usu\xE1rios atualizados com sucesso`, "success");
    state.setLoading(false);
    return true;
  }).catch((error) => {
    metrics.errorCount++;
    _handleAuthError(error, "bulkUpdateStatus");
    ui.showToast(error && error.message ? error.message : "Erro na opera\xE7\xE3o em massa", "error");
    state.setLoading(false);
    return false;
  });
}
function updateUserStatus(userId, newStatus) {
  if (!ensureAuth("updateUserStatus")) return Promise.resolve(false);
  if (!checkAction(PERMISSION_ACTIONS.EDIT, userId)) {
    ui.showToast("Sem permiss\xE3o para alterar status", "error");
    return Promise.resolve(false);
  }
  state.setLoading(true);
  return api.updateUser(userId, { status: newStatus }).then(() => {
    ui.hideUserDetails();
    state.setSelectedUser(null);
    return loadData();
  }).then(() => {
    tracker.trackUserUpdated(userId, ["status"]);
    ui.showToast(`Usu\xE1rio ${newStatus === "active" ? "ativado" : "desativado"} com sucesso`, "success");
    state.setLoading(false);
    return true;
  }).catch((error) => {
    metrics.errorCount++;
    ui.showToast(error && error.message ? error.message : "Erro ao alterar status", "error");
    state.setLoading(false);
    return false;
  });
}
function resetPassword(userId) {
  if (!ensureAuth("resetPassword")) return Promise.resolve(false);
  if (!checkAction(PERMISSION_ACTIONS.RESET_PASSWORD, userId)) {
    state.setError("Sem permiss\xE3o para resetar senhas");
    ui.showToast("Sem permiss\xE3o", "error");
    return Promise.resolve(false);
  }
  state.setLoading(true);
  return api.resetPassword(userId).then(() => {
    tracker.trackPasswordReset(userId);
    ui.showToast("Senha resetada com sucesso", "success");
    state.setLoading(false);
    return true;
  }).catch((error) => {
    metrics.errorCount++;
    state.setError(error && error.message ? error.message : "Erro");
    ui.showToast(error && error.message ? error.message : "Erro ao resetar senha", "error");
    state.setLoading(false);
    return false;
  });
}
function assignRole(userId, roleId, roleName) {
  if (!ensureAuth("assignRole")) return Promise.resolve(false);
  if (!checkAction(PERMISSION_ACTIONS.MANAGE_ROLES, userId)) {
    state.setError("Sem permiss\xE3o para atribuir roles");
    ui.showToast("Sem permiss\xE3o", "error");
    return Promise.resolve(false);
  }
  const currentUser = state.getSelectedUser();
  const roles0 = currentUser && Array.isArray(currentUser.roles) ? currentUser.roles[0] : null;
  const fromRole = currentUser && currentUser.role ? String(currentUser.role) : roles0 && roles0.name ? String(roles0.name) : "none";
  return api.assignRole(userId, roleId).then(() => viewUser(userId)).then(() => {
    tracker.trackRoleChanged(userId, fromRole, roleName || String(roleId));
    ui.showToast("Role atribu\xEDda com sucesso", "success");
    return true;
  }).catch((error) => {
    metrics.errorCount++;
    state.setError(error && error.message ? error.message : "Erro");
    ui.showToast(error && error.message ? error.message : "Erro ao atribuir role", "error");
    return false;
  });
}
function terminateSession(sessionId) {
  if (!ensureAuth("terminateSession")) return Promise.resolve(false);
  const selectedUser = state.getSelectedUser();
  const selectedUserId = selectedUser ? selectedUser.id : null;
  if (!checkAction(PERMISSION_ACTIONS.TERMINATE_SESSION, selectedUserId)) {
    state.setError("Sem permiss\xE3o para encerrar sess\xF5es");
    ui.showToast("Sem permiss\xE3o", "error");
    return Promise.resolve(false);
  }
  return api.terminateSession(sessionId).then(() => {
    if (selectedUser && selectedUserId) return viewUser(selectedUserId);
  }).then(() => {
    tracker.trackSessionTerminated(sessionId, selectedUserId);
    ui.showToast("Sess\xE3o encerrada", "success");
    return true;
  }).catch((error) => {
    metrics.errorCount++;
    state.setError(error && error.message ? error.message : "Erro");
    ui.showToast(error && error.message ? error.message : "Erro ao encerrar sess\xE3o", "error");
    return false;
  });
}
function info() {
  const ps = Ports.snapshot();
  return { moduleId: CRUD_MODULE_ID, version: VERSION, portsInitialized: ps._initialized };
}
function healthCheck() {
  const ps = Ports.snapshot();
  const logger = _getPort("logger");
  return { status: ps._initialized ? "HEALTHY" : "DEGRADED", moduleId: CRUD_MODULE_ID, version: VERSION, portsInitialized: ps._initialized, checks: { crudReady: true, loggerReady: !!logger } };
}
export {
  CRUD_MODULE_ID as MODULE_ID,
  VERSION,
  assignRole,
  bulkUpdateStatus,
  createUser,
  deleteUser,
  editUser,
  exportUsers,
  getPorts,
  healthCheck,
  info,
  injectPorts,
  loadData,
  resetPassword,
  searchUsers,
  terminateSession,
  updateUserStatus,
  viewUser
};
