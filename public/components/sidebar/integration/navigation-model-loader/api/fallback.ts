// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (2.3.0-FIX-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: fallback
// PURPOSE: navigation-model-loader/api/fallback.js
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   track from ../telemetry/tracker.js
//
// PROVIDES:
//   FALLBACK_MODEL — exported value
//   getFallbackModel() — exported function
//   isFallbackModel — exported value
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

import { track } from '../telemetry/tracker.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export const VERSION = '7.4.0-P2-ENTERPRISE';
export const MODULE_ID = 'sidebar.integration.navigation-model-loader.api.fallback';

export const FALLBACK_MODEL = {
    version: 'fallback-1.0',
    generated: null as DynObj,
    sections: [
        {
            id: 'main',
            label: 'Principal',
            icon: 'home',
            items: [
                {
                    id: 'dashboard',
                    label: 'Dashboard',
                    icon: 'dashboard',
                    path: '/dashboard',
                    permission: null
                }
            ]
        },
        {
            id: 'admin',
            label: 'Administração',
            icon: 'settings',
            items: [
                {
                    id: 'settings',
                    label: 'Configurações',
                    icon: 'settings',
                    path: '/settings',
                    permission: 'admin'
                }
            ]
        }
    ],
    metadata: {
        isFallback: true,
        reason: 'api-unavailable'
    }
};

export const getFallbackModel = (reason = 'unknown') => {
    track('fallback:used', { reason });
    return {
        ...FALLBACK_MODEL,
        generated: Date.now(),
        metadata: {
            ...FALLBACK_MODEL.metadata,
            reason,
            generatedAt: new Date().toISOString()
        }
    };
};

export const isFallbackModel = (model: DynObj) => model?.metadata?.isFallback === true;
