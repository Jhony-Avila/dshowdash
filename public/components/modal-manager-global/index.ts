// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.5.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: components.modal-manager-global
// PURPOSE: Global modal manager with stack management and accessibility
// ───────────────────────────────────────────────────────────────
// @contract INIT - init(options) initializes modal manager
// @contract SHUTDOWN - shutdown() shuts down modal manager
// @contract RESET - reset() resets modal manager
// @contract OPEN - open(descriptor) opens a modal
// @contract UPDATE - update(id, patch) updates a modal
// @contract CLOSE - close(id, reason) closes a modal
// @contract CLOSE_ALL - closeAll(options) closes all modals
// @contract CONFIRM - confirm(title, message, options) shows confirm dialog
// @contract ALERT - alert(title, message, options) shows alert dialog
// @contract GET_STACK - getStack(filter) gets modal stack
// @contract GET_MODAL - getModal(id) gets modal by id
// @contract ON_CHANGE - onChange(handler) subscribes to changes
// @contract PORTS - injectPorts()/getPorts() for dependency injection
// @contract HEALTH - healthCheck() and info() for observability
// ───────────────────────────────────────────────────────────────
// IMPORTS: createCorePorts from /core/runtime/ports-profiles.js
// IMPORTS: isStrict, recordViolation from /core/runtime/enterprise/strict-mode.js
// IMPORTS: Store, Contracts, Helpers, Engine, Accessibility, Keyboard,
//          Lifecycle, Container, Renderer, Tracker, ConfirmAPI, LegacyAdapter
// PROVIDES: ModalManager, init, shutdown, reset, open, update, close, closeAll,
//           confirm, alert, danger, getStack, getModal, getTop, isOpen, hasBlocking,
//           onChange, status, info, healthCheck, getVersion, injectPorts, getPorts,
//           VERSION, MODULE_ID
// @changelog v1.5.0-P2-ENTERPRISE: Standardized DEPENDENCY CONTRACT header
// @changelog v1.4.0-STRICT-MODE: Strict mode migration
// @changelog v1.3.0-ENTERPRISE: ES6 modernization
// @changelog v1.2.2-ENTERPRISE: ES5 conversion
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createCorePorts } from '/core/runtime/ports-profiles.js';
import { isStrict, recordViolation } from '/core/runtime/enterprise/strict-mode.js';

const VERSION = '1.5.0-P2-ENTERPRISE';
const MODULE_ID = 'modal-manager-global';

import Store from './state/store.js';
import * as Contracts from './utils/contracts.js';
import * as Helpers from './utils/helpers.js';
import * as Engine from './core/engine.js';
import * as Accessibility from './core/accessibility.js';
import * as _Keyboard from './core/keyboard.js';
import * as _Lifecycle from './core/lifecycle.js';
import * as Container from './ui/container.js';
import * as Renderer from './ui/renderer.js';
import * as _Tracker from './telemetry/tracker.js';
import * as _ConfirmAPI from './api/confirm.js';
import * as _LegacyAdapter from './shim/legacy-adapter.js';

const Keyboard = _Keyboard as any;
const Lifecycle = _Lifecycle as any;
const Tracker = _Tracker as any;
const ConfirmAPI = _ConfirmAPI as any;
const LegacyAdapter = _LegacyAdapter as any;

const Ports = createCorePorts({ moduleId: MODULE_ID });
const _initPorts = () => Ports.init();
const _getPort = (name: string) => Ports.get(name);
export const injectPorts = (p: Record<string, unknown>) => Ports.inject(p);
export const getPorts = () => Ports.snapshot();

const init = (options: { legacyAdapter?: boolean } & Record<string, unknown> = {}) => {
  _initPorts();
  return Lifecycle.init(options).then((result: Record<string, unknown>) => {
    if (result.ok && options.legacyAdapter !== false) {
      try { LegacyAdapter.init({ registerCallback: (modalInfo: Record<string, unknown>) => Tracker.trackEvent('legacy:registered', modalInfo) }); }
      catch (err: unknown) { Tracker.trackEvent('legacy:init-error', { error: (err as Error).message }); }
    }
    return result;
  });
};

const isInitialized = () => Lifecycle.isInitialized();
const shutdown = () => { try { LegacyAdapter.shutdown(); } catch (err) {} return Lifecycle.shutdown(); };
const reset = () => Lifecycle.reset();

const open = (descriptor: Record<string, unknown>) => { const result = Engine.open(descriptor); if (result.ok) Tracker.trackOpen(result.id, descriptor.type || 'dialog', descriptor.owner || 'unknown'); return result; };
const update = (id: string, patch: Record<string, unknown>) => Engine.update(id, patch);
const close = (id: string, reason = 'manual') => { const result = Engine.close(id, reason); if (result.ok && result.wasOpen) Tracker.trackClose(id, reason); return result; };
const confirmModal = (id: string, result = true) => Engine.confirm(id, result);
const cancel = (id: string) => Engine.cancel(id);
const closeAll = (options = {}) => Engine.closeAll(options);

const confirm = (title: string, message: string, options: Record<string, unknown> = {}) => ConfirmAPI.confirm(title, message, options);
const alert = (title: string, message: string, options: Record<string, unknown> = {}) => ConfirmAPI.alert(title, message, options);
const danger = (title: string, message: string, options: Record<string, unknown> = {}) => ConfirmAPI.danger(title, message, options);

// @ts-expect-error strict migration — TS2345
const getStack = (filter: Record<string, unknown> | null = null) => Engine.getStack(filter);
const getModal = (id: string) => Engine.getModal(id);
const getTop = () => Engine.getTop();
const isOpen = (id: string) => Engine.isOpen(id);
const hasBlocking = () => Engine.hasBlocking();

const getLegacyModals = () => LegacyAdapter.info().legacyModals || [];
const detectLegacyModals = () => LegacyAdapter.detectLegacyModals();

const onChange = (handler: (state: Record<string, unknown>) => void) => Store.subscribe(handler);

const status = () => {
  const lifecycle = Lifecycle.getLifecycleInfo();

  // @ts-expect-error TS migration - TS2339
  const metrics = Store.getMetrics();
  const legacyInfo = LegacyAdapter.info();
  return { initialized: lifecycle.initialized, activeCount: metrics.activeCount, hasBlocking: metrics.hasBlocking, bodyScrollLocked: metrics.bodyScrollLocked, topModal: Engine.getTop()?.id || null, legacyModalsDetected: legacyInfo.legacyModals?.length || 0 };
};

const groupStackByType = () => { const stack = Engine.getStack(); const byType: Record<string, string[]> = {}; stack.forEach((modal: Record<string, unknown>) => { const type = modal.type as string; if (!byType[type]) byType[type] = []; byType[type].push(modal.id as string); }); return byType; };

const info = () => {
  const lifecycle = Lifecycle.getLifecycleInfo();

  // @ts-expect-error TS migration - TS2339
  const metrics = Store.getMetrics();
  const trackerStats = Tracker.getStats();
  const legacyInfo = LegacyAdapter.info();

  // @ts-expect-error TS migration - TS2551
  return { name: MODULE_ID, version: VERSION, status: lifecycle.initialized ? 'READY' : 'NOT_INITIALIZED', initialized: lifecycle.initialized, portsInitialized: Ports.isInitialized(), stack: { count: metrics.activeCount, hasBlocking: metrics.hasBlocking, top: Engine.getTop(), byType: groupStackByType() }, metrics, lifecycle, telemetry: trackerStats, legacy: legacyInfo, components: { store: Store.getVersion(), contracts: Contracts.getVersion(), helpers: Helpers.getVersion(), engine: Engine.getVersion(), accessibility: Accessibility.getVersion(), keyboard: Keyboard.getVersion(), lifecycle: Lifecycle.getVersion(), container: Container.getVersion(), renderer: Renderer.getVersion(), tracker: Tracker.getVersion(), confirmAPI: ConfirmAPI.getVersion(), legacyAdapter: LegacyAdapter.getVersion() } };
};

const healthCheck = () => {
  const lifecycle = Lifecycle.getLifecycleInfo();
  const containerState = Container.getState();
  const legacyInfo = LegacyAdapter.info();
  const issues = [];
  if (!lifecycle.initialized) issues.push('Not initialized');
  if (!containerState.mounted) issues.push('Container not mounted');
  if (lifecycle.lastError) issues.push(`Last error: ${lifecycle.lastError}`);
  const checks = { initialized: lifecycle.initialized, containerMounted: containerState.mounted, storeAvailable: !!Store, engineAvailable: !!Engine, keyboardEnabled: Keyboard.getState().enabled, accessibilityReady: Accessibility.getState().hasFocusTrap !== undefined, confirmAPIReady: !!ConfirmAPI, legacyAdapterReady: legacyInfo.initialized, portsInitialized: Ports.isInitialized() };
  const passedChecks = Object.values(checks).filter(Boolean).length;
  const totalChecks = Object.keys(checks).length;
  let healthStatus = 'UNHEALTHY';
  if (passedChecks === totalChecks) healthStatus = 'HEALTHY';
  else if (passedChecks >= totalChecks * 0.7) healthStatus = 'DEGRADED';
  return { status: healthStatus, score: `${passedChecks}/${totalChecks}`, healthy: healthStatus === 'HEALTHY', version: VERSION, moduleId: MODULE_ID, initialized: lifecycle.initialized, portsInitialized: Ports.isInitialized(), issues: issues.length > 0 ? issues : null, checks, legacy: { detected: legacyInfo.legacyModals?.length || 0, observing: legacyInfo.observing }, timestamp: new Date().toISOString(), p24Instrumented: true };
};

const getVersion = () => VERSION;

const debug = {
  getStore: () => Store.getState(), getEventLog: () => Tracker.getEvents(), getTrackerStats: () => Tracker.getStats(), getContainerState: () => Container.getState(), getKeyboardState: () => Keyboard.getState(), getAccessibilityState: () => Accessibility.getState(), getLifecycleInfo: () => Lifecycle.getLifecycleInfo(), getLegacyInfo: () => LegacyAdapter.info(),
  MODAL_TYPES: Contracts.MODAL_TYPES, MODAL_SIZES: Contracts.MODAL_SIZES,

  // @ts-expect-error TS migration - TS2551
  versions: { main: VERSION, store: Store.getVersion(), contracts: Contracts.getVersion(), helpers: Helpers.getVersion(), engine: Engine.getVersion(), accessibility: Accessibility.getVersion(), keyboard: Keyboard.getVersion(), lifecycle: Lifecycle.getVersion(), container: Container.getVersion(), renderer: Renderer.getVersion(), tracker: Tracker.getVersion(), confirmAPI: ConfirmAPI.getVersion(), legacyAdapter: LegacyAdapter.getVersion() }
};

const ModalManager = { init, isInitialized, shutdown, reset, open, update, close, confirmModal, cancel, closeAll, confirm, alert, danger, getLegacyModals, detectLegacyModals, getStack, getModal, getTop, isOpen, hasBlocking, onChange, status, info, healthCheck, getVersion, injectPorts, getPorts, debug };

if (typeof window !== 'undefined') {
  const strictMode = isStrict();
  if (!strictMode) {
    (window as any).ModalManager = ModalManager;
    (window as any).ModalManagerVersion = VERSION;
    Tracker.trackEvent('global:exposed', { version: VERSION });
  } else {
    recordViolation('GLOBAL_EXPOSURE_BLOCKED', { module: MODULE_ID, target: 'window.ModalManager' });
    Tracker.trackEvent('global:strict-mode-blocked', { version: VERSION });
  }
  // DevTools sempre permitido
  if ((window as any).__DSHOW_DEVTOOLS__) {
    (window as any).__DSHOW_DEVTOOLS__.ModalManager = ModalManager;
  }
}

export { ModalManager, VERSION, MODULE_ID };
export default ModalManager;
