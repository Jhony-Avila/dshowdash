// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (5.0.0-BULLETPROOF)
// ═══════════════════════════════════════════════════════════════
// MODULE: session-manager-core-tracker
// PURPOSE: Session Tracker Core v5.0.0-BULLETPROOF
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   sessionStore from ../state/store.js
//   trackSessionEvent from ../telemetry/tracker.js
//
// PROVIDES:
//   SessionTracker — exported value
//   MODULE_ID — module constant
//   VERSION — module constant
//   info() — exported function
//   healthCheck() — exported function
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

import { sessionStore } from '../state/store.js';
import { trackSessionEvent } from '../telemetry/tracker.js';

export const SessionTracker: Record<string, any> = {
  _interval: null as any,

  startTracking() { if (this._interval) clearInterval(this._interval); (sessionStore as any).setLastActivity(Date.now()); this._interval = setInterval(() => (sessionStore as any).setLastActivity(Date.now()), 60000); trackSessionEvent('session:tracking:started'); },

  stopTracking() { if (this._interval) { clearInterval(this._interval); this._interval = null; } trackSessionEvent('session:tracking:stopped'); },
  updateActivity() { (sessionStore as any).setLastActivity(Date.now()); }
};

export const MODULE_ID = 'session-manager-core-tracker';
export const VERSION = '5.0.0-BULLETPROOF';
export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { const tracking = !!SessionTracker._interval; return { status: tracking ? 'HEALTHY' : 'DEGRADED', moduleId: MODULE_ID, version: VERSION, checks: { ready: true, tracking: tracking } }; }
