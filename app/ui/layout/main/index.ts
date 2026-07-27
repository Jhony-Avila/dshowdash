// Migrado para TypeScript: 2026-02-25
// Main Adapter - Bridge para componente legado
// @version 1.0.0-ENTERPRISE
// Localização: /app/ui/layout/main/index.ts
// Delega para: /public/components/main/index.js

'use strict';

// --- Interfaces ---

interface AuthState {
  authenticated: boolean;
  [key: string]: unknown;
}

interface MainInstance {
  mounted?: boolean;
  authState?: AuthState;
  version?: string;
  mount?: (container: HTMLElement | string, config: MountConfig) => Promise<void>;
  unmount?: () => void;
  navigate?: (panelId: string, params: Record<string, unknown>) => boolean;
  navigateCanvas?: (panelIds: string[], params: Record<string, unknown>) => boolean;
  applyPreset?: (presetId: string, context: Record<string, unknown>) => unknown;
  getOrchestratorStatus?: () => Record<string, unknown> | null;
  getCurrentGlobalRoute?: () => string | null;
  healthCheck?: () => MainHealthCheck;
  info?: () => Record<string, unknown>;
  getStatus?: () => Record<string, unknown>;
  getMetrics?: () => Record<string, unknown>;
  setDebug?: (enabled: boolean) => void;
}

interface LegacyMainModule {
  default?: MainInstance;
  VERSION?: string;
  [key: string]: unknown;
}

interface MountConfig {
  [key: string]: unknown;
}

interface MainHealthCheck {
  status: string;
  version: string;
  moduleId: string;
  legacy: boolean;
}

interface MainInfo {
  version?: string;
  moduleId?: string;
  legacyVersion?: string;
  isReady?: boolean;
  isAuthenticated?: boolean;
  adapter?: { version: string; moduleId: string };
  [key: string]: unknown;
}

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

export const VERSION: string = '1.0.0-ENTERPRISE';
export const MODULE_ID: string = 'app-ui-layout-main';

const _debug = (): boolean => window.APP_CONFIG?.app?.debug ?? false;
const _log = (level: LogLevel, ...args: unknown[]): void => {
  if (level === 'error') { console.error(`[${MODULE_ID}]`, ...args); return; }
  if (level === 'warn') { console.warn(`[${MODULE_ID}]`, ...args); return; }
  if (_debug()) console.log(`[${MODULE_ID}]`, ...args);
};

let _mainInstance: MainInstance | null = null;
let _legacyModule: LegacyMainModule | null = null;

// API pública limpa para AppShell
export const MainAdapter = {
  // Status
  isReady: (): boolean => !!_mainInstance?.mounted,
  isAuthenticated: (): boolean => _mainInstance?.authState?.authenticated ?? false,
  getVersion: (): string => _mainInstance?.version || VERSION,

  // Lifecycle
  async mount(container: HTMLElement | string, config: MountConfig = {}): Promise<boolean> {
    _log('info', 'mount() chamado');
    try {
      if (!_legacyModule) {
        _legacyModule = await import('/components/main/index.js') as unknown as LegacyMainModule;
      }
      _mainInstance = (_legacyModule.default || _legacyModule) as unknown as MainInstance;
      if (_mainInstance?.mount) {
        await _mainInstance.mount(container, config);
        _log('info', 'Main montado via adapter');
        return true;
      }
      throw new Error('Legacy module não tem mount()');
    } catch (err) {
      _log('error', 'Falha ao montar Main:', err);
      return false;
    }
  },

  async unmount(): Promise<boolean> {
    _log('info', 'unmount() chamado');
    try {
      if (_mainInstance?.unmount) {
        _mainInstance.unmount();
        _mainInstance = null;
        _log('info', 'Main desmontado via adapter');
        return true;
      }
      return false;
    } catch (err) {
      _log('error', 'Falha ao desmontar Main:', err);
      return false;
    }
  },

  // Navigation
  navigate(panelId: string, params: Record<string, unknown> = {}): boolean {
    if (_mainInstance?.navigate) {
      return _mainInstance.navigate(panelId, params);
    }
    return false;
  },

  navigateCanvas(panelIds: string[] = [], params: Record<string, unknown> = {}): boolean {
    if (_mainInstance?.navigateCanvas) {
      return _mainInstance.navigateCanvas(panelIds, params);
    }
    return false;
  },

  // Orchestrator
  applyPreset(presetId: string, context: Record<string, unknown> = {}): unknown {
    if (_mainInstance?.applyPreset) {
      return _mainInstance.applyPreset(presetId, context);
    }
    return null;
  },

  getOrchestratorStatus(): Record<string, unknown> | null {
    return _mainInstance?.getOrchestratorStatus?.() || null;
  },

  // Current route
  getCurrentRoute(): string | null {
    return _mainInstance?.getCurrentGlobalRoute?.() || null;
  },

  // Health check
  healthCheck(): MainHealthCheck {
    if (_mainInstance?.healthCheck) {
      return _mainInstance.healthCheck();
    }
    return {
      status: _mainInstance?.mounted ? 'healthy' : 'not-mounted',
      version: VERSION,
      moduleId: MODULE_ID,
      legacy: !!_legacyModule
    };
  },

  // Info
  info(): MainInfo {
    if (_mainInstance?.info) {
      return {
        ...(_mainInstance.info()),
        adapter: { version: VERSION, moduleId: MODULE_ID }
      };
    }
    return {
      version: VERSION,
      moduleId: MODULE_ID,
      legacyVersion: _legacyModule?.VERSION || 'not-loaded',
      isReady: this.isReady(),
      isAuthenticated: this.isAuthenticated()
    };
  },

  // Status
  getStatus(): Record<string, unknown> | MainInfo {
    return _mainInstance?.getStatus?.() || this.info();
  },

  // Metrics
  getMetrics(): Record<string, unknown> {
    return _mainInstance?.getMetrics?.() || {};
  },

  // Debug
  setDebug(enabled: boolean): void {
    _mainInstance?.setDebug?.(enabled);
  }
};

// Funções de conveniência
export async function mountMain(container: HTMLElement | string, config?: MountConfig): Promise<boolean> {
  return MainAdapter.mount(container, config);
}

export async function unmountMain(): Promise<boolean> {
  return MainAdapter.unmount();
}

export function getMainStatus(): MainHealthCheck {
  return MainAdapter.healthCheck();
}

export function getMainInstance(): MainInstance | null {
  return _mainInstance;
}

export function navigateToPanel(panelId: string, params?: Record<string, unknown>): boolean {
  return MainAdapter.navigate(panelId, params);
}

export default MainAdapter;
