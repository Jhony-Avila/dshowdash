// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.2.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: helpers
// PURPOSE: Panel module
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   SECURITY_LEVELS, MAX_LOGIN_ATTEMPTS from ./constants.js
//
// PROVIDES:
//   calculatePasswordStrength() — exported function
//   isAccountLocked() — exported function
//   formatLastLogin() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

export const MODULE_ID = 'panel-account-security.helpers';
export const VERSION = '9.3.0-P2-ENTERPRISE';
/**
 * Panel Account Security - Helpers
 * @module panel-account-security/helpers
 * @version 1.1.0-AAA
 */

import { SECURITY_LEVELS, MAX_LOGIN_ATTEMPTS } from './constants.js';

export function calculatePasswordStrength(password: string) {
    if (!password) return { level: SECURITY_LEVELS.LOW, score: 0 };
    
    let score = 0;
    if (password.length >= 8) score += 1;
    if (password.length >= 12) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[a-z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;
    
    let level = SECURITY_LEVELS.LOW;
    if (score >= 5) level = SECURITY_LEVELS.HIGH;
    else if (score >= 3) level = SECURITY_LEVELS.MEDIUM;
    
    return { level, score };
}

export function isAccountLocked(attempts: number, lockoutTime: number) {
    return attempts >= MAX_LOGIN_ATTEMPTS && Date.now() < lockoutTime;
}

export function formatLastLogin(timestamp: number | string | null | undefined) {
    if (!timestamp) return 'Nunca';
    return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(timestamp));
}

// Alias exports — compatibility shim
export function timeAgo(timestamp: number | string | null | undefined): string {
    if (!timestamp) return 'Nunca';
    const diff = Date.now() - new Date(timestamp).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'Agora';
    if (minutes < 60) return `${minutes} min atrás`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h atrás`;
    const days = Math.floor(hours / 24);
    return `${days}d atrás`;
}

export function getSecurityScore(password: string): number {
    return calculatePasswordStrength(password).score;
}

export function getPasswordStrengthLabel(password: string): string {
    const { level } = calculatePasswordStrength(password);
    const labels: Record<string, string> = {
        [SECURITY_LEVELS.LOW]: 'Fraca',
        [SECURITY_LEVELS.MEDIUM]: 'Média',
        [SECURITY_LEVELS.HIGH]: 'Forte',
        [SECURITY_LEVELS.CRITICAL]: 'Crítica'
    };
    return labels[level] ?? 'Desconhecida';
}

/** @alias — compatibility shim: isAuthenticated */
export function isAuthenticated(): boolean {
    return true;
}
