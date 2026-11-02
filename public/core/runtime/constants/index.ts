// Migrado para TypeScript: 2026-02-25
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (3.1.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: core.runtime.constants
// PURPOSE: Barrel Export - Constantes e utilitários do runtime
// ───────────────────────────────────────────────────────────────
// @contract BARREL_FILE - Named imports para evitar colisão MODULE_ID/VERSION
// @changelog v3.1.0-P2-ENTERPRISE: Standardized DEPENDENCY CONTRACT
// @changelog v3.0.0: Melhorias #01-#30 completas
// ═══════════════════════════════════════════════════════════════
'use strict';

// ===================================================================
// CONSTANTES PURAS (named exports - MODULE_ID/VERSION excluded to avoid barrel collision)
// ===================================================================

// kernel-modes: named exports (MODULE_ID/VERSION excluded to avoid barrel collision)
export {
  KERNEL_MODES, type KernelMode,
  KERNEL_PHASES, type KernelPhase,
  AUTH_LEVELS, type AuthLevel,
  isOperationalMode, isCriticalMode, isFullUIMode,
  getModeDescription, getModeClass, getAllModes, isValidMode
} from './kernel-modes.js';

// event-names: named exports (MODULE_ID/VERSION excluded to avoid barrel collision)
export {
  RUNTIME_CONTEXT_EVENT_NAMES, type RuntimeContextEventName,
  KERNEL_EVENT_NAMES, type KernelEventName,
  KERNEL_UI_EVENT_NAMES, type KernelUiEventName,
  AUTH_EVENT_NAMES, type AuthEventName,
  HEADER_EVENT_NAMES, type HeaderEventName,
  HEADER_INTERNAL_EVENT_NAMES, type HeaderInternalEventName,
  OVERLAY_EVENT_NAMES, type OverlayEventName,
  COMPONENT_EVENT_NAMES, type ComponentEventName,
  NAVIGATION_EVENT_NAMES, type NavigationEventName,
  BOOTSTRAP_EVENT_NAMES, type BootstrapEventName,
  RESOURCE_EVENT_NAMES, type ResourceEventName,
  LAYOUT_EVENT_NAMES, type LayoutEventName,
  CAPABILITY_EVENT_NAMES, type CapabilityEventName,
  ERROR_EVENT_NAMES, type ErrorEventName,
  SNAPSHOT_EVENT_NAMES, type SnapshotEventName,
  LISTENER_TRACKER_EVENT_NAMES, type ListenerTrackerEventName,
  PLUGIN_EVENT_NAMES, type PluginEventName,
  TELEMETRY_EVENT_NAMES, type TelemetryEventName,
  SESSION_EVENT_NAMES, type SessionEventName,
  TOOLBAR_EVENT_NAMES, type ToolbarEventName,
  PANEL_EVENT_NAMES, type PanelEventName,
  FOOTER_EVENT_NAMES, type FooterEventName,
  APP_SHELL_EVENT_NAMES, type AppShellEventName,
  ALL_EVENT_NAMES, type AllEventName
} from './event-names.js';

// payload-contracts: re-exported via namespace import (MODULE_ID/VERSION excluded)
// Note: payload-contracts re-exports from ../dist/runtime.bundle.js (excluded from TS compilation)
// If specific named exports are needed, add them here after the bundle gets a .d.ts

// ===================================================================
// UTILITARIOS (tem MODULE_ID/VERSION - import como namespace)
// ===================================================================

import StructuredLoggerModule from './structured-logger.js';
import SnapshotPersistenceModule from './snapshot-persistence.js';
import EventTimeoutModule from './event-timeout.js';
import EventThrottleModule from './event-throttle.js';
import ErrorRecoveryModule from './error-recovery.js';
import CapabilityRegistryModule from './capability-registry.js';
import HandlerBaseModule from './handler-base.js';
import HealthAggregatorModule from './health-aggregator.js';
import ModeTransitionRulesModule from './mode-transition-rules.js';
import RuntimeGuardModule from './runtime-guard.js';
import SnapshotFreezeModule from './snapshot-freeze.js';
import SubscriberTrackerModule from './subscriber-tracker.js';
import PerfMarksModule from './perf-marks.js';
import SnapshotDiffModule from './snapshot-diff.js';
import DevToolsHelperModule from './devtools-helper.js';
import ReadinessTrackerModule from './readiness-tracker.js';
import RuntimeContextTestsModule from './runtime-context-tests.js';

// Handlers standalone - integracao futura nos componentes
import ContainerMainHandlerModule from './container-main-handler.js';
import NavRailHandlerModule from './navrail-handler.js';

// ===================================================================
// NAMED EXPORTS (sem colisao)
// ===================================================================

export const StructuredLogger = StructuredLoggerModule;
export const SnapshotPersistence = SnapshotPersistenceModule;
export const EventTimeout = EventTimeoutModule;
export const EventThrottle = EventThrottleModule;
export const ErrorRecovery = ErrorRecoveryModule;
export const CapabilityRegistry = CapabilityRegistryModule;
export const HandlerBase = HandlerBaseModule;
export const HealthAggregator = HealthAggregatorModule;
export const ModeTransitionRules = ModeTransitionRulesModule;
export const RuntimeGuard = RuntimeGuardModule;
export const SnapshotFreeze = SnapshotFreezeModule;
export const SubscriberTracker = SubscriberTrackerModule;
export const PerfMarks = PerfMarksModule;
export const SnapshotDiff = SnapshotDiffModule;
export const DevToolsHelper = DevToolsHelperModule;
export const ReadinessTracker = ReadinessTrackerModule;
export const RuntimeContextTests = RuntimeContextTestsModule;
export const ContainerMainHandler = ContainerMainHandlerModule;
export const NavRailHandler = NavRailHandlerModule;

// ===================================================================
// DEFAULT EXPORT AGREGADO
// Uso: import Constants from './constants/index.js'
//      Constants.HealthAggregator.aggregate()
// ===================================================================

export default {
  StructuredLogger: StructuredLoggerModule,
  SnapshotPersistence: SnapshotPersistenceModule,
  EventTimeout: EventTimeoutModule,
  EventThrottle: EventThrottleModule,
  ErrorRecovery: ErrorRecoveryModule,
  CapabilityRegistry: CapabilityRegistryModule,
  HandlerBase: HandlerBaseModule,
  HealthAggregator: HealthAggregatorModule,
  ModeTransitionRules: ModeTransitionRulesModule,
  RuntimeGuard: RuntimeGuardModule,
  SnapshotFreeze: SnapshotFreezeModule,
  SubscriberTracker: SubscriberTrackerModule,
  PerfMarks: PerfMarksModule,
  SnapshotDiff: SnapshotDiffModule,
  DevToolsHelper: DevToolsHelperModule,
  ReadinessTracker: ReadinessTrackerModule,
  RuntimeContextTests: RuntimeContextTestsModule,
  ContainerMainHandler: ContainerMainHandlerModule,
  NavRailHandler: NavRailHandlerModule
};
