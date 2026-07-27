// ═══════════════════════════════════════════════════════════════
// SHARED TYPE DEFINITIONS — components/main/types.ts
// ═══════════════════════════════════════════════════════════════
// PURPOSE: Interfaces compartilhadas entre módulos do main component.
// Parte da migração noImplicitAny (strict mode).
// ═══════════════════════════════════════════════════════════════
'use strict';

import type { EventBus, Logger } from '/core/types/index.js';

// ───────────────────────────────────────────────────────────────
// PortsContainer — dependency injection via ports-factory
// ───────────────────────────────────────────────────────────────
export interface PortsContainer {
  init(): boolean;
  inject(ports: Record<string, unknown>): boolean;
  get(portName: string, options?: { required?: boolean }): unknown;
  getStrict(portName: string): unknown;
  has(portName: string): boolean;
  validateRequired(): ValidateRequiredResult;
  snapshot(): Record<string, unknown>;
  isInitialized(): boolean;
  reset(): boolean;
  info(): PortsInfoResult;
  healthCheck(): PortsHealthCheckResult;
  moduleId: string;
}

export interface ValidateRequiredResult {
  valid: boolean;
  missing: string[];
  resolved: string[];
}

export interface PortsInfoResult {
  moduleId: string;
  factoryVersion: string;
  factoryModuleId: string;
  initialized: boolean;
  initTimestamp: number | null;
  specPorts: string[];
  resolvedPorts: string[];
  resolvedCount: number;
  totalPorts: number;
  requiredPorts: string[];
  missingRequired: string[];
  injectCount: number;
  resolveCount: number;
  allowWindowFallback: boolean;
  strictMode: boolean;
  p24Instrumented: boolean;
  timestamp: number;
}

export interface PortsHealthCheckResult {
  status: HealthStatus;
  score: number;
  maxScore: number;
  scoreDisplay: string;
  checks: Record<string, boolean>;
  moduleId: string;
  factoryVersion: string;
  resolvedPorts: number;
  totalPorts: number;
  requiredPorts: number;
  requiredResolved: number;
  missingRequired: string[];
  strictMode: boolean;
  p24Instrumented: boolean;
  timestamp: number;
}

export interface CreatePortsOptions {
  moduleId?: string;
  spec?: Record<string, string | ((win: Window) => unknown) | undefined>;
  defaults?: Record<string, unknown>;
  allowWindowFallback?: boolean;
  required?: string[];
}

// ───────────────────────────────────────────────────────────────
// Health / Info / Metrics — observability pattern
// ───────────────────────────────────────────────────────────────
export type HealthStatus = 'HEALTHY' | 'DEGRADED' | 'UNHEALTHY';

export interface HealthCheckResult {
  status: HealthStatus;
  score?: number;
  maxScore?: number;
  moduleId: string;
  version: string;
  checks?: Record<string, HealthCheck | boolean | string | number>;
  metrics?: Record<string, unknown>;
  timestamp?: number;
  strictMode?: boolean;
  p21Compliant?: boolean;
}

export interface HealthCheck {
  ok: boolean;
  severity?: 'crit' | 'warn' | 'info';
}

export interface InfoResult {
  moduleId: string;
  version: string;
  timestamp?: number;
  metrics?: Record<string, unknown>;
  strictMode?: boolean;
  p21Compliant?: boolean;
  [key: string]: unknown;
}

// ───────────────────────────────────────────────────────────────
// MainState — estado central do componente main (_entry.ts)
// ───────────────────────────────────────────────────────────────
export interface MainEngine {
  navigate(route: string | RouteTarget, options?: Record<string, unknown>): Promise<unknown>;
  unmount(): Promise<boolean>;
  openSecondary(panelId: string, options?: Record<string, unknown>): Promise<unknown>;
  closeSecondary(containerId?: string | null): Promise<boolean>;
  toggleContainerFocus(containerId: string): boolean;
  getContainerSnapshot?(): Record<string, unknown>;
  restoreContainerSnapshot?(snapshotData: Record<string, unknown>): Promise<boolean>;
  clearContainerSnapshot?(): boolean;
  getState?(): Record<string, unknown>;
  lifecycle?(): unknown;
  getManifestController?(): unknown;
  getLayoutController?(): unknown;
  getCanvasController?(): unknown;
  getTimelineController?(): unknown;
  getOrchestratorController?(): unknown;
  getGlobalStateV2?(): unknown;
  getMultiContainerOrchestrator?(): MultiContainerOrchestrator;
  [key: string]: unknown;
}

export interface MultiContainerOrchestrator {
  getCurrentLayout?(): string;
  getActiveContainerIds?(): string[];
  getPrimaryContainerId?(): string;
  [key: string]: unknown;
}

export interface ActionHub {
  dispatch(action: ActionPayload): unknown;
  getHistory?(): ActionPayload[];
  [key: string]: unknown;
}

export interface ActionPayload {
  type?: string;
  [key: string]: unknown;
}

export interface ContainerAdapter {
  snapshot?(): Record<string, unknown>;
  setPolicy?(policy: string): boolean;
  getPolicy?(): string;
  list?(): string[];
  mount?(containerId: string, options?: Record<string, unknown>): unknown;
  unmount?(containerId: string): boolean;
  get?(containerId: string): ContainerInstance | null;
  create?(containerId: string, options?: Record<string, unknown>): ContainerInstance;
  destroy?(containerId: string): boolean;
  [key: string]: unknown;
}

export interface ContainerInstance {
  id: string;
  contentEl?: HTMLElement;
  [key: string]: unknown;
}

export interface EventBusAdapter extends EventBus {
  emit(event: string, ...args: unknown[]): void;
  on(event: string, handler: EventHandler, options?: Record<string, unknown>): void | (() => void);
  off(event: string, handler: EventHandler): void;
  once(event: string, handler: EventHandler): void;
  [key: string]: unknown;
}

export type EventHandler = (...args: unknown[]) => void;

export interface GlobalMetrics {
  initCount: number;
  destroyCount: number;
  navigationCount: number;
  navigationErrors: number;
  circuitBreakerTrips: number;
  lastActivity: number | null;
}

export interface MainState {
  version: string;
  engine: MainEngine | null;
  actionHub: ActionHub | null;
  initialized: boolean;
  context: Record<string, unknown> | null;
  eventBusAdapter: EventBusAdapter | null;
  containerAdapter: ContainerAdapter | null;
  containerPort: unknown;
  primaryContainer: ContainerInstance | null;
  initTimestamp: number | null;
  adapters: Record<string, unknown>;
  ports: Record<string, unknown>;
  globalMetrics: GlobalMetrics;
  runtimeContextSetup: boolean;
  [key: string]: unknown;
}

export interface RouteTarget {
  panelId: string;
  [key: string]: unknown;
}

// ───────────────────────────────────────────────────────────────
// CircuitBreaker — proteção contra falhas recorrentes
// ───────────────────────────────────────────────────────────────
export interface CircuitBreaker {
  recordFailure(panelId: string): boolean;
  isOpen(panelId: string): boolean;
  reset(panelId: string): void;
  resetAll(): void;
  getStatus(): Record<string, CircuitBreakerStatus>;
  getOpenCount(): number;
  getTotalFailures(): number;
  getMetrics(): CircuitBreakerMetrics;
  info(): Record<string, unknown>;
  execute<T>(panelId: string, fn: () => Promise<T>, fallback?: () => T): Promise<T>;
  healthCheck(): HealthCheckResult;
}

export interface CircuitBreakerStatus {
  failures: number;
  isOpen: boolean;
  lastFailure: number;
  willResetAt: number;
}

export interface CircuitBreakerMetrics {
  trackedPanels: number;
  openCircuits: number;
  currentFailures: number;
  totalRecordedFailures: number;
  totalResets: number;
  threshold: number;
  resetTimeout: number;
}

export interface CircuitBreakerOptions {
  threshold?: number;
  resetTimeout?: number;
}

// ───────────────────────────────────────────────────────────────
// Feature system — kernel feature management
// ───────────────────────────────────────────────────────────────
export interface FeatureDefinition {
  id: string;
  version?: string;
  category?: string;
  priority?: number;
  dependencies?: string[];
  init?(options?: Record<string, unknown>): void | Promise<void>;
  cleanup?(reason?: string): void;
  destroy?(reason?: string): void;
  healthCheck?(): HealthCheckResult;
  info?(): InfoResult;
  getMetrics?(): Record<string, unknown>;
  [key: string]: unknown;
}

export interface FeatureStatus {
  id: string;
  version: string;
  status: 'registered' | 'enabled' | 'disabled' | 'degraded' | 'error';
  category: string;
  priority: number;
  registeredAt?: number;
  enabledAt?: number;
  disabledAt?: number;
  initDurationMs?: number;
}

export interface FeatureMetrics {
  enableCount: number;
  disableCount: number;
  errorCount: number;
  lastEnabled?: number;
  lastDisabled?: number;
  totalInitTime: number;
}

// ───────────────────────────────────────────────────────────────
// Envelope — standard response wrapper
// ───────────────────────────────────────────────────────────────
export interface Envelope<T = unknown> {
  ok: boolean;
  data?: T;
  errors?: Array<{ code: string; message: string }>;
  meta?: EnvelopeMeta;
}

export interface EnvelopeMeta {
  moduleId: string;
  version: string;
  timestamp: string;
  status?: string;
}

// ───────────────────────────────────────────────────────────────
// Adapter Init Context — padrão de inicialização
// ───────────────────────────────────────────────────────────────
export interface InitContext {
  moduleId?: string;
  ports?: Record<string, unknown>;
  containerId?: string;
  [key: string]: unknown;
}

export interface InitResult {
  ok: boolean;
  version: string;
  [key: string]: unknown;
}

// ───────────────────────────────────────────────────────────────
// Auth Adapter
// ───────────────────────────────────────────────────────────────
export interface AuthToken {
  value: string;
  expiresAt?: number;
  [key: string]: unknown;
}

export interface AuthUser {
  id: string;
  name?: string;
  email?: string;
  roles?: string[];
  capabilities?: string[];
  [key: string]: unknown;
}

export interface AuthCache {
  user: AuthUser | null;
  token: AuthToken | null;
  capabilities: string[];
  [key: string]: unknown;
}

// ───────────────────────────────────────────────────────────────
// DOM Adapter
// ───────────────────────────────────────────────────────────────
export interface DOMAdapterOptions {
  containerId?: string;
  [key: string]: unknown;
}

// ───────────────────────────────────────────────────────────────
// Config / Kernel
// ───────────────────────────────────────────────────────────────
export interface KernelConfig {
  features?: Record<string, boolean | FeatureConfig>;
  logging?: { level?: string };
  [key: string]: unknown;
}

export interface FeatureConfig {
  enabled?: boolean;
  [key: string]: unknown;
}

// ───────────────────────────────────────────────────────────────
// Storage
// ───────────────────────────────────────────────────────────────
export interface StorageNamespace {
  get(key: string, namespace?: string): unknown;
  set(key: string, value: unknown, namespace?: string, options?: { ttl?: number }): boolean;
  remove(key: string, namespace?: string): boolean;
  has(key: string, namespace?: string): boolean;
  clear(namespace?: string): boolean;
}

// ───────────────────────────────────────────────────────────────
// UI Domain types
// ───────────────────────────────────────────────────────────────
export interface ToastOptions {
  message: string;
  type?: string;
  duration?: number;
  action?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface ModalOptions {
  title?: string;
  content?: string;
  actions?: Record<string, unknown>[];
  [key: string]: unknown;
}

export interface ConfirmOptions {
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  [key: string]: unknown;
}

// ───────────────────────────────────────────────────────────────
// Lazy Loader
// ───────────────────────────────────────────────────────────────
export interface LazyLoaderConfig {
  maxConcurrent?: number;
  timeout?: number;
  retries?: number;
  [key: string]: unknown;
}

export interface LazyLoaderMetrics {
  loaded: number;
  failed: number;
  pending: number;
  totalLoadTime: number;
  avgLoadTime: number;
}

// ───────────────────────────────────────────────────────────────
// Strict Mode
// ───────────────────────────────────────────────────────────────
export interface StrictViolation {
  moduleId: string;
  type: string;
  message: string;
  timestamp: number;
  [key: string]: unknown;
}

// ───────────────────────────────────────────────────────────────
// Re-export core types for convenience
// ───────────────────────────────────────────────────────────────
export type { EventBus, Logger };
