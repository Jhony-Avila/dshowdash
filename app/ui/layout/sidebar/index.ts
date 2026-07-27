// Migrado para TypeScript: 2026-02-25
// Sidebar Adapter - Bridge para componente legado
// @version 1.0.0-ENTERPRISE
// Localização: /app/ui/layout/sidebar/index.ts
// Delega para: /public/components/sidebar/index.js

'use strict';

// --- Interfaces ---

interface SidebarState {
  isCollapsed?: () => boolean;
  isMobileOpen?: () => boolean;
  openMobile?: () => void;
  closeMobile?: () => void;
}

interface SidebarMainBody {
  setActiveNavItem?: (path: string) => void;
  filterNavItems?: (query: string) => number;
}

interface SidebarAreas {
  mainBody?: SidebarMainBody;
}

interface SidebarInstance {
  initialized?: boolean;
  version?: string;
  state?: SidebarState;
  areas?: SidebarAreas;
  init?: (containerSelector: string) => Promise<void>;
  destroy?: () => void;
  _handleToggle?: () => void;
  healthCheck?: () => SidebarHealthCheck;
  info?: () => Record<string, unknown>;
  on?: (event: string, handler: (...args: unknown[]) => void) => void;
}

interface LegacySidebarModule {
  createSidebar?: () => SidebarInstance;
  VERSION?: string;
}

interface SidebarHealthCheck {
  status: string;
  version: string;
  moduleId: string;
  legacy: boolean;
}

interface SidebarInfo {
  version?: string;
  moduleId?: string;
  legacyVersion?: string;
  isReady?: boolean;
  isCollapsed?: boolean;
  adapter?: { version: string; moduleId: string };
  [key: string]: unknown;
}

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

export const VERSION: string = '1.0.0-ENTERPRISE';
export const MODULE_ID: string = 'app-ui-layout-sidebar';

const _debug = (): boolean => window.APP_CONFIG?.app?.debug ?? false;
const _log = (level: LogLevel, ...args: unknown[]): void => {
  if (level === 'error') { console.error(`[${MODULE_ID}]`, ...args); return; }
  if (level === 'warn') { console.warn(`[${MODULE_ID}]`, ...args); return; }
  if (_debug()) console.log(`[${MODULE_ID}]`, ...args);
};

let _sidebarInstance: SidebarInstance | null = null;
let _legacyModule: LegacySidebarModule | null = null;

// API pública limpa para AppShell/Main
export const SidebarAdapter = {
  // Status
  isReady: (): boolean => !!_sidebarInstance?.initialized,
  isCollapsed: (): boolean => _sidebarInstance?.state?.isCollapsed?.() ?? false,
  isMobileOpen: (): boolean => _sidebarInstance?.state?.isMobileOpen?.() ?? false,
  getVersion: (): string => _sidebarInstance?.version || VERSION,

  // Lifecycle
  async mount(containerSelector: string = '#sidebar-root'): Promise<boolean> {
    _log('info', 'mount() chamado');
    try {
      if (!_legacyModule) {
        _legacyModule = await import('/components/sidebar/index.js') as unknown as LegacySidebarModule;
      }
      if (_legacyModule?.createSidebar) {
        _sidebarInstance = _legacyModule.createSidebar();
        await _sidebarInstance.init?.(containerSelector);
        _log('info', 'Sidebar montado via adapter');
        return true;
      }
      throw new Error('Legacy module não tem createSidebar()');
    } catch (err) {
      _log('error', 'Falha ao montar Sidebar:', err);
      return false;
    }
  },

  async unmount(): Promise<boolean> {
    _log('info', 'unmount() chamado');
    try {
      if (_sidebarInstance?.destroy) {
        _sidebarInstance.destroy();
        _sidebarInstance = null;
        _log('info', 'Sidebar desmontado via adapter');
        return true;
      }
      return false;
    } catch (err) {
      _log('error', 'Falha ao desmontar Sidebar:', err);
      return false;
    }
  },

  // Toggle
  toggle(): boolean {
    if (_sidebarInstance?._handleToggle) {
      _sidebarInstance._handleToggle();
      return true;
    }
    return false;
  },

  expand(): boolean {
    if (_sidebarInstance?.state?.isCollapsed?.()) {
      return this.toggle();
    }
    return false;
  },

  collapse(): boolean {
    if (!_sidebarInstance?.state?.isCollapsed?.()) {
      return this.toggle();
    }
    return false;
  },

  // Mobile
  openMobile(): void {
    _sidebarInstance?.state?.openMobile?.();
  },

  closeMobile(): void {
    _sidebarInstance?.state?.closeMobile?.();
  },

  // Navigation
  setActiveItem(path: string): void {
    _sidebarInstance?.areas?.mainBody?.setActiveNavItem?.(path);
  },

  // Search
  filterNav(query: string): number {
    return _sidebarInstance?.areas?.mainBody?.filterNavItems?.(query) || 0;
  },

  // Health check
  healthCheck(): SidebarHealthCheck {
    if (_sidebarInstance?.healthCheck) {
      return _sidebarInstance.healthCheck();
    }
    return {
      status: _sidebarInstance?.initialized ? 'healthy' : 'not-mounted',
      version: VERSION,
      moduleId: MODULE_ID,
      legacy: !!_legacyModule
    };
  },

  // Info
  info(): SidebarInfo {
    if (_sidebarInstance?.info) {
      return {
        ...(_sidebarInstance.info()),
        adapter: { version: VERSION, moduleId: MODULE_ID }
      };
    }
    return {
      version: VERSION,
      moduleId: MODULE_ID,
      legacyVersion: _legacyModule?.VERSION || 'not-loaded',
      isReady: this.isReady(),
      isCollapsed: this.isCollapsed()
    };
  },

  // State access
  getState(): SidebarState | null {
    return _sidebarInstance?.state || null;
  },

  // Events
  on(event: string, handler: (...args: unknown[]) => void): void {
    _sidebarInstance?.on?.(event, handler);
  }
};

// Funções de conveniência
export async function mountSidebar(container?: string): Promise<boolean> {
  return SidebarAdapter.mount(container);
}

export async function unmountSidebar(): Promise<boolean> {
  return SidebarAdapter.unmount();
}

export function getSidebarStatus(): SidebarHealthCheck {
  return SidebarAdapter.healthCheck();
}

export function getSidebarInstance(): SidebarInstance | null {
  return _sidebarInstance;
}

export function toggleSidebar(): boolean {
  return SidebarAdapter.toggle();
}

export default SidebarAdapter;
