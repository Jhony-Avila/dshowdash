// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.2.0-P18G2-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-user-notifications
// PURPOSE: Panel User Notifications - Constants
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   PANEL_EVENTS from /core/runtime/events/index.js
//
// PROVIDES:
//   EVENTS — exported value
//   MODULE_ID — module constant
//   VERSION — module constant
//   UI_ACTIONS — exported value
//   API_ENDPOINTS — exported value
//   NOTIFICATION_CHANNELS — exported value
//   NOTIFICATION_TYPES — exported value
//   info() — exported function
//   healthCheck() — exported function
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

export const MODULE_ID = 'panel-user-notifications';
export const VERSION = '9.3.0-P2-ENTERPRISE';

// P18G2: EVENTS removed - use import { PANEL_EVENTS } from '/core/runtime/events/index.js'
// Local UI actions (not EventBus events) - renamed to avoid confusion
export const UI_ACTIONS = Object.freeze({
  SETTINGS_SAVED: 'settings:saved'
});

export const API_ENDPOINTS = {
  GET_SETTINGS: '/api/users/notification-settings.php',
  SAVE_SETTINGS: '/api/users/notification-settings.php'
};

export const NOTIFICATION_CHANNELS = [
  { id: 'in_app', label: 'In-App', description: 'Notificações dentro do sistema', icon: 'bell' },
  { id: 'email', label: 'Email', description: 'Receber por email', icon: 'mail' },
  { id: 'whatsapp', label: 'WhatsApp', description: 'Em breve', icon: 'message-circle', disabled: true },
  { id: 'telegram', label: 'Telegram', description: 'Em breve', icon: 'send', disabled: true }
];

export const NOTIFICATION_TYPES = [
  { id: 'security', label: 'Segurança', description: 'Login, alterações de senha, atividades suspeitas' },
  { id: 'system', label: 'Sistema', description: 'Atualizações, manutenções programadas' },
  { id: 'operational', label: 'Operacional', description: 'Alertas de jobs, erros, integrações' }
];

export default { MODULE_ID, VERSION, UI_ACTIONS, API_ENDPOINTS, NOTIFICATION_CHANNELS, NOTIFICATION_TYPES };

export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION, checks: { constantsLoaded: true } }; }
