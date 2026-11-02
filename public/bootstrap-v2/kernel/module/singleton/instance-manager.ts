// Singleton Instance Manager
// @version 2.0.0-STEP8
// @changelog v2.0.0-STEP8 - Etapa 8 Fase 2: windowAdapter.expose('Kernel') + expose('ApplicationKernel').
//   (window as any).Kernel/ApplicationKernel mantidos como backward compat (consumers externos pendentes)
// @changelog v1.2.1-CONTRACTS: Dependency Contract formalizado
//
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v2.0.0)
// ═══════════════════════════════════════════════════════════════
// IMPORTS: SINGLETON_KEY from ../constants-local.js
// PROVIDES: getInstance(), resetInstance(), hasInstance()
// RECEIVES (via getInstance options):
//   options.windowAdapter — optional, for exposing via adapter
// WINDOW ACCESS (backward compat — será removido na Fase 3D):
//   window[SINGLETON_KEY] — kernel singleton exposure
//   window.ApplicationKernel — public API alias
//   (window as any).Kernel — public API alias
// CREATES (via windowAdapter.expose — canal oficial):
//   Kernel, ApplicationKernel
// ═══════════════════════════════════════════════════════════════
'use strict';

import { SINGLETON_KEY } from '../constants-local.js';

export const VERSION = '1.0.0-P4-ENTERPRISE';
export const MODULE_ID = 'bootstrap-v2.kernel.module.singleton.instance-manager';

interface KernelInstance {
  reset: () => void;
  [key: string]: unknown;
}

interface WindowAdapter {
  expose?: (name: string, instance: KernelInstance) => void;
  unexpose?: (name: string) => void;
}

interface InstanceManagerOptions {
  windowAdapter?: WindowAdapter;
  [key: string]: unknown;
}

let _instance: KernelInstance | null = null;
let _windowAdapter: WindowAdapter | null = null;

export function getInstance(factory: (options: InstanceManagerOptions) => KernelInstance, options: InstanceManagerOptions) {
  if (!_instance) {
    _instance = factory(options);

    // v2.0.0-STEP8: Capturar windowAdapter do options para expose
    if (options && options.windowAdapter) {
      _windowAdapter = options.windowAdapter;
    }

    if (typeof window !== 'undefined') {
      (window as unknown as Record<string, unknown>)[SINGLETON_KEY] = _instance;
      // backward compat — consumers externos ainda leem (window as any).Kernel/ApplicationKernel
      window.ApplicationKernel = _instance;
      (window as any).Kernel = _instance;
    }

    // v2.0.0-STEP8: Canal oficial via windowAdapter
    if (_windowAdapter && _windowAdapter.expose) {
      _windowAdapter.expose('Kernel', _instance);
      _windowAdapter.expose('ApplicationKernel', _instance);
    }
  }
  return _instance;
}

export function resetInstance() {
  // v2.0.0-STEP8: Cleanup via windowAdapter
  if (_windowAdapter && _windowAdapter.unexpose) {
    _windowAdapter.unexpose('Kernel');
    _windowAdapter.unexpose('ApplicationKernel');
  }

  if (_instance) {
    _instance.reset();
  }
  _instance = null;
  _windowAdapter = null;

  if (typeof window !== 'undefined') {
    delete (window as unknown as Record<string, unknown>)[SINGLETON_KEY];
    delete window.ApplicationKernel;
    delete (window as any).Kernel;
  }
}

export function hasInstance() {
  return _instance !== null;
}

export default { getInstance, resetInstance, hasInstance };
