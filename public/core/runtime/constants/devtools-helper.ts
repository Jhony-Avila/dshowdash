// Migrado para TypeScript: 2026-02-25
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v1.1.0)
// ═══════════════════════════════════════════════════════════════
// MODULE: devtools-helper
// DESCRIPTION: Expoe funcoes de diagnostico no window.__dev.runtime
// IMPORTS: nenhum (modulo autonomo)
// EXPORTS: MODULE_ID, VERSION, registerModule, unregisterModule,
//          install, uninstall, isInstalled, getRegistered, info
// PROVIDES: window.__dev.runtime.* (debug API)
// WINDOW ACCESS:
//   - window.__dev.runtime.* → DEBUG LEGITIMO (razao de existir do modulo)
//   - typeof window checks   → Guards para SSR/Node safety
//   - Nenhum window.* migrado: 100% debug namespace (__dev)
// @melhoria #23 - Facilitar debug em producao
// ═══════════════════════════════════════════════════════════════
'use strict';

export const MODULE_ID = 'devtools-helper' as const;
export const VERSION = '1.0.1-P2-ENTERPRISE' as const;

interface ModuleApi {
  info?: () => Record<string, unknown>;
  healthCheck?: () => Record<string, unknown>;
  [key: string]: unknown;
}

interface DevToolsHelperInfo {
  moduleId: typeof MODULE_ID;
  version: typeof VERSION;
  installed: boolean;
  registeredModules: string[];
}

const _registered: Record<string, ModuleApi> = {};
let _installed: boolean = false;

export function registerModule(name: string, api: ModuleApi): void {
  _registered[name] = api;
  if (_installed) _updateWindow();
}

export function unregisterModule(name: string): void {
  delete _registered[name];
  if (_installed) _updateWindow();
}

function _updateWindow(): void {
  if (typeof window === 'undefined') return;
  (window as unknown as Record<string, unknown>).__dev = (window as unknown as Record<string, unknown>).__dev || {};
  ((window as unknown as Record<string, unknown>).__dev as Record<string, unknown>).runtime = ((window as unknown as Record<string, unknown>).__dev as Record<string, unknown>).runtime || {};
  const runtimeNs = ((window as unknown as Record<string, unknown>).__dev as Record<string, unknown>).runtime as Record<string, unknown>;
  const names = Object.keys(_registered);
  for (let i = 0; i < names.length; i++) {
    runtimeNs[names[i]] = _registered[names[i]];
  }
  runtimeNs._modules = names;
  runtimeNs._version = VERSION;
}

export function install(): boolean {
  if (typeof window === 'undefined') return false;
  _installed = true;
  _updateWindow();

  (window as unknown as Record<string, unknown>).__dev = (window as unknown as Record<string, unknown>).__dev || {};
  ((window as unknown as Record<string, unknown>).__dev as Record<string, unknown>).runtime = ((window as unknown as Record<string, unknown>).__dev as Record<string, unknown>).runtime || {};
  const runtimeNs = ((window as unknown as Record<string, unknown>).__dev as Record<string, unknown>).runtime as Record<string, unknown>;

  runtimeNs.help = (): void => {
    console.log('=== DshowDash Runtime DevTools ===');
    console.log('Modulos disponiveis:', Object.keys(_registered).join(', '));
    console.log('');
    console.log('Uso: window.__dev.runtime.<modulo>.info()');
    console.log('     window.__dev.runtime.<modulo>.healthCheck()');
    console.log('');
    console.log('Atalhos:');
    console.log('  .status()     - Status geral de todos os modulos');
    console.log('  .health()     - Health de todos os modulos');
    console.log('  .help()       - Esta mensagem');
  };
  runtimeNs.status = (): Record<string, Record<string, unknown>> => {
    const result: Record<string, Record<string, unknown>> = {};
    const names = Object.keys(_registered);
    for (let i = 0; i < names.length; i++) {
      const mod = _registered[names[i]];
      result[names[i]] = mod.info ? mod.info() : { available: true };
    }
    return result;
  };
  runtimeNs.health = (): Record<string, Record<string, unknown>> => {
    const result: Record<string, Record<string, unknown>> = {};
    const names = Object.keys(_registered);
    for (let i = 0; i < names.length; i++) {
      const mod = _registered[names[i]];
      result[names[i]] = mod.healthCheck ? mod.healthCheck() : { status: 'NO_HEALTHCHECK' };
    }
    return result;
  };
  return true;
}

export function uninstall(): void {
  _installed = false;
  if (typeof window !== 'undefined' && (window as unknown as Record<string, unknown>).__dev) {
    delete ((window as unknown as Record<string, unknown>).__dev as Record<string, unknown>).runtime;
  }
}

export function isInstalled(): boolean {
  return _installed;
}

export function getRegistered(): string[] {
  return Object.keys(_registered);
}

export function info(): DevToolsHelperInfo {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    installed: _installed,
    registeredModules: Object.keys(_registered)
  };
}

export default {
  MODULE_ID,
  VERSION,
  registerModule,
  unregisterModule,
  install,
  uninstall,
  isInstalled,
  getRegistered,
  info
};
