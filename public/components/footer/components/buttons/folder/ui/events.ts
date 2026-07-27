// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.1.0-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: footer-button-folder-events
// PURPOSE: Footer folder Button - Events
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   emitUIAction from ../../_shared/event-helpers.js
//   addListener, addKeyboardListener from ../../_shared/listener-helpers.js
//   BUTTON_CONFIG, ACTION_PAYLOAD from ../contracts.js
//
// PROVIDES:
//   attachEvents() — exported function
//   getMetrics() — exported function
//   info() — exported function
//   healthCheck() — exported function
//   MODULE_ID — module constant
//   VERSION — module constant
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

import { emitUIAction } from '../../_shared/event-helpers.js';
import { addListener, addKeyboardListener } from '../../_shared/listener-helpers.js';
import { BUTTON_CONFIG, ACTION_PAYLOAD } from '../contracts.js';

const MODULE_ID = 'footer-button-folder-events';
const VERSION = '1.1.0-ENTERPRISE';

let _metrics = { eventsAttached: 0, clicks: 0 };

export function attachEvents(element: HTMLElement|null, cleanups = [], onClickCallback: Function|null = null) {
  if (!element) return;
  
  _metrics.eventsAttached++;
  
  const handleClick = (e: Event) => {
    _metrics.clicks++;
    e?.preventDefault?.();
    
    emitUIAction(
      ACTION_PAYLOAD.actionId,
      MODULE_ID,
      {
        label: BUTTON_CONFIG.label,
        icon: BUTTON_CONFIG.icon,
        kind: BUTTON_CONFIG.kind,
        ...ACTION_PAYLOAD.meta
      }
    );
    
    if (typeof onClickCallback === 'function') {
      onClickCallback(e);
    }
  };
  
  addListener(element, 'click', handleClick, cleanups);
  addKeyboardListener(element, handleClick, cleanups);
  
  return cleanups;
}

export function getMetrics() { return { ..._metrics }; }
export function info() { return { moduleId: MODULE_ID, version: VERSION, metrics: getMetrics() }; }
export function healthCheck() {
  return { status: 'HEALTHY', version: VERSION, moduleId: MODULE_ID, checks: { eventsReady: true }, metrics: getMetrics() };
}

export { MODULE_ID, VERSION };
export default { attachEvents, getMetrics, info, healthCheck, VERSION, MODULE_ID };
