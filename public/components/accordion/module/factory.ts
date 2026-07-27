// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.3.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: components.accordion.module.factory
// PURPOSE: Factory functions for creating accordion instances
// ───────────────────────────────────────────────────────────────
// @contract CREATE_ACCORDION - createAccordion(options) creates controller
// @contract CREATE_ACCORDION_WITH_MOCK - createAccordionWithMock(options) with mock
// @contract MOUNT_ACCORDION - mountAccordion(container, options) mounts
// @contract MOUNT_ACCORDION_WITH_MOCK - mountAccordionWithMock(container, options)
// @contract HEALTH - healthCheck() and info() for observability
// ───────────────────────────────────────────────────────────────
// IMPORTS: injectStyles from ./style-injector.js
// IMPORTS: initPorts, getPort from ./ports-manager.js
// IMPORTS: singleton-state functions from ./singleton-state.js
// PROVIDES: createAccordion, createAccordionWithMock, mountAccordion,
//           mountAccordionWithMock, healthCheck, info, VERSION, MODULE_ID
// @changelog v1.3.0-P2-ENTERPRISE: Standardized DEPENDENCY CONTRACT header
// @changelog v1.2.0-MODULAR: Initial modular architecture
// ═══════════════════════════════════════════════════════════════
'use strict';

import { injectStyles } from './style-injector.js';
import { initPorts, getPort } from './ports-manager.js';
import * as state from './singleton-state.js';

export const VERSION = '1.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'components.accordion.module.factory';

export async function createAccordion(options: Record<string, unknown> = {}) {
  if (state.hasInstance() && !options.forceNew) {
    return { success: true, instance: state.getInstance(), message: 'Existing instance returned' };
  }

  state.setOptions(options);

  try {
    initPorts();
    const eventBus = getPort('eventBus');

    await injectStyles();

    const { createAccordionController } = await import('../domain/accordion.controller.js');
    const { createLocalStoragePersistence, createNullPersistence } = await import('../persistence/accordion.persistence.js');
    const { createAccordionView } = await import('../ui/accordion.view.js');
    const { createAccordionTelemetry } = await import('../telemetry/accordion.telemetry.js');

    let persistenceAdapter = null;
    if (options.persistence !== false) {
      persistenceAdapter = createLocalStoragePersistence({
        userId: options.userId as string,
        tenantId: options.tenantId as string,
        layoutId: options.layoutId as string
      });
    } else {
      persistenceAdapter = createNullPersistence();
    }

    const telemetry = createAccordionTelemetry({
      eventBus,
      enabled: options.telemetry !== false,
      debug: (options.debug as boolean) ?? false
    });
    state.setTelemetry(telemetry);

    const view = createAccordionView({
      eventBus,
      iconRegistry: options.iconRegistry ?? getPort('iconRegistry'),
      iconResolver: (options.iconResolver ?? null) as ((iconName: string) => string) | null,
      uarpsRegion: (options.uarpsRegion as string) ?? null,
      uarpsEnabled: options.uarpsEnabled !== false
    });
    state.setView(view);

    if (options.container) {
      const viewInit = view.init(options.container as string | HTMLElement);
      if (!viewInit.success) {
        return { success: false, error: `View init failed: ${viewInit.error}` };
      }
    }

    const controller = createAccordionController({
      autoPersist: options.autoPersist ?? true
    });

    const initResult = await controller.init({
      structure: (options.structure as Record<string, unknown>) ?? null,
      mode: options.mode as string,
      persistenceAdapter,
      permissionsPort: options.permissionsPort ?? getPort('permissions'),
      autoRestore: (options.autoRestore as boolean) ?? true
    });

    if (!initResult.success) {
      return { success: false, error: initResult.error ?? initResult.errors };
    }

    if (view) {
      // @ts-expect-error strict migration — TS2345
      controller.setRenderer(view);
    }

    state.setInstance(controller);

    return {
      success: true,
      instance: controller,
      view,
      telemetry,
      state: controller.getState()
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function createAccordionWithMock(options: Record<string, unknown> = {}) {
  const { getMockModel } = await import('../mock/accordion.mock.js');
  const mockModel = getMockModel();

  return createAccordion({
    ...options,
    structure: mockModel
  });
}

export async function mountAccordion(container: HTMLElement | string, options: Record<string, unknown> = {}) {
  const result = await createAccordion({
    ...options,
    container
  });

  if (!result.success) {
    return result;
  }

  if (options.structure) {
    // @ts-expect-error strict migration — TS2345
    result.view?.render(options.structure as Record<string, unknown>, result.instance.getState());
  }

  return result;
}

export async function mountAccordionWithMock(container: HTMLElement | string, options: Record<string, unknown> = {}) {
  const { getMockModel } = await import('../mock/accordion.mock.js');
  const mockModel = getMockModel();

  return mountAccordion(container, {
    ...options,
    structure: mockModel
  });
}

export function healthCheck() {
  const checks = {
    factoryAvailable: true,
    createAccordionAvailable: typeof createAccordion === 'function',
    mountAccordionAvailable: typeof mountAccordion === 'function'
  };

  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;

  return {
    status: passed === total ? 'HEALTHY' : 'DEGRADED',
    score: passed,
    maxScore: total,
    scoreDisplay: `${passed}/${total}`,
    checks,
    version: VERSION,
    moduleId: MODULE_ID,
    timestamp: Date.now()
  };
}

export function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    factories: ['createAccordion', 'createAccordionWithMock', 'mountAccordion', 'mountAccordionWithMock'],
    healthCheck: healthCheck(),
    timestamp: Date.now()
  };
}

export default {
  createAccordion,
  createAccordionWithMock,
  mountAccordion,
  mountAccordionWithMock,
  healthCheck,
  info,
  VERSION,
  MODULE_ID
};
