// ═══════════════════════════════════════════════════════════════
// SHARED TYPE DEFINITIONS — public/core/types/
// ═══════════════════════════════════════════════════════════════
// PURPOSE: Interfaces globais compartilhadas entre módulos do core.
// Criado como parte da Fase 0 da migração JS → TS.
// ═══════════════════════════════════════════════════════════════
'use strict';

// ───────────────────────────────────────────────────────────────
// Logger Interface — padrão de logging usado em todo o core
// ───────────────────────────────────────────────────────────────
export interface Logger {
  info(prefix: string, ...args: unknown[]): void;
  warn(prefix: string, ...args: unknown[]): void;
  error(prefix: string, ...args: unknown[]): void;
  debug(prefix: string, ...args: unknown[]): void;
}

// ───────────────────────────────────────────────────────────────
// EventBus Interface — contrato mínimo do barramento de eventos
// ───────────────────────────────────────────────────────────────
export interface EventBus {
  on(event: string, handler: (...args: unknown[]) => void, options?: Record<string, unknown>): void;
  off(event: string, handler: (...args: unknown[]) => void): void;
  emit(event: string, ...args: unknown[]): void;
  once(event: string, handler: (...args: unknown[]) => void): void;
}

// ───────────────────────────────────────────────────────────────
// Core Window Adapter — interface mínima do adapter de janela
// ───────────────────────────────────────────────────────────────
export interface CoreWindowAdapter {
  get?(name: string): any;
  getState?(): Record<string, unknown>;
  [key: string]: unknown;
}

// ───────────────────────────────────────────────────────────────
// ReadyFlags Interface
// ───────────────────────────────────────────────────────────────
export interface ReadyFlags {
  set(flag: string, value?: boolean): void;
  get(flag: string): boolean;
  waitFor(flag: string, timeout?: number): Promise<boolean>;
  [key: string]: unknown;
}

// ───────────────────────────────────────────────────────────────
// Window Augmentation — propriedades globais do DShowDash
// ───────────────────────────────────────────────────────────────
declare global {
  interface Window {
    Core?: {
      windowAdapter?: CoreWindowAdapter;
      eventBus?: EventBus;
      [key: string]: unknown;
    };
    Governance?: Record<string, unknown>;
    ReadyFlags?: ReadyFlags;
    // Navigation
    NavigationBroker?: any;
    RouteStateService?: any;
    CommandRegistry?: any;
    RuntimePort?: any;
    HardNavService?: any;
    // Runtime / Kernel
    RuntimeContext?: any;
    ApplicationKernel?: any;
    PermissionResolver?: any;
    // UI Orchestrator
    UIOrchestrator?: any;
    CanvasEngine?: any;
    EventTimeline?: any;
    ExecutionHandler?: any;
    IntentAdapter?: any;
    ManifestState?: any;
    Main?: any;
    __ORCHESTRATOR_BRIDGES__?: any;
    // Services
    Toast?: any;
    InputPolicyManager?: any;
    // Permissions (Fase 2)
    PermissionsConfig?: any;
    CoreAuthAdapter?: any;
    GovernancePanel?: any;
  }
}

// Re-exports de tipos já definidos no core para acesso centralizado
export type { EnvelopeMeta, Envelope, HealthScore } from '../kernel/base-kernel.js';
export type { PriorityLevel } from '../js/event-bus/constants.js';
