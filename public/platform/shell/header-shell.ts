// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (3.2.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: platform-header-shell
// PURPOSE: Header Shell
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   from /core/runtime/events/index.js
//
// PROVIDES:
//   VERSION
//   MODULE_ID
//   init
//   mount
//   unmount
//   isMounted
//   info
//   default export
// ═══════════════════════════════════════════════════════════════
'use strict';

import { SHELL_EVENTS } from '/core/runtime/events/catalog/shell.events.js';

const VERSION = '3.2.0-P2-ENTERPRISE';
const MODULE_ID = 'platform-header-shell';

let _mounted = false;
let _eventBus: { emit: (event: string, data?: Record<string, unknown>) => void } | null = null;

function init(context: { eventBus?: { emit: (event: string, data?: Record<string, unknown>) => void } }) {
  if (!context) context = {};
  _eventBus = context.eventBus || null;
  return { version: VERSION, moduleId: MODULE_ID };
}

function mount(container: Element) {
  if (_mounted) return true;
  _mounted = true;
  _emit(SHELL_EVENTS.HEADER_MOUNTED);
  return true;
}

function unmount() {
  _mounted = false;
  _emit(SHELL_EVENTS.HEADER_UNMOUNTED);
  return true;
}

function isMounted() { return _mounted; }

function _emit(event: string, data?: Record<string, unknown>) {
  if (!data) data = {};
  if (_eventBus && _eventBus.emit) _eventBus.emit(event, Object.assign({}, data, { source: MODULE_ID, timestamp: Date.now() }));
}

function info() { return { version: VERSION, moduleId: MODULE_ID, mounted: _mounted }; }

export { VERSION, MODULE_ID, init, mount, unmount, isMounted, info };
export default { VERSION, MODULE_ID, init, mount, unmount, isMounted, info };
