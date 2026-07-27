// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (UNKNOWN)
// ═══════════════════════════════════════════════════════════════
// MODULE: UNKNOWN
// PURPOSE: Panel Home - Configuration
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   CONFIG — exported value
//
// RECEIVES (via init/options): (none)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

export const VERSION = '1.1.0-P2-ENTERPRISE';
export const MODULE_ID = 'panel-home.core.config';

export const CONFIG = Object.freeze({
  // Features toggles
  features: {
    contextualMessages: true,
    userGreeting: true,
    temporalAwareness: true,
    sessionContext: true,
    systemStateAwareness: true,
    animations: true,
    gracefulFallback: true
  },
  
  // Message display settings
  display: {
    fadeDuration: 300,
    minDisplayTime: 3000,
    maxMessageLength: 150
  },
  
  // Context evaluation weights
  weights: {
    systemState: 100,
    sessionState: 80,
    temporal: 60,
    category: 40,
    variation: 20
  },
  
  // Time periods configuration
  timePeriods: {
    morning: { start: 5, end: 12, label: 'manhã' },
    afternoon: { start: 12, end: 18, label: 'tarde' },
    evening: { start: 18, end: 22, label: 'noite' },
    night: { start: 22, end: 5, label: 'madrugada' }
  },
  
  // Session thresholds (in seconds)
  session: {
    newUserThreshold: 60,
    returningUserThreshold: 3600,
    idleThreshold: 300
  },
  
  // API settings
  api: {
    endpoint: '/api/ui/context-messages.php',
    timeout: 5000,
    cacheTime: 300000
  },
  
  // Fallback messages (used when DB is unavailable)
  fallbackMessages: [
    { id: 'fallback-1', text: 'Bem-vindo ao sistema', category: 'acolhimento', priority: 1 },
    { id: 'fallback-2', text: 'Ambiente pronto', category: 'estado', priority: 1 }
  ]
});

export default CONFIG;
