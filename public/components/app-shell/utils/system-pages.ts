// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: utils/system-pages-proxy
// PURPOSE: Proxy de compatibilidade para system-pages (movido)
// ───────────────────────────────────────────────────────────────
// RE-EXPORTS FROM: /app/pages/system-pages.js
// EXPORTS: MODULE_ID, VERSION, info, healthCheck, + all from source
// DEPRECATION: Use '/app/pages/system-pages.js' diretamente
// ═══════════════════════════════════════════════════════════════
/**
 * @module SystemPagesProxy
 * @description Proxy para system-pages movido para /app/pages/
 * @version 8.1.0-ENTERPRISE-AAA
 * @since 2025-02-02
 * @deprecated Importar de '/app/pages/system-pages.js'
 */
'use strict';

export const MODULE_ID = 'app-shell-system-pages-proxy';
export const VERSION = '8.1.0-ENTERPRISE-AAA';

export * from '/app/pages/system-pages.js';
export { default } from '/app/pages/system-pages.js';

export function info() {
    return {
        moduleId: MODULE_ID,
        version: VERSION,
        note: 'Proxy - use /app/pages/system-pages.js directly'
    };
}

export function healthCheck() {
    return {
        status: 'HEALTHY',
        moduleId: MODULE_ID,
        version: VERSION
    };
}
