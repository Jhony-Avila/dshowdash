// Migrado para TypeScript: 2026-02-25
// Global State: Session Slice
// Estado da sessao do usuario
// Versao: 1.0.0-ENTERPRISE

export interface SessionUser {
  readonly id: string | number;
  readonly name: string;
  readonly email: string;
  readonly [key: string]: unknown;
}

export interface SessionState {
  readonly authenticated: boolean;
  readonly user: SessionUser | null;
  readonly token: string | null;
  readonly expiresAt: string | null;
  readonly lastActivity: string | null;
  readonly loginTime: string | null;
}

export interface SessionData {
  readonly authenticated?: boolean;
  readonly user?: SessionUser | null;
  readonly token?: string | null;
  readonly expiresAt?: string | null;
  readonly lastActivity?: string | null;
  readonly loginTime?: string | null;
}

interface GlobalStateInstance {
  getState(slice: string): SessionState | undefined;
  dispatch(action: string, payload?: Record<string, unknown> | SessionData): unknown;
}

export const SESSION_SLICE = 'session' as const;

export const initialState: SessionState = {
  authenticated: false,
  user: null,
  token: null,
  expiresAt: null,
  lastActivity: null,
  loginTime: null
} as const;

export const actions = {
  SET_SESSION: 'session/set',
  CLEAR_SESSION: 'session/clear',
  UPDATE_ACTIVITY: 'session/updateActivity',
  SET_USER: 'session/setUser'
} as const;

function getGS(): GlobalStateInstance | undefined {
  return (window as unknown as { GlobalState?: GlobalStateInstance }).GlobalState;
}

export function getSessionState(): SessionState {
  const gs = getGS();
  return gs?.getState?.(SESSION_SLICE) || initialState;
}

export function isAuthenticated(): boolean {
  return getSessionState().authenticated === true;
}

export function getCurrentUser(): SessionUser | null {
  return getSessionState().user;
}

export function setSession(sessionData: SessionData): unknown {
  const gs = getGS();
  return gs?.dispatch?.(actions.SET_SESSION, sessionData);
}

export function clearSession(): unknown {
  const gs = getGS();
  return gs?.dispatch?.(actions.CLEAR_SESSION);
}

export default { SESSION_SLICE, initialState, actions, getSessionState, isAuthenticated, getCurrentUser, setSession, clearSession };
