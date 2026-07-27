// Migrado para TypeScript: 2026-02-25
// App Auth - Central Export
// Versao: 2.0.0-ENTERPRISE

// ---------------------------------------------------------------
// Re-exports granulares (todos os named exports de cada modulo)
// ---------------------------------------------------------------

export * from './session-manager.ts';
export * from './token-manager.ts';
export * from './auth-events.ts';

// ---------------------------------------------------------------
// Default exports como named (preserva contrato original)
// ---------------------------------------------------------------

export { default as SessionManager } from './session-manager.ts';
export { default as TokenManager } from './token-manager.ts';
export { default as AuthEvents } from './auth-events.ts';

// ---------------------------------------------------------------
// Convenience re-exports (atalhos para funcoes mais usadas)
// ---------------------------------------------------------------

import SessionManagerModule from './session-manager.ts';
import TokenManagerModule from './token-manager.ts';

export const isAuthenticated: typeof SessionManagerModule.isAuthenticated = SessionManagerModule.isAuthenticated;
export const getCurrentUser: typeof SessionManagerModule.getCurrentUser = SessionManagerModule.getCurrentUser;
export const getSession: typeof SessionManagerModule.getSession = SessionManagerModule.getSession;
export const getAccessToken: typeof TokenManagerModule.getAccessToken = TokenManagerModule.getAccessToken;
