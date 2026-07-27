// Migrado para TypeScript: 2026-02-25
// Footer Adapter - Enterprise Bridge
// @version 1.0.0-ENTERPRISE
// Adapter para /public/components/footer/index.js

// --- Interfaces ---

interface FooterInstance {
  _mounted?: boolean;
  announce?: (message: string, priority: string) => void;
  getCurrentRoute?: () => string | null;
  getOrchestratorState?: () => OrchestratorState;
  getStatus?: () => FooterStatus;
  setDebug?: (enabled: boolean) => void;
  getMetrics?: () => Record<string, unknown>;
  healthCheck?: () => FooterHealthCheckResult;
  info?: () => Record<string, unknown>;
}

interface LegacyFooterModule {
  mount: (container: string) => Promise<void>;
  unmount: () => Promise<void>;
  getFooterInstance: () => FooterInstance;
}

interface OrchestratorState {
  preset: string;
  status: string;
}

interface FooterStatus {
  mounted: boolean;
  [key: string]: unknown;
}

interface FooterHealthCheckResult {
  status: string;
  score?: number;
  checks?: { mounted: boolean };
  timestamp?: string;
}

interface FooterAdapterInfo {
  version: string;
  moduleId: string;
  debug: boolean;
}

interface FooterInfoResult {
  adapter: FooterAdapterInfo;
  footer: Record<string, unknown> | { mounted: boolean };
}

type LogLevel = 'info' | 'warn' | 'error';

const VERSION: string = '1.0.0-ENTERPRISE';
const MODULE_ID: string = 'app.ui.layout.footer';

let _debug: boolean = false;
let _footerModule: LegacyFooterModule | null = null;
let _footerInstance: FooterInstance | null = null;

function _log(level: LogLevel, ...args: unknown[]): void {
  if (!_debug && level !== 'error') return;
  const prefix = `[${MODULE_ID}]`;
  if (level === 'error') console.error(prefix, ...args);
  else if (level === 'warn') console.warn(prefix, ...args);
  else console.log(prefix, ...args);
}

async function _ensureModule(): Promise<LegacyFooterModule> {
  if (_footerModule) return _footerModule;

  try {
    _footerModule = await import('/components/footer/index.js') as unknown as LegacyFooterModule;
    _log('info', 'Footer module loaded');
    return _footerModule;
  } catch (error) {
    _log('error', 'Failed to load footer module:', (error as Error).message);
    throw error;
  }
}

// === Public API ===

export async function mount(container: string = '#footer-root'): Promise<void> {
  const mod = await _ensureModule();
  await mod.mount(container);
  _footerInstance = mod.getFooterInstance();
  _log('info', 'Footer mounted via adapter');
}

export async function unmount(): Promise<void> {
  const mod = await _ensureModule();
  await mod.unmount();
  _footerInstance = null;
  _log('info', 'Footer unmounted via adapter');
}

export function announce(message: string, priority: string = 'polite'): void {
  _footerInstance?.announce?.(message, priority);
}

export function getCurrentRoute(): string | null | undefined {
  return _footerInstance?.getCurrentRoute?.();
}

export function getOrchestratorState(): OrchestratorState {
  return _footerInstance?.getOrchestratorState?.() || { preset: 'default', status: 'unknown' };
}

export function getStatus(): FooterStatus {
  return _footerInstance?.getStatus?.() || { mounted: false };
}

export function isReady(): boolean {
  return Boolean(_footerInstance?._mounted);
}

// === Enterprise API ===

export function setDebug(enabled: boolean): void {
  _debug = Boolean(enabled);
  _footerInstance?.setDebug?.(enabled);
}

export function getMetrics(): Record<string, unknown> {
  return _footerInstance?.getMetrics?.() || {};
}

export function healthCheck(): FooterHealthCheckResult {
  if (!_footerInstance) {
    return { status: 'not-mounted', score: 0, checks: { mounted: false }, timestamp: new Date().toISOString() };
  }
  return _footerInstance.healthCheck?.() || { status: 'unknown' };
}

export function info(): FooterInfoResult {
  return {
    adapter: { version: VERSION, moduleId: MODULE_ID, debug: _debug },
    footer: _footerInstance?.info?.() || { mounted: false }
  };
}

// === Convenience Functions ===

export async function mountFooter(container?: string): Promise<void> {
  return mount(container);
}

export async function unmountFooter(): Promise<void> {
  return unmount();
}

export function getFooterStatus(): FooterStatus {
  return getStatus();
}

export function getFooterInstance(): FooterInstance | null {
  return _footerInstance;
}

// === Default Export ===

export default {
  mount,
  unmount,
  announce,
  getCurrentRoute,
  getOrchestratorState,
  getStatus,
  isReady,
  setDebug,
  getMetrics,
  healthCheck,
  info,
  mountFooter,
  unmountFooter,
  getFooterStatus,
  getFooterInstance
};
