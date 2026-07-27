// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: animation-api/keyframes
// PURPOSE: Definições de keyframes para animações
// ───────────────────────────────────────────────────────────────
// IMPORTS: none
// EXPORTS:
//   animationKeyframes — Objeto com keyframes predefinidos
// ═══════════════════════════════════════════════════════════════
/**
 * @module AnimationAPIKeyframes
 * @description Keyframes predefinidos para Web Animations API
 * @version 1.0.0-AAA
 * @since 2025-02-02
 */
'use strict';

export const VERSION = '7.5.0-P2-ENTERPRISE';
export const MODULE_ID = 'app-shell.ui.animation-api.keyframes';

export const animationKeyframes = {
    'fade-in': [
        { opacity: 0 },
        { opacity: 1 }
    ],
    'fade-out': [
        { opacity: 1 },
        { opacity: 0 }
    ],
    'slide-in-left': [
        { transform: 'translateX(-100%)', opacity: 0 },
        { transform: 'translateX(0)', opacity: 1 }
    ],
    'slide-in-right': [
        { transform: 'translateX(100%)', opacity: 0 },
        { transform: 'translateX(0)', opacity: 1 }
    ],
    'slide-in-up': [
        { transform: 'translateY(100%)', opacity: 0 },
        { transform: 'translateY(0)', opacity: 1 }
    ],
    'slide-in-down': [
        { transform: 'translateY(-100%)', opacity: 0 },
        { transform: 'translateY(0)', opacity: 1 }
    ],
    'slide-out-left': [
        { transform: 'translateX(0)', opacity: 1 },
        { transform: 'translateX(-100%)', opacity: 0 }
    ],
    'slide-out-right': [
        { transform: 'translateX(0)', opacity: 1 },
        { transform: 'translateX(100%)', opacity: 0 }
    ],
    'scale-in': [
        { transform: 'scale(0)', opacity: 0 },
        { transform: 'scale(1)', opacity: 1 }
    ],
    'scale-out': [
        { transform: 'scale(1)', opacity: 1 },
        { transform: 'scale(0)', opacity: 0 }
    ],
    'bounce': [
        { transform: 'translateY(0)' },
        { transform: 'translateY(-20px)' },
        { transform: 'translateY(0)' },
        { transform: 'translateY(-10px)' },
        { transform: 'translateY(0)' }
    ],
    'shake': [
        { transform: 'translateX(0)' },
        { transform: 'translateX(-10px)' },
        { transform: 'translateX(10px)' },
        { transform: 'translateX(-10px)' },
        { transform: 'translateX(10px)' },
        { transform: 'translateX(0)' }
    ],
    'pulse': [
        { transform: 'scale(1)' },
        { transform: 'scale(1.05)' },
        { transform: 'scale(1)' }
    ],
    'spin': [
        { transform: 'rotate(0deg)' },
        { transform: 'rotate(360deg)' }
    ]
};
