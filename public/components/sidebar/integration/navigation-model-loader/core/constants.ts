// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (2.3.0-FIX-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: navigation-model-loader
// PURPOSE: navigation-model-loader/core/constants.js
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   MODULE_ID — module constant
//   VERSION — module constant
//   TOKENS — exported value
//   API_ENDPOINTS — exported value
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

export const MODULE_ID = 'navigation-model-loader';
export const VERSION = '2.3.0-FIX';

export const TOKENS = {
    CACHE_KEY: 'dshow_nav_model_v3',
    SESSION_KEY: 'dshow_nav_session_v3',
    CACHE_TTL: 5 * 60 * 1000,
    SESSION_TTL: 30 * 60 * 1000,
    API_TIMEOUT: 8000,
    RETRY_ATTEMPTS: 2,
    RETRY_DELAY: 1000
};

export const API_ENDPOINTS = {
    NAVIGATION_MODEL: '/api/ui/navigation.php?action=manifest'
};
