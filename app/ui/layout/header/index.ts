// Migrado para TypeScript: 2026-02-25
// Header Adapter - Bridge para componente legado
// @version 1.0.0-ENTERPRISE
// Localização: /app/ui/layout/header/index.ts
// Delega para: /public/components/header/index.js

'use strict';

// --- Interfaces ---

interface HeaderInstance {
  isMounted?: boolean;
  isMounting?: boolean;
  version?: string;
}

interface LegacyHeaderModule {
  mount?: (container: HTMLElement | string) => Promise<void>;
  unmount?: () => Promise<void>;
  getHeaderInstance?: () => HeaderInstance;
  VERSION?: string;
}

interface HeaderUser {
  id?: string | number;
  name?: string;
  email?: string;
  role?: string;
  [key: string]: unknown;
}

interface HeaderHealthCheck {
  status: string;
  version: string;
  moduleId: string;
  legacy: boolean;
}

interface HeaderRefreshOptions {
  force?: boolean;
  [key: string]: unknown;
}

interface HeaderInfo {
  version: string;
  moduleId: string;
  legacyVersion: string;
  isReady: boolean;
  isLoading: boolean;
  headerAPI: boolean;
}

interface HeaderAPI {
  refresh?: (options: HeaderRefreshOptions) => boolean;
  updateUser?: (user: HeaderUser) => boolean;
  clearUser?: () => boolean;
  getUser?: () => HeaderUser | null;
  healthCheck?: () => HeaderHealthCheck;
}

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

export const VERSION: string = '1.0.0-ENTERPRISE';
export const MODULE_ID: string = 'app-ui-layout-header';

const _debug = (): boolean => window.APP_CONFIG?.app?.debug ?? false;
const _log = (level: LogLevel, ...args: unknown[]): void => {
  if (level === 'error') { console.error(`[${MODULE_ID}]`, ...args); return; }
  if (level === 'warn') { console.warn(`[${MODULE_ID}]`, ...args); return; }
  if (_debug()) console.log(`[${MODULE_ID}]`, ...args);
};

let _headerInstance: HeaderInstance | null = null;
let _legacyModule: LegacyHeaderModule | null = null;

// API pública limpa para AppShell/Main
export const HeaderAdapter = {
  // Status
  isReady: (): boolean => !!_headerInstance?.isMounted,
  isLoading: (): boolean => !!_headerInstance?.isMounting,
  getVersion: (): string => _headerInstance?.version || VERSION,

  // Lifecycle
  async mount(container: HTMLElement | string): Promise<boolean> {
    _log('info', 'mount() chamado');
    try {
      if (!_legacyModule) {
        _legacyModule = await import('/components/header/index.js') as unknown as LegacyHeaderModule;
      }
      if (_legacyModule?.mount) {
        await _legacyModule.mount(container);
        _headerInstance = _legacyModule.getHeaderInstance?.() || { isMounted: true, version: _legacyModule.VERSION };
        _log('info', 'Header montado via adapter');
        return true;
      }
      throw new Error('Legacy module não tem mount()');
    } catch (err) {
      _log('error', 'Falha ao montar Header:', err);
      return false;
    }
  },

  async unmount(): Promise<boolean> {
    _log('info', 'unmount() chamado');
    try {
      if (_legacyModule?.unmount) {
        await _legacyModule.unmount();
        _headerInstance = null;
        _log('info', 'Header desmontado via adapter');
        return true;
      }
      return false;
    } catch (err) {
      _log('error', 'Falha ao desmontar Header:', err);
      return false;
    }
  },

  // Refresh
  async refresh(options: HeaderRefreshOptions = {}): Promise<boolean> {
    _log('debug', 'refresh() chamado', options);
    const api = window.headerAPI as HeaderAPI | undefined;
    if (api?.refresh) return api.refresh(options);
    return false;
  },

  // Auth integration
  updateUser(user: HeaderUser): boolean {
    const api = window.headerAPI as HeaderAPI | undefined;
    if (api?.updateUser) return api.updateUser(user);
    return false;
  },

  clearUser(): boolean {
    const api = window.headerAPI as HeaderAPI | undefined;
    if (api?.clearUser) return api.clearUser();
    return false;
  },

  getUser(): HeaderUser | null {
    const api = window.headerAPI as HeaderAPI | undefined;
    if (api?.getUser) return api.getUser();
    return null;
  },

  // Health check
  healthCheck(): HeaderHealthCheck {
    const api = window.headerAPI as HeaderAPI | undefined;
    if (api?.healthCheck) return api.healthCheck();
    return {
      status: _headerInstance?.isMounted ? 'healthy' : 'not-mounted',
      version: VERSION,
      moduleId: MODULE_ID,
      legacy: !!_legacyModule
    };
  },

  // Info
  info(): HeaderInfo {
    return {
      version: VERSION,
      moduleId: MODULE_ID,
      legacyVersion: _legacyModule?.VERSION || 'not-loaded',
      isReady: this.isReady(),
      isLoading: this.isLoading(),
      headerAPI: !!window.headerAPI
    };
  }
};

// Funções de conveniência
export async function mountHeader(container: HTMLElement | string): Promise<boolean> {
  return HeaderAdapter.mount(container);
}

export async function unmountHeader(): Promise<boolean> {
  return HeaderAdapter.unmount();
}

export function getHeaderStatus(): HeaderHealthCheck {
  return HeaderAdapter.healthCheck();
}

export function getHeaderInstance(): HeaderInstance | null {
  return _headerInstance;
}

export default HeaderAdapter;
