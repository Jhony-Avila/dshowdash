// Migrado para TypeScript: 2026-02-25
// App Sessions: Sessions API Wrapper
// Gerenciamento de sessoes ativas
// Versao: 1.0.0-ENTERPRISE

// ---------- Interfaces ----------

export interface SessionSuccessResponse<T = unknown> {
  success: true;
  [key: string]: unknown;
  data?: T;
}

export interface SessionErrorResponse<T = unknown> {
  success: false;
  error: string;
  data?: T;
}

export type SessionListResponse =
  | SessionSuccessResponse<unknown[]>
  | SessionErrorResponse<unknown[]>;

export type SessionSingleResponse =
  | SessionSuccessResponse<unknown>
  | SessionErrorResponse<null>;

export type SessionActionResponse =
  | SessionSuccessResponse
  | SessionErrorResponse;

export type SessionHistoryResponse =
  | SessionSuccessResponse<unknown[]>
  | SessionErrorResponse<unknown[]>;

// ---------- Constants ----------

const API_BASE: string = '/api/sessions';

// ---------- API Functions ----------

export async function getSessions(): Promise<SessionListResponse> {
  try {
    const response: Response = await fetch(`${API_BASE}/list.php`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json() as SessionSuccessResponse<unknown[]>;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[SessionsAPI] getSessions error:', error);
    return { success: false, error: message, data: [] };
  }
}

export async function getActiveSession(): Promise<SessionSingleResponse> {
  try {
    const response: Response = await fetch(`${API_BASE}/current.php`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json() as SessionSuccessResponse<unknown>;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[SessionsAPI] getActiveSession error:', error);
    return { success: false, error: message, data: null };
  }
}

export async function invalidateSession(sessionId: string): Promise<SessionActionResponse> {
  try {
    const response: Response = await fetch(`${API_BASE}/invalidate.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId })
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json() as SessionSuccessResponse;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[SessionsAPI] invalidateSession error:', error);
    return { success: false, error: message };
  }
}

export async function refreshSession(): Promise<SessionActionResponse> {
  try {
    const response: Response = await fetch(`${API_BASE}/refresh.php`, { method: 'POST' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json() as SessionSuccessResponse;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[SessionsAPI] refreshSession error:', error);
    return { success: false, error: message };
  }
}

export async function getSessionHistory(userId: string | null = null): Promise<SessionHistoryResponse> {
  try {
    const url: string = userId ? `${API_BASE}/history.php?userId=${userId}` : `${API_BASE}/history.php`;
    const response: Response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json() as SessionSuccessResponse<unknown[]>;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[SessionsAPI] getSessionHistory error:', error);
    return { success: false, error: message, data: [] };
  }
}

// ---------- Default Export ----------

export interface SessionsAPIExport {
  getSessions: typeof getSessions;
  getActiveSession: typeof getActiveSession;
  invalidateSession: typeof invalidateSession;
  refreshSession: typeof refreshSession;
  getSessionHistory: typeof getSessionHistory;
}

const sessionsAPI: SessionsAPIExport = {
  getSessions,
  getActiveSession,
  invalidateSession,
  refreshSession,
  getSessionHistory
};

export default sessionsAPI;
