// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (10.3.0-P18G2-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-status
// PURPOSE: Panel Status - Constants
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   PANEL_EVENTS from /core/runtime/events/index.js
//
// PROVIDES:
//   EVENTS — exported value
//   VERSION — module constant
//   MODULE_ID — module constant
//   PANEL_ID — exported value
//   REFRESH_INTERVAL — exported value
//   STATUS_LEVELS — exported value
//   STATUS_TYPES — exported value
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

export const VERSION = '9.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'panel-status';
export const PANEL_ID = 'panel-status';

export const REFRESH_INTERVAL = 30000;

export const STATUS_LEVELS = Object.freeze({ OK: 'ok', WARNING: 'warning', ERROR: 'error', UNKNOWN: 'unknown' });

export const STATUS_TYPES = Object.freeze({
  'status-database': { icon: 'database', label: 'Database', color: '#10B981', api: '/api/status/database' },
  'status-server': { icon: 'server', label: 'Servidor', color: '#3B82F6', api: '/api/status/server' },
  'status-cloud': { icon: 'cloud', label: 'Cloud', color: '#8B5CF6', api: '/api/status/cloud' },
  'status-cpu': { icon: 'cpu', label: 'CPU', color: '#F59E0B', api: '/api/status/cpu' },
  'status-memory': { icon: 'hard-drive', label: 'Memória', color: '#EF4444', api: '/api/status/memory' },
  'status-disk': { icon: 'hard-drive', label: 'Disco', color: '#6366F1', api: '/api/status/disk' },
  'status-wifi': { icon: 'wifi', label: 'Rede', color: '#14B8A6', api: '/api/status/network' },
  'status-activity': { icon: 'activity', label: 'Atividade', color: '#F97316', api: '/api/status/activity' }
});

// P18G2: EVENTS removed - use import { PANEL_EVENTS } from '/core/runtime/events/index.js'

export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION }; }

export default { VERSION, MODULE_ID, PANEL_ID, REFRESH_INTERVAL, STATUS_LEVELS, STATUS_TYPES };
