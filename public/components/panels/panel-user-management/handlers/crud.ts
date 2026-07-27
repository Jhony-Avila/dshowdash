// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.6.0-CRUD-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panels-panel-user-management-handlers-crud
// PURPOSE: Panel User Management - CRUD Handlers
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createUiPorts from /core/runtime/ports-profiles.js
//   AUTH_EVENTS from /core/runtime/events/catalog/auth.events.js
//   api from ../api/client.js
//   state from ../state/store.js
//   ui from ../ui/renderer.js
//   tracker from ../telemetry/tracker.js
//   PERMISSION_ACTIONS from ../core/contracts.js
//   validateUser, validateFilters, removeSensitiveData from ../utils/validators.js
//   mapUserListToViewModel, mapRoleListToViewModel, mapSessionListToViewModel fro...
//   metrics, ensureAuth, checkAction, MODULE_ID from ../core/lifecycle.js
//
// PROVIDES:
//   loadData() — exported function
//   searchUsers() — exported function
//   viewUser() — exported function
//   editUser() — exported function
//   createUser() — exported function
//   deleteUser() — exported function
//   exportUsers() — exported function
//   bulkUpdateStatus() — exported function
//   updateUserStatus() — exported function
//   resetPassword() — exported function
//   assignRole() — exported function
//   terminateSession() — exported function
//   info() — exported function
//   healthCheck() — exported function
//   injectPorts() — exported function
//   ... and 3 more exports
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   AUTH_EVENTS.SESSION_EXPIRED
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createUiPorts } from '/core/runtime/ports-profiles.js';
import { AUTH_EVENTS } from '/core/runtime/events/catalog/auth.events.js';
import { api } from '../api/client.js';
import { state } from '../state/store.js';

// @ts-expect-error TS migration - TS2614
import { ui } from '../ui/renderer.js';
import { tracker } from '../telemetry/tracker.js';

// @ts-expect-error TS migration - TS2614
import { PERMISSION_ACTIONS } from '../core/contracts.js';
import { validateUser, validateFilters, removeSensitiveData } from '../utils/validators.js';
import { mapUserListToViewModel, mapRoleListToViewModel, mapSessionListToViewModel } from '../utils/mappers.js';
import { metrics, ensureAuth, checkAction, MODULE_ID } from '../core/lifecycle.js';

const VERSION = '9.3.0-P2-ENTERPRISE';
const CRUD_MODULE_ID = 'panels-panel-user-management-handlers-crud';

const Ports = createUiPorts({ moduleId: CRUD_MODULE_ID });

function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
function injectPorts(p: Record<string, unknown>) { return Ports.inject(p); }
function getPorts() { return Ports.snapshot(); }

const _debug = () => { const cfg = _getPort('config'); return cfg && cfg.app && cfg.app.debug ? true : false; };
const _log = function(level: string, ...rest: any[]) { const args = rest; const logger = _getPort('logger'); if (!logger) return; if (level === 'error') { logger.error && logger.error(...[`[${MODULE_ID}]`].concat(args)); return; } if (level === 'warn') { logger.warn && logger.warn(...[`[${MODULE_ID}]`].concat(args)); return; } if (_debug()) logger.debug && logger.debug(...[`[${MODULE_ID}]`].concat(args)); };

function _handleAuthError(error: { status?: number; message?: string } | null, action: string) {
  if (error && (error.status === 401 || (error.message && error.message.indexOf('401') !== -1))) {
    metrics.authFailCount++;
    const eb = _getPort('eventBus');
    if (eb && eb.emit) eb.emit(AUTH_EVENTS.SESSION_EXPIRED, { source: MODULE_ID });
    state.setError('Sessão expirada. Faça login novamente.');
  } else if (error && error.status === 403) {
    metrics.permissionDeniedCount++;
    state.setError('Sem permissão de administrador.');
  } else {
    state.setError(error && error.message ? error.message : `Erro ao executar ${action}`);
  }
}

function loadData() {
  _initPorts();
  if (!ensureAuth('loadData')) { state.setLoading(false); return Promise.resolve(false); }
  if (!checkAction(PERMISSION_ACTIONS.VIEW)) { state.setError('Sem permissão para visualizar usuários'); state.setLoading(false); return Promise.resolve(false); }
  state.setLoading(true); state.setError(null); tracker.trackLoadStart(); metrics.loadCount++; metrics.lastActivity = Date.now();

  // @ts-expect-error TS migration - TS2554
  return Promise.all([api.getUsers(), api.getRoles()]).then(results => {
    const usersRaw = results[0]; const rolesRaw = results[1];
    const users = mapUserListToViewModel(usersRaw); const roles = mapRoleListToViewModel(rolesRaw);
    state.setUsers(users); state.setRoles(roles); tracker.trackLoadSuccess(users.length, roles.length); state.setLoading(false);
    return true;
  }).catch(error => {
    metrics.errorCount++; tracker.trackLoadError(error);
    _handleAuthError(error, 'loadData');
    state.setLoading(false); return false;
  });
}

function searchUsers(filters: Record<string, unknown>) {
  filters = filters || {};
  if (!ensureAuth('searchUsers')) return Promise.resolve();
  state.setLoading(true); const validated = validateFilters(filters);
  return api.searchUsers(validated.normalizedFilters).then((usersRaw: unknown[]) => { const users = mapUserListToViewModel(usersRaw); state.setUsers(users); state.setFilters(validated.normalizedFilters); tracker.trackSearch(validated.normalizedFilters, users.length); state.setLoading(false); }).catch((error: { status?: number; message?: string }) => { metrics.errorCount++; tracker.trackLoadError(error); _handleAuthError(error, 'searchUsers'); state.setLoading(false); });
}

function viewUser(userId: string | number) {
  if (!ensureAuth('viewUser')) return Promise.resolve();
  if (!checkAction(PERMISSION_ACTIONS.VIEW, userId)) { ui.showToast('Sem permissão para ver este usuário', 'error'); return Promise.resolve(); }
  state.setLoading(true); const canViewSessions = checkAction(PERMISSION_ACTIONS.VIEW_SESSIONS, userId);
  return Promise.all([api.getUser(userId), canViewSessions ? api.getUserSessions(userId) : Promise.resolve([]), api.getUserPreferences(userId)]).then(results => {
    const userRaw = results[0]; const sessionsRaw = results[1]; const preferences = results[2];
    const validated = validateUser(userRaw); if (!validated.valid) _log('warn', 'Dados de usuário inválidos:', validated.errors);
    const user = validated.normalizedUser || userRaw; const sessions = mapSessionListToViewModel(sessionsRaw);
    state.setSelectedUser(Object.assign({}, user, { sessions, preferences: removeSensitiveData(preferences) }));
    ui.showUserDetails(state.getSelectedUser()); tracker.trackUserSelected(userId, 'action'); state.setLoading(false);
  }).catch(error => { metrics.errorCount++; state.setError(error && error.message ? error.message : 'Erro'); state.setLoading(false); });
}

function editUser(userId: string | number, data: Record<string, unknown>) {
  if (!ensureAuth('editUser')) return Promise.resolve(false);
  if (!checkAction(PERMISSION_ACTIONS.EDIT, userId)) { state.setError('Sem permissão para editar usuários'); ui.showToast('Sem permissão para editar', 'error'); return Promise.resolve(false); }
  state.setLoading(true); const cleanData = removeSensitiveData(data) as Record<string, unknown>;
  return api.updateUser(userId, cleanData).then(() => { ui.hideUserDetails(); state.setSelectedUser(null); return loadData(); }).then(() => { const fieldsChanged = Object.keys(cleanData); tracker.trackUserUpdated(userId, fieldsChanged); ui.showToast('Usuário atualizado com sucesso', 'success'); state.setLoading(false); return true; }).catch((error: { status?: number; message?: string }) => { metrics.errorCount++; state.setError(error && error.message ? error.message : 'Erro'); ui.showToast(error && error.message ? error.message : 'Erro ao atualizar', 'error'); state.setLoading(false); return false; });
}

function createUser(userData: Record<string, unknown>) {
  if (!ensureAuth('createUser')) return Promise.resolve(false);
  if (!checkAction(PERMISSION_ACTIONS.CREATE)) { state.setError('Sem permissão para criar usuários'); ui.showToast('Sem permissão para criar', 'error'); return Promise.resolve(false); }
  state.setLoading(true);
  const cleanData = removeSensitiveData(userData) as Record<string, unknown>;
  // @ts-expect-error strict migration — TS2345
  return api.createUser(cleanData).then((newUser: Record<string, unknown>) => loadData().then(() => {
    tracker.trackUserCreated ? tracker.trackUserCreated((newUser.id as string | number) || 'new') : null;
    ui.showToast('Usuário criado com sucesso', 'success');
    state.setLoading(false);
    return true;
  })).catch((error: { status?: number; message?: string }) => {
    metrics.errorCount++;
    _handleAuthError(error, 'createUser');
    ui.showToast(error && error.message ? error.message : 'Erro ao criar usuário', 'error');
    state.setLoading(false);
    return false;
  });
}

function deleteUser(userId: string | number) {
  if (!ensureAuth('deleteUser')) return Promise.resolve(false);
  if (!checkAction(PERMISSION_ACTIONS.DELETE, userId)) { state.setError('Sem permissão para excluir usuários'); ui.showToast('Sem permissão para excluir', 'error'); return Promise.resolve(false); }
  state.setLoading(true);
  return api.deleteUser(userId).then(() => {
    state.setSelectedUser(null);
    return loadData();
  }).then(() => {
    tracker.trackUserDeleted ? tracker.trackUserDeleted(userId) : null;
    ui.showToast('Usuário excluído com sucesso', 'success');
    state.setLoading(false);
    return true;
  }).catch((error: { status?: number; message?: string }) => {
    metrics.errorCount++;
    _handleAuthError(error, 'deleteUser');
    ui.showToast(error && error.message ? error.message : 'Erro ao excluir usuário', 'error');
    state.setLoading(false);
    return false;
  });
}

function exportUsers(format: string) {
  if (!ensureAuth('exportUsers')) return Promise.resolve(false);
  if (!checkAction(PERMISSION_ACTIONS.EXPORT)) { ui.showToast('Sem permissão para exportar', 'error'); return Promise.resolve(false); }
  const currentFilters = state.getFilters();
  return api.exportUsers(currentFilters, format || 'csv').then(() => {
    tracker.trackExport ? tracker.trackExport(format || 'csv', state.getUsers().length) : null;
    ui.showToast('Exportação concluída', 'success');
    return true;
  }).catch((error: { status?: number; message?: string }) => {
    metrics.errorCount++;
    ui.showToast(error && error.message ? error.message : 'Erro ao exportar', 'error');
    return false;
  });
}

function bulkUpdateStatus(userIds: (string | number)[], newStatus: string) {
  if (!ensureAuth('bulkUpdateStatus')) return Promise.resolve(false);
  if (!checkAction(PERMISSION_ACTIONS.MANAGE_STATUS)) { ui.showToast('Sem permissão para alterar status em massa', 'error'); return Promise.resolve(false); }
  if (!userIds || userIds.length === 0) { ui.showToast('Nenhum usuário selecionado', 'warning'); return Promise.resolve(false); }
  state.setLoading(true);
  return api.bulkUpdateStatus(userIds, newStatus).then(() => loadData()).then(() => {
    tracker.trackBulkAction ? tracker.trackBulkAction('status-change', userIds.length, newStatus) : null;
    ui.showToast(`${userIds.length} usuários atualizados com sucesso`, 'success');
    state.setLoading(false);
    return true;
  }).catch((error: { status?: number; message?: string }) => {
    metrics.errorCount++;
    _handleAuthError(error, 'bulkUpdateStatus');
    ui.showToast(error && error.message ? error.message : 'Erro na operação em massa', 'error');
    state.setLoading(false);
    return false;
  });
}

function updateUserStatus(userId: string | number, newStatus: string) {
  if (!ensureAuth('updateUserStatus')) return Promise.resolve(false);
  if (!checkAction(PERMISSION_ACTIONS.EDIT, userId)) { ui.showToast('Sem permissão para alterar status', 'error'); return Promise.resolve(false); }
  state.setLoading(true);
  return api.updateUser(userId, { status: newStatus }).then(() => { ui.hideUserDetails(); state.setSelectedUser(null); return loadData(); }).then(() => { tracker.trackUserUpdated(userId, ['status']); ui.showToast(`Usuário ${newStatus === 'active' ? 'ativado' : 'desativado'} com sucesso`, 'success'); state.setLoading(false); return true; }).catch((error: { status?: number; message?: string }) => { metrics.errorCount++; ui.showToast(error && error.message ? error.message : 'Erro ao alterar status', 'error'); state.setLoading(false); return false; });
}

function resetPassword(userId: string | number) {
  if (!ensureAuth('resetPassword')) return Promise.resolve(false);
  if (!checkAction(PERMISSION_ACTIONS.RESET_PASSWORD, userId)) { state.setError('Sem permissão para resetar senhas'); ui.showToast('Sem permissão', 'error'); return Promise.resolve(false); }
  state.setLoading(true);
  return api.resetPassword(userId).then(() => { tracker.trackPasswordReset(userId); ui.showToast('Senha resetada com sucesso', 'success'); state.setLoading(false); return true; }).catch((error: { status?: number; message?: string }) => { metrics.errorCount++; state.setError(error && error.message ? error.message : 'Erro'); ui.showToast(error && error.message ? error.message : 'Erro ao resetar senha', 'error'); state.setLoading(false); return false; });
}

function assignRole(userId: string | number, roleId: string | number, roleName: string) {
  if (!ensureAuth('assignRole')) return Promise.resolve(false);
  if (!checkAction(PERMISSION_ACTIONS.MANAGE_ROLES, userId)) { state.setError('Sem permissão para atribuir roles'); ui.showToast('Sem permissão', 'error'); return Promise.resolve(false); }
  const currentUser = state.getSelectedUser() as Record<string, unknown> | null;
  const roles0 = currentUser && Array.isArray(currentUser.roles) ? (currentUser.roles[0] as Record<string, unknown>) : null;
  const fromRole: string = currentUser && currentUser.role ? String(currentUser.role) : (roles0 && roles0.name ? String(roles0.name) : 'none');
  return api.assignRole(userId, roleId).then(() => viewUser(userId)).then(() => { tracker.trackRoleChanged(userId, fromRole, roleName || String(roleId)); ui.showToast('Role atribuída com sucesso', 'success'); return true; }).catch((error: { status?: number; message?: string }) => { metrics.errorCount++; state.setError(error && error.message ? error.message : 'Erro'); ui.showToast(error && error.message ? error.message : 'Erro ao atribuir role', 'error'); return false; });
}

function terminateSession(sessionId: string | number) {
  if (!ensureAuth('terminateSession')) return Promise.resolve(false);
  const selectedUser = state.getSelectedUser() as Record<string, unknown> | null;
  const selectedUserId = selectedUser ? (selectedUser.id as string | number) : null;
  if (!checkAction(PERMISSION_ACTIONS.TERMINATE_SESSION, selectedUserId)) { state.setError('Sem permissão para encerrar sessões'); ui.showToast('Sem permissão', 'error'); return Promise.resolve(false); }
  return api.terminateSession(sessionId).then(() => { if (selectedUser && selectedUserId) return viewUser(selectedUserId); }).then(() => { tracker.trackSessionTerminated(sessionId, selectedUserId); ui.showToast('Sessão encerrada', 'success'); return true; }).catch((error: { status?: number; message?: string }) => { metrics.errorCount++; state.setError(error && error.message ? error.message : 'Erro'); ui.showToast(error && error.message ? error.message : 'Erro ao encerrar sessão', 'error'); return false; });
}

function info() { const ps = Ports.snapshot(); return { moduleId: CRUD_MODULE_ID, version: VERSION, portsInitialized: ps._initialized }; }
function healthCheck() { const ps = Ports.snapshot(); const logger = _getPort('logger'); return { status: ps._initialized ? 'HEALTHY' : 'DEGRADED', moduleId: CRUD_MODULE_ID, version: VERSION, portsInitialized: ps._initialized, checks: { crudReady: true, loggerReady: !!logger } }; }

export { loadData, searchUsers, viewUser, editUser, createUser, deleteUser, exportUsers, bulkUpdateStatus, updateUserStatus, resetPassword, assignRole, terminateSession, info, healthCheck, injectPorts, getPorts, CRUD_MODULE_ID as MODULE_ID, VERSION };
