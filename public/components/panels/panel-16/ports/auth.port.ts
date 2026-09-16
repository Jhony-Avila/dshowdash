// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.2.0-P17WI-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: auth.port
// PURPOSE: Panel module
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createPanelPorts from /core/runtime/ports-profiles.js (2026-09-16)
//
// PROVIDES:
//   setAuth() — exported function
//   getAuth() — exported function
//   isAuthenticated() — exported function
//   getCurrentUser() — exported function
//   hasPermission() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (window as any).AuthService
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createPanelPorts } from '/core/runtime/ports-profiles.js';

export const MODULE_ID = 'panel-16.ports.auth.port';
export const VERSION = '9.3.1-P2-ENTERPRISE';
/**
 * Panel 16 - Auth Port
 * @module panel-16/ports/auth.port
 * @version 1.1.0-AAA
 */

let authInstance: Record<string, unknown> | null = null;

export function setAuth(auth: Record<string, unknown>) {
    authInstance = auth;
}

// Fábrica GLOBAL de ports (a mesma que index.ts usa e que enxerga o usuário logado); a porta local só é
// populada por setAuth()/injectAll(), que o shell nunca chama.
let _corePorts: { init?: () => void; get?: (name: string) => unknown } | null = null;
function _coreAuth(): Record<string, unknown> | null {
    try {
        if (!_corePorts) { _corePorts = createPanelPorts({ moduleId: MODULE_ID }) as typeof _corePorts; _corePorts?.init?.(); }
        const auth = _corePorts?.get?.('auth');
        return auth && typeof auth === 'object' ? (auth as Record<string, unknown>) : null;
    } catch { return null; }
}

export function getAuth() {
    return authInstance || _coreAuth() || (window as any).AuthService;
}

// 2026-09-16 (rodada frontend 05/16): a porta local só era populada por setAuth()/injectPorts(), que o shell nunca
// chama, e window.AuthService não existe no boot atual → isAuthenticated() devolvia false e services/api.ts
// respondia AUTH_REQUIRED SEM chamar a API (painel abria o login com sessão válida). Mesma classe de bug da
// dívida "ports locais de auth". Fallback = o mesmo caminho sancionado que index.ts já usa: SessionManager via
// window.Core.windowAdapter (sem tocar em window.SessionManager direto, que o strict-mode acusa).
function _sessionManagerFallback(): boolean | undefined {
    if (typeof window === 'undefined') return undefined;
    const adapter = (window as any).Core?.windowAdapter;
    if (!adapter?.get) return undefined;
    const sm = adapter.get('SessionManager');
    if (typeof sm?.isAuthenticated !== 'function') return undefined;
    return !!sm.isAuthenticated();
}

export function isAuthenticated() {
    const auth = getAuth();
    const viaPort = auth?.isAuthenticated?.();
    if (typeof viaPort === 'boolean') return viaPort;
    return _sessionManagerFallback() ?? false;
}

export function getCurrentUser() {
    const auth = getAuth();
    return auth?.getCurrentUser?.() ?? null;
}

export function hasPermission(permission: string) {
    const auth = getAuth();
    return auth?.hasPermission?.(permission) ?? false;
}

export default { setAuth, getAuth, isAuthenticated, getCurrentUser, hasPermission };

// Alias export — satisfies: import { AuthPort } from './auth.port'
export const AuthPort = { setAuth, getAuth, isAuthenticated, getCurrentUser, hasPermission };
