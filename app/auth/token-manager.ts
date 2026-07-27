// Migrado para TypeScript: 2026-02-25
// App Auth: Token Manager Wrapper
// Reexporta de public/components/session-manager/core/token.js
// Versao: 1.0.0-ENTERPRISE

// ---------------------------------------------------------------
// Interfaces
// ---------------------------------------------------------------

// Window types declarados em app/events/events-contracts.ts (fonte canônica)

const getTokenManager = () => window.TokenManager || null;

// ---------------------------------------------------------------
// Funcoes exportadas
// ---------------------------------------------------------------

export function getAccessToken(): string | null {
  const tm = getTokenManager();
  return tm?.getAccessToken?.() || localStorage.getItem('access_token') || null;
}

export function getRefreshToken(): string | null {
  const tm = getTokenManager();
  return tm?.getRefreshToken?.() || localStorage.getItem('refresh_token') || null;
}

export function setTokens(accessToken: string | null, refreshToken: string | null = null): void {
  const tm = getTokenManager();
  if (tm?.setTokens) {
    return tm.setTokens(accessToken, refreshToken);
  }
  if (accessToken) localStorage.setItem('access_token', accessToken);
  if (refreshToken) localStorage.setItem('refresh_token', refreshToken);
}

export function clearTokens(): void {
  const tm = getTokenManager();
  if (tm?.clearTokens) {
    return tm.clearTokens();
  }
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
}

export function isTokenValid(): boolean {
  const tm = getTokenManager();
  return tm?.isTokenValid?.() || !!getAccessToken();
}

export function getTokenExpiry(): number | null {
  const tm = getTokenManager();
  return tm?.getTokenExpiry?.() || null;
}

// ---------------------------------------------------------------
// Default export (preserva contrato original)
// ---------------------------------------------------------------

export default {
  getAccessToken,
  getRefreshToken,
  setTokens,
  clearTokens,
  isTokenValid,
  getTokenExpiry
} as const;
