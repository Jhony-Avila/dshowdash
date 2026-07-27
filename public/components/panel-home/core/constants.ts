// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.1.0)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-home
// PURPOSE: Panel Home - Constants
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   PANEL_ID — exported value
//   MODULE_ID — module constant
//   VERSION — module constant
//   CSS_PATH — exported value
//   TIME_PERIODS — exported value
//   MESSAGE_CATEGORIES — exported value
//   PRIORITIES — exported value
//   SYSTEM_STATES — exported value
//   PANEL_EVENTS — exported value
//   DEFAULTS — exported value
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

export const PANEL_ID = 'panel-home';
export const MODULE_ID = 'panel-home';
export const VERSION = '1.1.0';

export const CSS_PATH = '/components/panel-home/styles/panel-home.css';

// Períodos do dia
export const TIME_PERIODS = Object.freeze({
  DAWN: 'dawn',           // 05:00 - 05:59
  MORNING: 'morning',     // 06:00 - 11:59
  AFTERNOON: 'afternoon', // 12:00 - 17:59
  EVENING: 'evening',     // 18:00 - 20:59
  NIGHT: 'night'          // 21:00 - 04:59
});

// Categorias de mensagens
export const MESSAGE_CATEGORIES = Object.freeze({
  TEMPORAL: 'temporal',
  ACOLHIMENTO: 'acolhimento',
  ACAO: 'acao',
  CONTEXTO: 'contexto',
  ESTADO: 'estado',
  INSPIRACIONAL: 'inspiracional',
  IDLE: 'idle'
});

// Prioridades
export const PRIORITIES = Object.freeze({
  CRITICAL: 100,
  HIGH: 80,
  MEDIUM: 50,
  LOW: 20,
  MINIMAL: 10
});

// Estados do sistema
export const SYSTEM_STATES = Object.freeze({
  READY: 'ready',
  LOADING: 'loading',
  ERROR: 'error',
  DEGRADED: 'degraded',
  MAINTENANCE: 'maintenance'
});

// Eventos do painel
export const PANEL_EVENTS = Object.freeze({
  MOUNTED: 'panel-home:mounted',
  UNMOUNTED: 'panel-home:unmounted',
  READY: 'panel-home:ready',
  ERROR: 'panel-home:error',
  MESSAGE_DISPLAYED: 'panel-home:message:displayed',
  MESSAGE_NONE: 'panel-home:message:none',
  MESSAGE_EMPTY: 'panel-home:message:empty',
  REFRESH: 'panel-home:refresh',
  CONTEXT_RESOLVED: 'panel-home:context:resolved'
});

// Configurações padrão
export const DEFAULTS = Object.freeze({
  ANIMATION_DURATION: 400,
  MESSAGE_FADE_IN: 300,
  RETRY_DELAY: 5000,
  MAX_RETRIES: 3
});

export default {
  PANEL_ID,
  MODULE_ID,
  VERSION,
  CSS_PATH,
  TIME_PERIODS,
  MESSAGE_CATEGORIES,
  PRIORITIES,
  SYSTEM_STATES,
  PANEL_EVENTS,
  DEFAULTS
};
