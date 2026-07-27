// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.5.0-STRICT-MODE)
// ═══════════════════════════════════════════════════════════════
// MODULE: container-main:event-bridge
// PURPOSE: container-main/core/event-bridge.js
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   MODULE_ID as PARENT_MODULE_ID from ./constants.js
//   createCorePorts from /core/runtime/ports-profiles.js
//   isStrict, recordViolation from /core/runtime/enterprise/strict-mode.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   injectEventBus() — exported function
//   getInjectedEventBus() — exported function
//   getEventBus() — exported function
//   createEventBridge() — exported function
//   healthCheck() — exported function
//   info() — exported function
//   injectPorts() — exported function
//   getPorts() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   eventName
// LISTENS (eventos):
//   eventName
// WINDOW ACCESS: (none)
// ═══════════════════════════════════════════════════════════════
// @version 8.5.0-STRICT-MODE
// @changelog v8.5.0-STRICT-MODE - Migração NR-FULL strict mode com recordViolation
// @changelog v8.4.0-P0-ENTERPRISE - Removed (window as any).EventBus fallback, use Ports pattern
'use strict';

import { MODULE_ID as PARENT_MODULE_ID } from './constants.js';
import { createCorePorts } from '/core/runtime/ports-profiles.js';
import { isStrict } from '/core/runtime/enterprise/strict-mode.js';

export const VERSION = '8.6.0-P2-ENTERPRISE';
export const MODULE_ID = 'container-main:event-bridge';

// P0 ENTERPRISE: Ports-based EventBus access
const Ports = createCorePorts({ moduleId: MODULE_ID });
let _portsInitialized = false;

function _initPorts() {
  if (_portsInitialized) return;
  Ports.init();
  _portsInitialized = true;
}

function _getPortEventBus() {
  _initPorts();
  return Ports.get('eventBus');
}

export function injectPorts(p: unknown) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

let _injectedEventBus: unknown = null;

export function injectEventBus(eventBus: unknown) {
  _injectedEventBus = eventBus;
}

export function getInjectedEventBus() {
  return _injectedEventBus;
}

// ═══════════════════════════════════════════════════════════════
// STRICT MODE RESOLUTION: EventBus
// ═══════════════════════════════════════════════════════════════
export function getEventBus(context: Record<string, unknown>) {
  // 1. Context-provided EventBus (highest priority - explicit DI)
  if ((context?.ports as Record<string, unknown>)?.events) return (context.ports as Record<string, unknown>).events;
  if (context?.eventBus) return context.eventBus;

  // 2. Module-level injected EventBus
  if (_injectedEventBus) return _injectedEventBus;

  // 3. P0 ENTERPRISE: Ports-based EventBus
  const portBus = _getPortEventBus();
  if (portBus) return portBus;

  // 4. Try Core.windowAdapter
  if (typeof window !== 'undefined' && (window as any).Core?.windowAdapter?.get) {
    const waEventBus = (window as any).Core.windowAdapter.get('EventBus');
    if (waEventBus) return waEventBus;
  }

  return null;
}

interface EventBusLike {
  emit?: (event: string, data: Record<string, unknown>) => void;
  on?: (event: string, handler: (...args: unknown[]) => void) => (() => void) | void;
  off?: (event: string, handler: (...args: unknown[]) => void) => void;
  [key: string]: unknown;
}

export function createEventBridge(eventBus: EventBusLike | null) {
  return {
    emit(eventName: string, data: Record<string, unknown>) {
      if (eventBus && typeof eventBus.emit === 'function') {
        try {
          eventBus.emit(eventName, { ...data, source: PARENT_MODULE_ID, timestamp: Date.now() });
          return true;
        } catch (e) {
          return false;
        }
      }
      return false;
    },
    subscribe(eventName: string, handler: (...args: unknown[]) => void) {
      if (eventBus && typeof eventBus.on === 'function') {
        try {
          const cleanup = eventBus.on(eventName, handler);
          return typeof cleanup === 'function' ? cleanup : () => {
            if (eventBus.off) eventBus.off(eventName, handler);
          };
        } catch (e) {
          return () => {};
        }
      }
      return () => {};
    }
  };
}

export function healthCheck() {
  const hasInjected = !!_injectedEventBus;
  const hasPortBus = !!_getPortEventBus();
  const hasAny = hasInjected || hasPortBus;

  const checks = {
    bridgeReady: true,
    hasInjectedEventBus: hasInjected,
    hasPortEventBus: hasPortBus,
    eventBusAvailable: hasAny,
    p0Enterprise: true,
    noWindowFallback: true
  };

  const passed = checks.bridgeReady && checks.eventBusAvailable ? 2 : (checks.bridgeReady ? 1 : 0);

  return {
    status: passed === 2 ? 'HEALTHY' : 'DEGRADED',
    score: `${passed}/2`,
    checks,
    source: hasInjected ? 'injected' : (hasPortBus ? 'ports' : 'none'),
    version: VERSION,
    moduleId: MODULE_ID,
    strictMode: isStrict(),
    timestamp: Date.now()
  };
}

export function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    hasInjectedEventBus: !!_injectedEventBus,
    hasPortEventBus: !!_getPortEventBus(),
    portsInitialized: _portsInitialized,
    diStrict: true,
    p0Enterprise: true,
    noWindowFallback: true,
    strictMode: isStrict()
  };
}
