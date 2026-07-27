// Migrado para TypeScript: 2026-02-25
// App Permissions: Routes Access
// Controle de acesso a rotas
// Versao: 1.0.0-ENTERPRISE

import { getUserLevel, hasPermission, isAdmin } from './permissions-guard.ts';

// ---------------------------------------------------------------------------
// Interfaces
// ---------------------------------------------------------------------------

/** Mapa de niveis para peso numerico */
type LevelWeights = Record<string, number>;

/** Rota retornada por RouterGlobal.getRoutes */
interface RouteEntry {
  path: string;
  [key: string]: unknown;
}

/** Contrato do RouterGlobal exposto em window */
interface RouterGlobalContract {
  getRoutes?(): RouteEntry[];
}

// Window types declarados em app/events/events-contracts.ts (fonte canônica)

// ---------------------------------------------------------------------------
// Constantes
// ---------------------------------------------------------------------------

/** Rotas publicas (sem autenticacao) */
const PUBLIC_ROUTES: readonly string[] = [
  '/login',
  '/logout',
  '/404',
  '/forbidden',
  '/maintenance',
] as const;

/** Rotas por nivel minimo */
const ROUTE_LEVELS: Readonly<Record<string, string>> = {
  '/admin/usuarios': 'admin',
  '/admin/permissoes': 'superadmin',
  '/admin/sessoes': 'admin',
  '/admin/auditoria': 'admin',
  '/configuracoes': 'manager',
} as const;

/** Rotas por permissao especifica */
const ROUTE_PERMISSIONS: Readonly<Record<string, string>> = {
  '/admin/usuarios': 'users.manage',
  '/admin/permissoes': 'permissions.manage',
  '/admin/sessoes': 'sessions.view',
  '/admin/auditoria': 'audit.view',
} as const;

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

export function isPublicRoute(path: string): boolean {
  return (PUBLIC_ROUTES as readonly string[]).includes(path);
}

export function canAccessRoute(path: string): boolean {
  if (isPublicRoute(path)) return true;
  if (isAdmin()) return true;

  const requiredLevel: string | undefined = ROUTE_LEVELS[path];
  if (requiredLevel) {
    const levels: LevelWeights = {
      guest: 0,
      user: 1,
      editor: 2,
      manager: 3,
      admin: 4,
      superadmin: 5,
    } as const;
    const userLevel: string = getUserLevel().toLowerCase().replace('_', '');
    if ((levels[userLevel] || 0) < (levels[requiredLevel] || 0)) {
      return false;
    }
  }

  const requiredPermission: string | undefined = ROUTE_PERMISSIONS[path];
  if (requiredPermission && !hasPermission(requiredPermission)) {
    return false;
  }

  return true;
}

export function getAccessDeniedReason(path: string): string | null {
  if (isPublicRoute(path)) return null;

  const requiredLevel: string | undefined = ROUTE_LEVELS[path];
  if (requiredLevel) {
    const levels: LevelWeights = {
      guest: 0,
      user: 1,
      editor: 2,
      manager: 3,
      admin: 4,
      superadmin: 5,
    } as const;
    const userLevel: string = getUserLevel().toLowerCase().replace('_', '');
    if ((levels[userLevel] || 0) < (levels[requiredLevel] || 0)) {
      return `Requer nível ${requiredLevel}`;
    }
  }

  const requiredPermission: string | undefined = ROUTE_PERMISSIONS[path];
  if (requiredPermission && !hasPermission(requiredPermission)) {
    return `Requer permissão ${requiredPermission}`;
  }

  return null;
}

export function getAuthorizedRoutes(): RouteEntry[] {
  const routes: RouteEntry[] = window.RouterGlobal?.getRoutes?.() || [];
  return routes.filter((r: RouteEntry) => canAccessRoute(r.path));
}

// ---------------------------------------------------------------------------
// Default export
// ---------------------------------------------------------------------------

export default {
  isPublicRoute,
  canAccessRoute,
  getAccessDeniedReason,
  getAuthorizedRoutes,
  PUBLIC_ROUTES,
};
