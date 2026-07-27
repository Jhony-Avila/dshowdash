// Migrado para TypeScript: 2026-02-25
// App Permissions: Permissions Guard
// Controle de acesso baseado em permissões
// Versão: 1.0.0-ENTERPRISE

// Window types declarados em app/events/events-contracts.ts (fonte canônica)

type LevelWeights = Record<string, number>;

const getPermissionsGuardCore = () => window.PermissionsGuard || null;

export function hasPermission(permission: string): boolean {
  const guard = getPermissionsGuardCore();
  if (guard?.hasPermission) {
    return guard.hasPermission(permission);
  }
  const user = window.SessionManager?.getCurrentUser?.();
  return user?.permissions?.includes(permission) || false;
}

export function hasAnyPermission(permissions: string[] = []): boolean {
  return permissions.some((p: string) => hasPermission(p));
}

export function hasAllPermissions(permissions: string[] = []): boolean {
  return permissions.every((p: string) => hasPermission(p));
}

export function getUserLevel(): string {
  const guard = getPermissionsGuardCore();
  if (guard?.getUserLevel) {
    return String(guard.getUserLevel());
  }
  const user = window.SessionManager?.getCurrentUser?.();
  return user?.level || user?.role || 'guest';
}

export function getUserRoles(): string[] {
  const guard = getPermissionsGuardCore();
  if (guard?.getUserRoles) {
    return guard.getUserRoles();
  }
  const user = window.SessionManager?.getCurrentUser?.();
  return user?.roles || [];
}

export function isAdmin(): boolean {
  const level: string = getUserLevel();
  return ['admin', 'superadmin', 'super_admin'].includes(level);
}

export function isSuperAdmin(): boolean {
  const level: string = getUserLevel();
  return ['superadmin', 'super_admin'].includes(level);
}

export function checkAccess(requiredLevel: string): boolean {
  const levels: LevelWeights = {
    guest: 0,
    user: 1,
    editor: 2,
    manager: 3,
    admin: 4,
    superadmin: 5,
  };
  const userLevel: string = getUserLevel().toLowerCase().replace('_', '');
  return (levels[userLevel] || 0) >= (levels[requiredLevel] || 0);
}

export default {
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  getUserLevel,
  getUserRoles,
  isAdmin,
  isSuperAdmin,
  checkAccess,
};
