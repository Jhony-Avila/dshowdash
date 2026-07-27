// Migrado para TypeScript: 2026-02-25
// Global State: Permissions Slice
// Estado de permissoes do usuario
// Versao: 1.0.0-ENTERPRISE

export type PermissionLevel = 'guest' | 'user' | 'admin' | 'superadmin';

export interface PermissionsState {
  readonly level: PermissionLevel;
  readonly roles: readonly string[];
  readonly permissions: readonly string[];
  readonly routes: readonly string[];
  readonly features: readonly string[];
}

interface GlobalStateInstance {
  getState(slice: string): PermissionsState | undefined;
  dispatch(action: string, payload?: Record<string, unknown>): unknown;
}

export const PERMISSIONS_SLICE = 'permissions' as const;

export const initialState: PermissionsState = {
  level: 'guest',
  roles: [],
  permissions: [],
  routes: [],
  features: []
} as const;

export const actions = {
  SET_PERMISSIONS: 'permissions/set',
  CLEAR_PERMISSIONS: 'permissions/clear',
  ADD_ROLE: 'permissions/addRole',
  REMOVE_ROLE: 'permissions/removeRole'
} as const;

function getGS(): GlobalStateInstance | undefined {
  return (window as unknown as { GlobalState?: GlobalStateInstance }).GlobalState;
}

export function getPermissionsState(): PermissionsState {
  const gs = getGS();
  return gs?.getState?.(PERMISSIONS_SLICE) || initialState;
}

export function getUserLevel(): PermissionLevel {
  return getPermissionsState().level;
}

export function getUserRoles(): readonly string[] {
  return getPermissionsState().roles || [];
}

export function hasPermission(permission: string): boolean {
  const perms = getPermissionsState().permissions || [];
  return perms.includes(permission);
}

export function hasRole(role: string): boolean {
  const roles = getUserRoles();
  return roles.includes(role);
}

export function canAccessRoute(route: string): boolean {
  const routes = getPermissionsState().routes || [];
  return routes.includes(route) || routes.includes('*');
}

export default { PERMISSIONS_SLICE, initialState, actions, getPermissionsState, getUserLevel, getUserRoles, hasPermission, hasRole, canAccessRoute };
