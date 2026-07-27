// Migrado para TypeScript: 2026-02-25
// App Auth: Session Manager Wrapper
// Reexporta de public/components/session-manager
// Versao: 1.0.0-ENTERPRISE

// ---------------------------------------------------------------
// Interfaces
// ---------------------------------------------------------------

export interface SessionUser {
  id?: string | number;
  name?: string;
  username?: string;
  level?: string;
  role?: string;
  [key: string]: unknown;
}

export interface SessionData {
  user?: SessionUser;
  token?: string;
  expiresAt?: number;
  [key: string]: unknown;
}

// Window types declarados em app/events/events-contracts.ts (fonte canônica)

const getSessionManager = () => window.SessionManager || null;

// ---------------------------------------------------------------
// Funcoes exportadas
// ---------------------------------------------------------------

export function getSession(): SessionData | null {
  const sm = getSessionManager();
  return (sm?.getSession?.() as SessionData) || null;
}

export function isAuthenticated(): boolean {
  const sm = getSessionManager();
  return sm?.isAuthenticated?.() || false;
}

export function getCurrentUser(): SessionUser | null {
  const sm = getSessionManager();
  return sm?.getCurrentUser?.() || null;
}

export function getUserId(): string | number | null {
  const user = getCurrentUser();
  return user?.id || null;
}

export function getUserName(): string | null {
  const user = getCurrentUser();
  return user?.name || user?.username || null;
}

export function getUserLevel(): string {
  const user = getCurrentUser();
  return user?.level || user?.role || 'guest';
}

export function logout(): Promise<void> {
  const sm = getSessionManager();
  return sm?.logout?.() || Promise.resolve();
}

export function refreshSession(): Promise<SessionData | null> {
  const sm = getSessionManager();
  // @ts-expect-error strict migration — TS2322
  return sm?.refresh?.() || Promise.resolve(null);
}

// ---------------------------------------------------------------
// Default export (preserva contrato original)
// ---------------------------------------------------------------

export default {
  getSession,
  isAuthenticated,
  getCurrentUser,
  getUserId,
  getUserName,
  getUserLevel,
  logout,
  refreshSession
} as const;
